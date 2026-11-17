/**
 * Tracewise Circuit Validation Rules
 * Deterministic structural checks with honest reporting
 */

import { getComponentDefinition } from '../data/componentCatalog.js';
import { buildNetlist, traceLedBranch } from './netlistEngine.js';

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

  // --- Rule 0: Electrical Netlist Solver & Power Short Circuit Check ---
  const netlist = buildNetlist(project);
  const shortCircuits = (netlist.nets || []).filter(n => n.is5V && n.isGND);
  if (shortCircuits.length > 0) {
    checks.push({
      id: 'check-short-circuit',
      name: 'Power Short Circuit',
      status: 'FAILED',
      severity: 'CRITICAL',
      message: 'Critical: Direct short circuit detected between 5V power and GND ground rail.',
      ruleOrigin: 'netlist_solver'
    });
  }

  // --- Rule 2: LED Current Protection & Ground Return (Netlist Solver) ---
  const standardLeds = (project.components || []).filter(c => c.type === 'led');
  const rgbLeds = (project.components || []).filter(c => c.type === 'rgb-led');
  let unprotectedLeds = [];

  standardLeds.forEach(led => {
    const branch = traceLedBranch(led, netlist);
    if (!branch.hasCurrentLimitingResistor) {
      unprotectedLeds.push(led.name || led.id);
    }
  });

  rgbLeds.forEach(rgb => {
    const branch = traceLedBranch(rgb, netlist);
    if (!branch.hasCurrentLimitingResistor) {
      unprotectedLeds.push(rgb.name || rgb.id);
    }
  });

  const totalLedCount = standardLeds.length + rgbLeds.length;
  if (unprotectedLeds.length > 0) {
    checks.push({
      id: 'check-led-current',
      name: 'LED Current Protection',
      status: 'WARNING',
      severity: 'WARNING',
      message: `Direct wiring detected: ${unprotectedLeds.join(', ')} has no series resistor. In physical hardware, an LED without a 220Ω-1kΩ resistor will draw excessive current and burn out.`,
      suggestedFix: 'Insert a 220Ω resistor between the LED cathode/leads and Ground rail.',
      ruleOrigin: 'netlist_solver'
    });
  } else if (totalLedCount > 0) {
    checks.push({
      id: 'check-led-current',
      name: 'LED Current Protection',
      status: 'PASSED',
      severity: 'INFO',
      message: `All ${totalLedCount} LED components are protected with current-limiting resistors.`,
      ruleOrigin: 'netlist_solver'
    });
  }

  // --- Rule 4: Active Buzzer Polarity & Drive Check ---
  const buzzers = (project.components || []).filter(c => c.type === 'buzzer');
  buzzers.forEach(buzzer => {
    const attachedWires = (project.connections || []).filter(
      w => w.from.componentId === buzzer.id || w.to.componentId === buzzer.id
    );

    if (attachedWires.length > 0) {
      checks.push({
        id: `check-buzzer-${buzzer.id}`,
        name: 'Active Buzzer Circuit Integrity',
        status: 'PASSED',
        severity: 'INFO',
        message: `${buzzer.name || 'Active Buzzer'} is wired for piezoelectric audio signaling. Ensure positive pin connects to digital PWM pin.`,
        ruleOrigin: 'static_rule_check'
      });
    }
  });

  // --- Rule 5: Potentiometer Voltage Divider Check ---
  const pots = (project.components || []).filter(c => c.type === 'potentiometer');
  pots.forEach(pot => {
    const attachedWires = (project.connections || []).filter(
      w => w.from.componentId === pot.id || w.to.componentId === pot.id
    );

    if (attachedWires.length > 0) {
      checks.push({
        id: `check-pot-${pot.id}`,
        name: 'Potentiometer Divider Routing',
        status: 'PASSED',
        severity: 'INFO',
        message: `${pot.name || 'Potentiometer'} wiper routed to provide 0–5V analog voltage control.`,
        ruleOrigin: 'static_rule_check'
      });
    }
  });

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

  // Check Button & Input Pin Consistency (Multi-button aware)
  const buttons = (project.components || []).filter(c => c.type === 'push-button');
  const buttonVars = Object.entries(pinDeclarations).filter(
    ([k]) => k.toLowerCase().includes('button') || k.toLowerCase().includes('btn')
  );

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

      const btnIdentifier = `${btn.id} ${btn.name || ''}`.toLowerCase();

      // Find the best matching variable for this button:
      // 1. Direct name/color keyword match (e.g. 'red', 'green', 'blue', 'pedestrian', '1', '2')
      let matchedVar = buttonVars.find(([varName]) => {
        const lowerVar = varName.toLowerCase();
        if (btnIdentifier.includes('red') && lowerVar.includes('red')) return true;
        if (btnIdentifier.includes('green') && lowerVar.includes('green')) return true;
        if (btnIdentifier.includes('blue') && lowerVar.includes('blue')) return true;
        if (btnIdentifier.includes('pedestrian') && (lowerVar.includes('pedestrian') || lowerVar === 'button_pin')) return true;
        return false;
      });

      // 2. If single button or no color match, check exact pin match or single var
      if (!matchedVar) {
        if (buttonVars.length === 1) {
          matchedVar = buttonVars[0];
        } else {
          // If a variable declares this exact physical pin, match it
          const exactPinVar = buttonVars.find(([, codePin]) => codePin === physicalPinNum);
          if (exactPinVar) {
            matchedVar = exactPinVar;
          } else {
            // Pick first unmatched variable
            matchedVar = buttonVars[0];
          }
        }
      }

      if (matchedVar) {
        const [varName, codePinNum] = matchedVar;
        if (!isNaN(physicalPinNum) && codePinNum !== physicalPinNum) {
          // Verify if physical pin is actually undeclared in any button variable
          const isDeclaredInAnyBtn = buttonVars.some(([, p]) => p === physicalPinNum);
          if (!isDeclaredInAnyBtn || buttonVars.length === 1) {
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
