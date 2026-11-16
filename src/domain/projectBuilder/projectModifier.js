/**
 * Tracewise Project Builder — Project Modifier
 * Handles incremental circuit additions (e.g., adding an LED or button) transactionally.
 */

import { generateId } from '../projectSchema.js';

// Standard digital pins available on Arduino Uno in preferred allocation order
const UNO_DIGITAL_PINS = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'];

/**
 * Plans the addition of an LED with series current-limiting resistor to the current project.
 */
export function planAddLedModification(project, color = 'yellow') {
  if (!project || !Array.isArray(project.components)) {
    throw new Error('Invalid project structure for modification.');
  }

  // 1. Find pins already used on the board
  const usedPins = new Set();
  (project.connections || []).forEach(w => {
    if (w.from?.componentId === project.boardId) usedPins.add(w.from.pinId);
    if (w.to?.componentId === project.boardId) usedPins.add(w.to.pinId);
  });

  // Find next available digital pin
  const availablePin = UNO_DIGITAL_PINS.find(p => !usedPins.has(p));
  if (!availablePin) {
    throw new Error('All digital I/O pins on the Arduino Uno are already occupied.');
  }

  const pinNumber = parseInt(availablePin.replace('D', ''), 10);
  const existingLeds = project.components.filter(c => c.type === 'led');
  const ledIndex = existingLeds.length + 1;

  const ledId = `led-${color}-${ledIndex}`;
  const resId = `res-${color}-${ledIndex}`;

  // Calculate layout coordinates next to existing LEDs
  let newX = 440;
  let newY = 330;
  if (existingLeds.length > 0) {
    const maxX = Math.max(...existingLeds.map(l => l.x || 440));
    newX = maxX + 120;
    newY = existingLeds[0].y || 330;
  }

  const newLed = {
    id: ledId,
    type: 'led',
    name: `${color.charAt(0).toUpperCase() + color.slice(1)} LED ${ledIndex}`,
    x: newX,
    y: newY,
    props: { color }
  };

  const newResistor = {
    id: resId,
    type: 'resistor',
    name: `220Ω Resistor (${color})`,
    x: newX - 10,
    y: newY + 85,
    props: { resistance: '220Ω' }
  };

  // Color mapping for wire
  const wireColorMap = {
    yellow: '#EAB308',
    red: '#EF4444',
    green: '#187A57',
    blue: '#3B82F6',
    amber: '#F59E0B'
  };
  const sigColor = wireColorMap[color] || '#2DC5E9';

  const newWires = [
    {
      id: `wire-${generateId('w').slice(-5)}`,
      from: { componentId: project.boardId, pinId: availablePin },
      to: { componentId: ledId, pinId: 'anode' },
      color: sigColor,
      label: `${color.toUpperCase()} Signal (${availablePin})`
    },
    {
      id: `wire-${generateId('w').slice(-5)}`,
      from: { componentId: ledId, pinId: 'cathode' },
      to: { componentId: resId, pinId: 'lead1' },
      color: '#0F172A',
      label: 'LED Cathode to Resistor'
    },
    {
      id: `wire-${generateId('w').slice(-5)}`,
      from: { componentId: resId, pinId: 'lead2' },
      to: { componentId: project.boardId, pinId: 'GND_TOP' },
      color: '#0F172A',
      label: 'Ground Return'
    }
  ];

  // Prepare updated firmware
  const currentCode = project.firmware?.files?.[0]?.content || '';
  const constName = `LED_${color.toUpperCase()}_${ledIndex}`;
  let updatedCode = currentCode;

  // Insert pin declaration
  if (currentCode.includes('void setup()')) {
    const decl = `const int ${constName} = ${pinNumber};\n`;
    const setupInsert = `  pinMode(${constName}, OUTPUT);\n`;

    // Add before setup
    const setupPos = updatedCode.indexOf('void setup()');
    updatedCode = updatedCode.slice(0, setupPos) + decl + updatedCode.slice(setupPos);

    // Add inside setup
    const bracePos = updatedCode.indexOf('{', updatedCode.indexOf('void setup()'));
    if (bracePos !== -1) {
      updatedCode = updatedCode.slice(0, bracePos + 1) + '\n' + setupInsert + updatedCode.slice(bracePos + 1);
    }
  } else {
    updatedCode = `const int ${constName} = ${pinNumber};\n\nvoid setup() {\n  pinMode(${constName}, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(${constName}, HIGH);\n}\n`;
  }

  return {
    id: `mod-add-led-${Date.now()}`,
    type: 'add_led_resistor',
    title: `Add ${newLed.name} on Pin ${availablePin}`,
    summary: `Adds a new ${color} LED on Arduino Pin ${availablePin} protected by a 220Ω series resistor to Ground.`,
    allocatedPin: availablePin,
    componentsToAdd: [newLed, newResistor],
    wiresToAdd: newWires,
    firmwareUpdate: updatedCode,
    changesPreview: [
      `+ Added component: ${newLed.name} (type: led, color: ${color})`,
      `+ Added component: ${newResistor.name} (type: resistor, resistance: 220Ω)`,
      `+ Wired: Arduino Pin ${availablePin} ──→ ${newLed.name} (Anode)`,
      `+ Wired: ${newLed.name} (Cathode) ──→ ${newResistor.name} (Lead 1)`,
      `+ Wired: ${newResistor.name} (Lead 2) ──→ Arduino Ground (GND_TOP)`,
      `+ Firmware: Added "const int ${constName} = ${pinNumber};" and "pinMode(${constName}, OUTPUT);"`
    ]
  };
}

/**
 * Applies an approved modification plan to a project.
 */
export function applyProjectModification(project, modification) {
  if (!project || !modification) return project;

  const comps = [...(project.components || []), ...(modification.componentsToAdd || [])];
  const wires = [...(project.connections || []), ...(modification.wiresToAdd || [])];

  const firmwareFiles = [...(project.firmware?.files || [])];
  if (modification.firmwareUpdate) {
    if (firmwareFiles.length > 0) {
      firmwareFiles[0] = { ...firmwareFiles[0], content: modification.firmwareUpdate };
    } else {
      firmwareFiles.push({ path: 'sketch.ino', content: modification.firmwareUpdate });
    }
  }

  return {
    ...project,
    components: comps,
    connections: wires,
    firmware: {
      ...(project.firmware || { language: 'arduino-cpp' }),
      files: firmwareFiles
    },
    updatedAt: new Date().toISOString()
  };
}
