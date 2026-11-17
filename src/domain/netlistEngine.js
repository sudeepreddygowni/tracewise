/**
 * Tracewise Canonical Electrical Netlist & Connectivity Engine
 *
 * Implements:
 * 1. Disjoint Set Union (Union-Find) for electrical net identification.
 * 2. Breadboard internal conductive terminal strips (rows 1-30, upper/lower channel isolation, power rails).
 * 3. Strict Resistor Node Separation (Resistors are NOT zero-ohm wires; lead1 and lead2 stay on separate nets).
 * 4. Circuit Path Tracing (MCU GPIO/Power -> Actuator/LED -> Resistor -> Ground return).
 * 5. Electrical Diagnostics (Short circuits, missing GND, unprotected LEDs, floating pins, pin/code mismatch).
 */

import { getComponentDefinition } from '../data/componentCatalog.js';

class UnionFind {
  constructor() {
    this.parent = new Map();
  }

  find(item) {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      return item;
    }
    const p = this.parent.get(item);
    if (p === item) return item;
    const root = this.find(p);
    this.parent.set(item, root);
    return root;
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }

  getGroups() {
    const groups = new Map();
    for (const item of this.parent.keys()) {
      const root = this.find(item);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root).push(item);
    }
    return Array.from(groups.values());
  }
}

/**
 * Standardize pin identifier across aliases
 */
export function normalizePinId(compType, rawPinId) {
  if (!rawPinId) return '';
  const clean = String(rawPinId).trim();
  const lower = clean.toLowerCase();

  // Arduino Uno / Nano pin normalization
  if (compType?.startsWith('arduino')) {
    if (lower === 'gnd' || lower === 'gnd_1' || lower === 'gnd_2' || lower === 'gnd_top' || lower === 'ground') return 'GND';
    if (lower === '5v' || lower === 'vcc' || lower === '+5v') return '5V';
    if (lower === '3v3' || lower === '3.3v') return '3V3';
    if (lower === 'vin') return 'VIN';
    if (/^d?[0-9]+$/.test(lower)) {
      const num = lower.replace(/^d/, '');
      return `D${num}`;
    }
    if (/^a[0-7]$/.test(lower)) {
      return lower.toUpperCase();
    }
    return clean;
  }

  // LED pin normalization
  if (compType === 'led') {
    if (lower === 'anode' || lower === 'a' || lower === 'pos' || lower === '+') return 'anode';
    if (lower === 'cathode' || lower === 'k' || lower === 'neg' || lower === '-') return 'cathode';
  }

  // Resistor pin normalization
  if (compType === 'resistor') {
    if (lower === 'lead1' || lower === 'p1' || lower === 'terminal1' || lower === '1') return 'lead1';
    if (lower === 'lead2' || lower === 'p2' || lower === 'terminal2' || lower === '2') return 'lead2';
  }

  // Pushbutton pin normalization
  if (compType === 'push-button' || compType === 'button') {
    if (lower === 'pin1' || lower === 't1' || lower === 'terminal1a' || lower === '1') return 'terminal1';
    if (lower === 'pin2' || lower === 't2' || lower === 'terminal2a' || lower === '2') return 'terminal2';
  }

  // Potentiometer pin normalization
  if (compType === 'potentiometer') {
    if (lower === 'pin1' || lower === 'terminal1' || lower === '1') return 'terminal1';
    if (lower === 'pin2' || lower === 'wiper' || lower === '2') return 'wiper';
    if (lower === 'pin3' || lower === 'terminal2' || lower === '3') return 'terminal2';
  }

  return clean;
}

/**
 * Parses internal breadboard row/rail connections
 */
