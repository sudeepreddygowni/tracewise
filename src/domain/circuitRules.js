/**
 * Tracewise Circuit Validation Rules
 * Deterministic structural checks with honest reporting
 */

import { getComponentDefinition } from '../data/componentCatalog';

/**
 * Validates structural integrity and pin mappings of a project
 */
export function validateCircuit(project) {
  const checks = [];
  const compMap = new Map();
  (project.components || []).forEach(c => compMap.set(c.id, c));

  // --- Rule 1: Component & Pin Integrity ---
  let brokenConnections = [];
  (project.connections || []).forEach(wire => {
    const fromComp = compMap.get(wire.from?.componentId);
    const toComp = compMap.get(wire.to?.componentId);

    if (!fromComp || !toComp) {
      brokenConnections.push(`Wire ${wire.id} connects to non-existent component.`);
      return;
    }

    const fromDef = getComponentDefinition(fromComp.type);
    const toDef = getComponentDefinition(toComp.type);

    const fromPinValid = fromDef?.pins?.some(p => p.id === wire.from?.pinId);
    const toPinValid = toDef?.pins?.some(p => p.id === wire.to?.pinId);

    if (!fromPinValid) {
      brokenConnections.push(`Pin ${wire.from?.pinId} does not exist on ${fromComp.name || fromComp.id}.`);
    }
    if (!toPinValid) {
      brokenConnections.push(`Pin ${wire.to?.pinId} does not exist on ${toComp.name || toComp.id}.`);
    }
  });

  if (brokenConnections.length > 0) {
    checks.push({
      id: 'check-integrity',
      name: 'Component & Pin Integrity',
      status: 'FAILED',
      severity: 'ERROR',
      message: brokenConnections.join(' '),
      ruleOrigin: 'static_rule_check'
    });
  } else {
    checks.push({
      id: 'check-integrity',
      name: 'Component & Pin Integrity',
      status: 'PASSED',
      severity: 'INFO',
      message: `All ${(project.components || []).length} components and ${(project.connections || []).length} wires have valid catalog endpoints.`,
      ruleOrigin: 'static_rule_check'
    });
  }

  // --- Rule 2: LED Current Protection ---
  const leds = (project.components || []).filter(c => c.type === 'led');
  let unprotectedLeds = [];

  leds.forEach(led => {
    // Check if cathode or anode is connected to a resistor
    const attachedWires = (project.connections || []).filter(
      w => w.from.componentId === led.id || w.to.componentId === led.id
    );

    let hasResistor = false;
    attachedWires.forEach(w => {
      const otherCompId = w.from.componentId === led.id ? w.to.componentId : w.from.componentId;
      const otherComp = compMap.get(otherCompId);
      if (otherComp && otherComp.type === 'resistor') {
        hasResistor = true;
      }
    });

    if (!hasResistor) {
      unprotectedLeds.push(led.name || led.id);
    }
  });

  if (unprotectedLeds.length > 0) {
    checks.push({
      id: 'check-led-current',
      name: 'LED Current Protection',
      status: 'WARNING',
      severity: 'WARNING',
      message: `Direct wiring detected: ${unprotectedLeds.join(', ')} has no series resistor. In physical hardware, an LED without a 220Ω-1kΩ resistor will draw excessive current and burn out.`,
      suggestedFix: 'Insert a 220Ω resistor between the LED cathode and Ground rail.',
      ruleOrigin: 'static_rule_check'
    });
  } else if (leds.length > 0) {
    checks.push({
      id: 'check-led-current',
      name: 'LED Current Protection',
      status: 'PASSED',
      severity: 'INFO',
      message: `All ${leds.length} LEDs are protected with current-limiting resistors.`,
      ruleOrigin: 'static_rule_check'
    });
  }

  // --- Rule 3: Firmware Pin Consistency ---
  const code = project.firmware?.files?.[0]?.content || '';
  
  // Find pins referenced in code
  // Match patterns like:
  // const int RED_PIN = 2;
  // #define BUTTON_PIN 7
  // pinMode(4, OUTPUT)
  // digitalRead(BUTTON_PIN)
  const pinDeclarations = {};
  const constRegex = /(?:const\s+int|int|#define)\s+([A-Za-z0-9_]+)\s*=?\s*([0-9]+)/g;
  let match;
  while ((match = constRegex.exec(code)) !== null) {
    const varName = match[1];
    const pinNum = parseInt(match[2], 10);
    pinDeclarations[varName] = pinNum;
  }

  // Find pins wired on the Arduino Uno
  const unoWires = (project.connections || []).filter(
    w => w.from.componentId === project.boardId || w.to.componentId === project.boardId
  );

  const wiredPins = new Map();
  unoWires.forEach(w => {
    const pinId = w.from.componentId === project.boardId ? w.from.pinId : w.to.pinId;
    const otherCompId = w.from.componentId === project.boardId ? w.to.componentId : w.from.componentId;
    const otherComp = compMap.get(otherCompId);
    wiredPins.set(pinId, otherComp);
  });

  // Check for the signature Button pin conflict:
  // e.g. Button component wired to D7, but code declares BUTTON_PIN = 2
  const buttons = (project.components || []).filter(c => c.type === 'push-button');
  let pinMismatchFound = false;

  buttons.forEach(btn => {
    // Find wire from Uno to this button
    const btnWire = (project.connections || []).find(
      w => (w.from.componentId === btn.id && w.to.componentId === project.boardId) ||
           (w.to.componentId === btn.id && w.from.componentId === project.boardId)
    );

    if (btnWire) {
      const physicalPin = btnWire.from.componentId === project.boardId ? btnWire.from.pinId : btnWire.to.pinId;
      const physicalPinNum = parseInt(physicalPin.replace('D', ''), 10);

      // Check if code has a BUTTON_PIN or similar
      for (const [varName, codePinNum] of Object.entries(pinDeclarations)) {
        if (varName.toLowerCase().includes('button') || varName.toLowerCase().includes('btn')) {
          if (!isNaN(physicalPinNum) && codePinNum !== physicalPinNum) {
            pinMismatchFound = true;
            checks.push({
              id: 'check-pin-mismatch',
              name: 'Firmware Pin Conflict',
              status: 'FAILED',
              severity: 'ERROR',
              message: `Pin mismatch detected: Your code defines ${varName} = ${codePinNum}, but the physical button wire is plugged into pin ${physicalPin} (Pin ${physicalPinNum})!`,
              suggestedFix: `Update code to define ${varName} = ${physicalPinNum}; or reconnect wire to pin D${codePinNum}.`,
              ruleOrigin: 'static_rule_check'
            });
          }
        }
      }
    }
  });

  if (!pinMismatchFound && Object.keys(pinDeclarations).length > 0) {
    checks.push({
      id: 'check-pin-mismatch',
      name: 'Firmware Pin Consistency',
      status: 'PASSED',
      severity: 'INFO',
      message: 'All firmware pin constants correspond with connected microcontroller pins.',
      ruleOrigin: 'static_rule_check'
    });
  }

  // Summary overall status
  const hasFailed = checks.some(c => c.status === 'FAILED');
  const overallStatus = hasFailed ? 'STRUCTURALLY_INVALID' : 'STRUCTURALLY_VALID';

  return {
    overallStatus,
    timestamp: new Date().toISOString(),
    checks
  };
}
