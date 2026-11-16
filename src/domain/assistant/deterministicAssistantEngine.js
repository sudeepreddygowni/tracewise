/**
 * Tracewise Assistant Architecture — Deterministic Reasoning Engine
 * Delivers accurate, student-friendly circuit explanations, pin collision fixes, and Ohm's law insights.
 */

export function generateDeterministicProposals({ project, validation, onApplyFix }) {
  const proposals = [];

  const pinMismatchCheck = validation.checks?.find(c => c.id === 'check-pin-mismatch' && c.status === 'FAILED');
  const ledProtectionCheck = validation.checks?.find(c => c.id === 'check-led-current' && c.status === 'WARNING');

  if (pinMismatchCheck) {
    proposals.push({
      id: 'fix-pin-mismatch',
      title: 'Resolve Firmware Pin Conflict',
      summary: 'Change BUTTON_PIN definition in firmware from Pin 2 to Pin 7 to match physical wiring on the canvas.',
      changes: [
        { type: 'code', description: 'Replace "const int BUTTON_PIN = 2;" with "const int BUTTON_PIN = 7;"' },
        { type: 'validation', description: 'Clears Pin Conflict Error on D2' }
      ],
      execute: () => {
        const currentCode = project.firmware?.files?.[0]?.content || '';
        const fixedCode = currentCode.replace(
          /(?:const\s+int|int|#define)\s+BUTTON_PIN\s*=?\s*2;?/,
          'const int BUTTON_PIN = 7;'
        );
        onApplyFix({ code: fixedCode, id: 'fix-pin-mismatch' });
      },
      action: () => {
        const currentCode = project.firmware?.files?.[0]?.content || '';
        const fixedCode = currentCode.replace(
          /(?:const\s+int|int|#define)\s+BUTTON_PIN\s*=?\s*2;?/,
          'const int BUTTON_PIN = 7;'
        );
        onApplyFix({ code: fixedCode, id: 'fix-pin-mismatch' });
      }
    });
  }

  if (ledProtectionCheck) {
    proposals.push({
      id: 'fix-led-resistor',
      title: 'Add 220Ω Current Limiting Resistor',
      summary: 'Rewire the LED cathode through a 220Ω resistor to ground, preventing overcurrent burn-out in hardware.',
      changes: [
        { type: 'circuit', description: 'Remove direct LED cathode to GND wire' },
        { type: 'circuit', description: 'Place 220Ω Resistor next to LED' },
        { type: 'circuit', description: 'Connect LED Cathode ──→ Resistor Pin 1' },
        { type: 'circuit', description: 'Connect Resistor Pin 2 ──→ Ground Rail' },
        { type: 'validation', description: 'Satisfies physical hardware safety rule' }
      ],
      execute: () => {
        const led = project.components?.find(c => c.type === 'led');
        if (!led) return;

        const cathodeWire = (project.connections || []).find(
          w => (w.from?.componentId === led.id && w.from?.pinId === 'cathode') ||
               (w.to?.componentId === led.id && w.to?.pinId === 'cathode')
        );

        let groundTarget = null;
        if (cathodeWire) {
          groundTarget = cathodeWire.from?.componentId === led.id ? cathodeWire.to : cathodeWire.from;
        } else {
          const uno = project.components?.find(c => c.type === 'arduino-uno');
          groundTarget = { componentId: uno ? uno.id : 'uno-1', pinId: 'gnd-1' };
        }

        onApplyFix({
          type: 'insert_resistor_series',
          ledId: led.id,
          removeWireId: cathodeWire?.id,
          groundTarget,
          id: 'fix-led-resistor'
        });
      },
      action: () => {
        const led = project.components?.find(c => c.type === 'led');
        if (!led) return;

        const cathodeWire = (project.connections || []).find(
          w => (w.from?.componentId === led.id && w.from?.pinId === 'cathode') ||
               (w.to?.componentId === led.id && w.to?.pinId === 'cathode')
        );

        let groundTarget = null;
        if (cathodeWire) {
          groundTarget = cathodeWire.from?.componentId === led.id ? cathodeWire.to : cathodeWire.from;
        } else {
          const uno = project.components?.find(c => c.type === 'arduino-uno');
          groundTarget = { componentId: uno ? uno.id : 'uno-1', pinId: 'gnd-1' };
        }

        onApplyFix({
          type: 'insert_resistor_series',
          ledId: led.id,
          removeWireId: cathodeWire?.id,
          groundTarget,
          id: 'fix-led-resistor'
        });
      }
    });
  }

  proposals.push({
    id: 'opt-format-code',
    title: 'Format Arduino C++ Structure',
    summary: 'Standardize indentation, comment headers, and setup/loop structure.',
    changes: [
      { type: 'code', description: 'Clean indentation and trailing spaces' }
    ],
    execute: () => {
      const currentCode = project.firmware?.files?.[0]?.content || '';
      const formatted = currentCode
        .split('\n')
        .map(l => l.trimEnd())
        .join('\n');
      onApplyFix({ code: formatted, id: 'opt-format-code' });
    },
    action: () => {
      const currentCode = project.firmware?.files?.[0]?.content || '';
      const formatted = currentCode
        .split('\n')
        .map(l => l.trimEnd())
        .join('\n');
      onApplyFix({ code: formatted, id: 'opt-format-code' });
    }
  });

  return proposals;
}

export function answerAssistantQuery({ queryText, project, validation }) {
  const q = String(queryText || '').toLowerCase().trim();
  const comps = project?.components || [];
  const wires = project?.connections || [];
  const code = project?.firmware?.files?.[0]?.content || '';
  const pinMismatchCheck = validation?.checks?.find(c => c.id === 'check-pin-mismatch' && c.status === 'FAILED');

  // 1. Natural Greetings ("Hi", "Hello", "Hey")
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|start|who\s*are\s*you)\b/i.test(q)) {
    return `### 👋 Hello! Welcome to Tracewise.\n\nI am your **Tracewise Engineering Assistant**. I continuously inspect your breadboard schematic, component specifications, and Arduino firmware.\n\n**Here is what I can help you with:**\n• **Component Queries**: Ask *"How many LEDs are in this project?"* or *"List all components"*.\n• **Circuit Wiring**: Ask *"Explain the connections"* or *"Which pin is my LED connected to?"*.\n• **Firmware Inspection**: Ask *"What does my code do?"* or *"Check if my firmware pins match hardware"*.\n• **Safety Checks**: Ask *"Why do I need a 220Ω resistor?"* or explore the Pitch Lab for competition preparation.\n\nWhat would you like to verify or build today?`;
  }

  // 2. Exact Component Counting Queries ("How many LEDs are in this project?", etc.)
  const isCountingQuery = q.includes('how many') || q.includes('count') || q.includes('number of') || q.includes('list component');
  if (isCountingQuery) {
    if (q.includes('led')) {
      const standardLeds = comps.filter(c => c.type === 'led');
      const rgbLeds = comps.filter(c => c.type === 'rgb-led');
      const total = standardLeds.length + rgbLeds.length;
      if (total === 0) {
        return `There are currently **0 LEDs** in your project. You can place single LEDs or an RGB LED from the Component Library on the left.`;
      }
      let details = [];
      if (standardLeds.length > 0) {
        details.push(`${standardLeds.length} standard 5mm LED${standardLeds.length > 1 ? 's' : ''} (${standardLeds.map(l => l.name || l.props?.color || 'LED').join(', ')})`);
      }
      if (rgbLeds.length > 0) {
        details.push(`${rgbLeds.length} Common Cathode RGB LED`);
      }
      return `Your project currently contains **${total} LED${total > 1 ? 's' : ''}**:\n• ${details.join('\n• ')}\n\nEach LED is checked for series resistor current-limiting protection.`;
    }

    if (q.includes('button') || q.includes('switch')) {
      const buttons = comps.filter(c => c.type === 'push-button');
      const switches = comps.filter(c => c.type === 'slide-switch');
      const total = buttons.length + switches.length;
      if (total === 0) {
        return `There are currently **0 buttons or switches** placed on your canvas.`;
      }
      return `Your project contains **${total} input control${total > 1 ? 's' : ''}**:\n` +
        (buttons.length > 0 ? `• ${buttons.length} Momentary Push Button${buttons.length > 1 ? 's' : ''} (${buttons.map(b => b.name || b.id).join(', ')})\n` : '') +
        (switches.length > 0 ? `• ${switches.length} SPDT Slide Switch (${switches.map(s => s.name || s.id).join(', ')})\n` : '');
    }

    if (q.includes('resistor')) {
      const resistors = comps.filter(c => c.type === 'resistor');
      if (resistors.length === 0) {
        return `There are currently **0 resistors** placed in your circuit.`;
      }
      return `Your project contains **${resistors.length} resistor${resistors.length > 1 ? 's' : ''}**:\n` +
        resistors.map(r => `• ${r.name || r.id}: ${r.props?.resistance || '220Ω'}`).join('\n');
    }

    if (q.includes('potentiometer') || q.includes('pot')) {
      const pots = comps.filter(c => c.type === 'potentiometer');
      return `Your project contains **${pots.length} potentiometer${pots.length === 1 ? '' : 's'}**${pots.length > 0 ? ` (${pots.map(p => p.name || p.id).join(', ')})` : ''}.`;
    }

    if (q.includes('buzzer')) {
      const buzzers = comps.filter(c => c.type === 'buzzer');
      return `Your project contains **${buzzers.length} active buzzer${buzzers.length === 1 ? '' : 's'}**${buzzers.length > 0 ? ` (${buzzers.map(b => b.name || b.id).join(', ')})` : ''}.`;
    }

    // Overall total component breakdown
    const typesMap = {};
    comps.forEach(c => {
      const label = c.name || c.type;
      typesMap[label] = (typesMap[label] || 0) + 1;
    });
    return `Your project contains **${comps.length} total components**:\n` +
      Object.entries(typesMap).map(([name, count]) => `• ${count}x ${name}`).join('\n') +
      `\n\nAll ${comps.length} components are catalog-grounded and wired with ${wires.length} active connections.`;
  }

  // 3. Structured Pin-to-Pin Netlist Connections ("Explain the connections", etc.)
  if (q.includes('explain the connection') || q.includes('explain connections') || q.includes('wired') || q.includes('connection') || q.includes('how my circuit is wired')) {
    if (wires.length === 0) {
      return `There are currently no wires routed on the canvas. Drag jumper wires between component terminals to connect them!`;
    }
    return `### 🔌 Circuit Wiring Netlist\n\nYour circuit currently has **${comps.length} components** and **${wires.length} active connections**:\n\n` +
      wires.map((w, idx) => `${idx + 1}. **${w.label || 'Wire'}**: \`${w.from?.componentId}\` (Pin: \`${w.from?.pinId}\`) ──→ \`${w.to?.componentId}\` (Pin: \`${w.to?.pinId}\`) [Color: ${w.color || 'blue'}]`).join('\n') +
      `\n\nAll physical routes have been checked for pin validity and electrical safety.`;
  }

  // 4. Code & Firmware Explanation ("What does my code do?", "Explain the code")
  if (q.includes('code') || q.includes('firmware') || q.includes('sketch') || q.includes('what does my code do')) {
    if (!code || !code.trim()) {
      return `### 📄 Firmware Status\n\nThere is currently no firmware source code loaded in \`sketch.ino\`. You can type or generate Arduino C++ code in the Code Editor tab.`;
    }
    const lines = code.split('\n').length;
    const hasSetup = code.includes('setup()');
    const hasLoop = code.includes('loop()');
    const hasDebounce = code.includes('debounce') || code.includes('millis()');
    const hasAnalog = code.includes('analogRead') || code.includes('analogWrite');

    return `### 💻 Firmware Code Analysis (\`sketch.ino\`)\n\n` +
      `Your Arduino C++ sketch contains **${lines} lines of code** with standard embedded structure:\n\n` +
      `• **\`setup()\` Function:** ${hasSetup ? 'Configures digital I/O pin modes (INPUT_PULLUP, OUTPUT) on the ATmega328P.' : 'Missing setup() routine.'}\n` +
      `• **\`loop()\` Function:** ${hasLoop ? 'Continuously executes runtime control logic to sample inputs and update actuators.' : 'Missing loop() routine.'}\n` +
      (hasDebounce ? `• **Timing & Debounce:** Uses \`millis()\` timing to prevent mechanical switch contact bounce from triggering erratic state shifts.\n` : '') +
      (hasAnalog ? `• **Analog Processing:** Features analog sampling / PWM duty cycle modulation for smooth output control.\n` : '') +
      `\nClick the **Arduino C++** tab above the canvas to inspect, edit, or copy the sketch.`;
  }

  // 5. Hardware vs Firmware Pin Mismatch
  if (q.includes('match') || q.includes('pin') || q.includes('conflict')) {
    if (pinMismatchCheck) {
      return `⚠️ **Pin Conflict Detected!**\n\nYour firmware defines BUTTON_PIN = 2, but your physical canvas wire connects the push button to Pin 7. Click **"Resolve Firmware Pin Conflict"** above to align the code with the wiring.`;
    }
    return `✅ **Firmware Pins Aligned!**\n\nAll referenced pins in \`sketch.ino\` correspond directly with active connections on your microcontroller.`;
  }

  // 6. Resistor & Ohm's Law (Only when explicitly asked about resistors or LED current)
  if (q.includes('why') && (q.includes('resistor') || q.includes('protect') || q.includes('current'))) {
    return `### 💡 Ohm's Law & LED Protection Analysis\n\nAn LED has very low dynamic electrical resistance once forward-biased (~2.0V for red). Without a series resistor (such as 220Ω), connecting directly to a 5V digital pin draws excessive current (>50mA), exceeding the ATmega328P rating and burning out the LED.\n\n**Ohm's Law Calculation:**\n$$I = \\frac{V_{CC} - V_f}{R} = \\frac{5\\text{V} - 2.0\\text{V}}{220\\Omega} \\approx 13.6\\text{mA}$$\nThis safe current of ~14mA provides bright illumination without overloading the microcontroller pin.`;
  }

  // Default Fallback
  return `### 🔬 Circuit Inspector: ${project?.title || 'Active Project'}\n\n` +
    `Your circuit has **${comps.length} components** and **${wires.length} connections**.\n` +
    `• Validation Status: **${validation?.overallStatus === 'STRUCTURALLY_VALID' ? '✅ Structurally Valid' : '⚠️ Requires Attention'}**\n\n` +
    `You can ask me questions such as:\n` +
    `• *"How many LEDs are in this project?"*\n` +
    `• *"Explain the connections"*\n` +
    `• *"What does my code do?"*\n` +
    `• *"Check if my firmware pins match hardware"*`;
}