function getBreadboardInternalGroups(comp) {
  const compId = comp.id;
  const groups = [];

  // Group top power rails
  groups.push([`${compId}:rail-top-pos`, `${compId}:+top`]);
  groups.push([`${compId}:rail-top-neg`, `${compId}:-top`]);

  // Group bottom power rails
  groups.push([`${compId}:rail-bot-pos`, `${compId}:+bot`]);
  groups.push([`${compId}:rail-bot-neg`, `${compId}:-bot`]);

  // Row terminal strips (columns a-e = upper, columns f-j = lower)
  for (let r = 1; r <= 30; r++) {
    const rowUpper = [
      `${compId}:row-${r}`,
      `${compId}:a${r}`,
      `${compId}:b${r}`,
      `${compId}:c${r}`,
      `${compId}:d${r}`,
      `${compId}:e${r}`
    ];
    groups.push(rowUpper);

    const rowLower = [
      `${compId}:row-${r}-bot`,
      `${compId}:f${r}`,
      `${compId}:g${r}`,
      `${compId}:h${r}`,
      `${compId}:i${r}`,
      `${compId}:j${r}`
    ];
    groups.push(rowLower);
  }

  return groups;
}

/**
 * Builds the canonical electrical netlist from a project snapshot.
 */
export function buildNetlist(project) {
  const components = Array.isArray(project?.components) ? project.components : [];
  const connections = Array.isArray(project?.connections) ? project.connections : [];

  const compMap = new Map();
  for (const c of components) {
    compMap.set(c.id, c);
  }

  const uf = new UnionFind();

  // 1. Register all component pins in Union-Find
  for (const c of components) {
    const def = getComponentDefinition(c.type) || {};
    const pins = def.pins || [];
    for (const p of pins) {
      const normPin = normalizePinId(c.type, p.id);
      uf.find(`${c.id}:${normPin}`);
    }

    // 2. Connect internal breadboard conductive strips
    if (c.type === 'breadboard-half' || c.type === 'breadboard' || c.type === 'half-breadboard') {
      const bbGroups = getBreadboardInternalGroups(c);
      for (const group of bbGroups) {
        for (let i = 1; i < group.length; i++) {
          uf.union(group[0], group[i]);
        }
      }
    }

    // 3. Arduino internal ground plane (all GND pins are internally connected)
    if (c.type === 'arduino-uno' || c.type === 'arduino-nano') {
      uf.union(`${c.id}:GND`, `${c.id}:GND_TOP`);
      uf.union(`${c.id}:GND`, `${c.id}:GND_1`);
      uf.union(`${c.id}:GND`, `${c.id}:GND_2`);
    }
  }

  // 4. Connect explicit wires between pins
  for (const wire of connections) {
    if (!wire.from || !wire.to) continue;
    const fromComp = compMap.get(wire.from.componentId);
    const toComp = compMap.get(wire.to.componentId);
    if (!fromComp || !toComp) continue;

    const fromPin = normalizePinId(fromComp.type, wire.from.pinId);
    const toPin = normalizePinId(toComp.type, wire.to.pinId);

    const keyFrom = `${fromComp.id}:${fromPin}`;
    const keyTo = `${toComp.id}:${toPin}`;

    uf.union(keyFrom, keyTo);
  }

  // 5. Build canonical Nets
  const rawGroups = uf.getGroups();
  const nets = [];
  const pinToNetId = new Map();

  rawGroups.forEach((pinKeys, idx) => {
    const netId = `net-${idx + 1}`;
    let isGnd = false;
    let is5V = false;
    let is3V3 = false;
    const pinDetails = [];

    for (const key of pinKeys) {
      pinToNetId.set(key, netId);
      const [compId, pinId] = key.split(':');
      const comp = compMap.get(compId);
      const compType = comp?.type || '';

      if (compType.startsWith('arduino')) {
        if (pinId === 'GND') isGnd = true;
        if (pinId === '5V') is5V = true;
        if (pinId === '3V3') is3V3 = true;
      }
      if (pinId.includes('neg') || pinId.includes('gnd')) isGnd = true;
      if (pinId.includes('pos') || pinId.includes('5v')) is5V = true;

      pinDetails.push({
        componentId: compId,
        componentType: compType,
        componentName: comp?.name || compId,
        pinId,
        pinKey: key
      });
    }

    nets.push({
      id: netId,
      pins: pinDetails,
      isGND: isGnd,
      is5V: is5V,
      is3V3: is3V3,
      voltage: is5V ? 5.0 : is3V3 ? 3.3 : 0.0
    });
  });

  return {
    nets,
    compMap,
    pinToNetId,
    components,
    connections
  };
}

/**
 * Traces complete electrical branch from an LED through a current-limiting resistor to ground.
 */
export function traceLedBranch(ledComp, netlist) {
  const { compMap, pinToNetId } = netlist;
  const anodeKey = `${ledComp.id}:anode`;
  const cathodeKey = `${ledComp.id}:cathode`;

  const anodeNetId = pinToNetId.get(anodeKey);
  const cathodeNetId = pinToNetId.get(cathodeKey);

  const result = {
    ledId: ledComp.id,
    ledName: ledComp.name || ledComp.id,
    hasAnodeNet: Boolean(anodeNetId),
    hasCathodeNet: Boolean(cathodeNetId),
    hasCurrentLimitingResistor: false,
    resistorComp: null,
    resistorResistance: 0,
    hasGroundReturn: false,
    drivenByMcuPin: null,
    isElectricallySafe: false,
    diagnostics: []
  };

  if (!anodeNetId || !cathodeNetId) {
    result.diagnostics.push('LED is unconnected or missing one terminal connection.');
    return result;
  }

  const anodeNet = netlist.nets.find(n => n.id === anodeNetId);
  const cathodeNet = netlist.nets.find(n => n.id === cathodeNetId);

  // Check if Anode or Cathode is connected to an MCU digital pin
  const findMcuPin = (net) => {
    return net?.pins.find(p => p.componentType.startsWith('arduino') && /^D[0-9]+$/.test(p.pinId));
  };

  const mcuPinAnode = findMcuPin(anodeNet);
  const mcuPinCathode = findMcuPin(cathodeNet);

  if (mcuPinAnode) {
    result.drivenByMcuPin = mcuPinAnode.pinId;
  } else if (anodeNet?.is5V) {
    result.drivenByMcuPin = '5V';
  }

  // Search for series resistor on cathode side or anode side
  const findResistorInNet = (net) => {
    for (const p of net?.pins || []) {
      if (p.componentType === 'resistor') {
        const resComp = compMap.get(p.componentId);
        const otherPin = p.pinId === 'lead1' ? 'lead2' : 'lead1';
        const otherKey = `${p.componentId}:${otherPin}`;
        const otherNetId = pinToNetId.get(otherKey);
        const otherNet = netlist.nets.find(n => n.id === otherNetId);
        return {
          resistor: resComp,
          pinConnected: p.pinId,
          otherPin,
          otherNet
        };
      }
    }
    return null;
  };

  // Case A: Resistor in series with Cathode (Standard active-high LED)
  const cathodeResistor = findResistorInNet(cathodeNet);
  if (cathodeResistor) {
    result.hasCurrentLimitingResistor = true;
    result.resistorComp = cathodeResistor.resistor;
    result.resistorResistance = Number(cathodeResistor.resistor?.properties?.resistance || 220);
    if (cathodeResistor.otherNet?.isGND) {
      result.hasGroundReturn = true;
    }
  }

  // Case B: Resistor in series with Anode
  const anodeResistor = findResistorInNet(anodeNet);
  if (anodeResistor) {
    result.hasCurrentLimitingResistor = true;
    result.resistorComp = anodeResistor.resistor;
    result.resistorResistance = Number(anodeResistor.resistor?.properties?.resistance || 220);
    if (cathodeNet?.isGND) {
      result.hasGroundReturn = true;
    }
  }

  // Direct connection without resistor
  if (!result.hasCurrentLimitingResistor && (cathodeNet?.isGND || mcuPinCathode)) {
    result.hasGroundReturn = true;
  }

  // Safety determination
  if (result.hasCurrentLimitingResistor && result.hasGroundReturn && result.drivenByMcuPin) {
    result.isElectricallySafe = true;
  } else if (!result.hasCurrentLimitingResistor && result.drivenByMcuPin && result.hasGroundReturn) {
    result.diagnostics.push(`Unprotected LED: ${result.ledName} is connected to ${result.drivenByMcuPin} without a current-limiting resistor, risking excessive current.`);
  } else if (!result.hasGroundReturn) {
    result.diagnostics.push(`Open Circuit: ${result.ledName} has no return path to Ground (GND).`);
  }

  return result;
}

/**
 * Validates electrical rules and firmware-to-hardware consistency.
 */
export function validateElectricalRules(project, options = {}) {
  const netlist = buildNetlist(project);
  const { nets, components } = netlist;
  const diagnostics = [];

  // --- Check 1: Short Circuit (5V directly connected to GND) ---
  const shortCircuits = nets.filter(n => n.is5V && n.isGND);
  if (shortCircuits.length > 0) {
    diagnostics.push({
      id: 'err-short-circuit',
      name: 'Power Short Circuit',
      status: 'FAILED',
      severity: 'CRITICAL',
      message: 'Critical: Direct short circuit detected between 5V power and GND ground rail.',
      ruleOrigin: 'netlist_solver'
    });
  }

  // --- Check 2: LED Current Protection & Ground Return ---
  const leds = components.filter(c => c.type === 'led' || c.type === 'rgb-led');
  let unprotectedCount = 0;

  for (const led of leds) {
    if (led.type === 'led') {
      const branch = traceLedBranch(led, netlist);
      if (!branch.isElectricallySafe && branch.diagnostics.length > 0) {
        unprotectedCount++;
        diagnostics.push({
          id: `warn-led-${led.id}`,
          name: 'LED Protection & Wiring',
          status: 'WARNING',
          severity: 'WARNING',
          message: branch.diagnostics.join(' '),
          ruleOrigin: 'netlist_solver',
          componentId: led.id
        });
      }
    }
  }

  // --- Check 3: Firmware Pin Mapping Verification ---
  const firmwareCode = options.firmwareCode || project.code || '';
  if (firmwareCode.trim()) {
    const declaredPins = [];
    const pinRegex = /(?:pinMode|digitalWrite|digitalRead|analogWrite|analogRead)\s*\(\s*([A-Za-z0-9_]+)/g;
    let match;
    while ((match = pinRegex.exec(firmwareCode)) !== null) {
      const raw = match[1];
      if (/^[0-9]+$/.test(raw)) declaredPins.push(`D${raw}`);
      else if (/^D[0-9]+$/i.test(raw)) declaredPins.push(raw.toUpperCase());
      else if (/^A[0-7]$/i.test(raw)) declaredPins.push(raw.toUpperCase());
    }

    const mcu = components.find(c => c.type === 'arduino-uno' || c.type === 'arduino-nano');
    if (mcu && declaredPins.length > 0) {
      const uniqueDeclared = Array.from(new Set(declaredPins));
      const unroutedPins = [];

      for (const pinId of uniqueDeclared) {
        const pinKey = `${mcu.id}:${pinId}`;
        const netId = netlist.pinToNetId.get(pinKey);
        const net = nets.find(n => n.id === netId);
        // An active net must have at least one other component connected
        const hasExternalComponent = (net?.pins || []).some(p => p.componentId !== mcu.id);
        if (!hasExternalComponent) {
          unroutedPins.push(pinId);
        }
      }

      if (unroutedPins.length > 0) {
        diagnostics.push({
          id: 'warn-firmware-pin-mismatch',
          name: 'Firmware Pin Consistency',
          status: 'WARNING',
          severity: 'WARNING',
          message: `Firmware references pin(s) ${unroutedPins.join(', ')} but no external component is connected to these pins on the circuit canvas.`,
          ruleOrigin: 'firmware_pin_validator'
        });
      }
    }
  }

  const hasCritical = diagnostics.some(d => d.severity === 'CRITICAL');
  const hasErrors = diagnostics.some(d => d.status === 'FAILED');

  return {
    netlist,
    overallStatus: hasCritical || hasErrors ? 'FAILED' : diagnostics.length > 0 ? 'WARNING' : 'PASSED',
    checks: diagnostics
  };
}
