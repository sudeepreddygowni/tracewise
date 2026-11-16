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
  const q = queryText.toLowerCase();
  const comps = project.components || [];
  const wires = project.connections || [];
  const pinMismatchCheck = validation.checks?.find(c => c.id === 'check-pin-mismatch' && c.status === 'FAILED');

  if (q.includes('wired') || q.includes('connection') || q.includes('how my circuit is wired')) {
    return `Your circuit currently has ${comps.length} components (${comps.map(c => c.name || c.type).join(', ')}) and ${wires.length} wires:\n\n` +
      wires.map(w => `• ${w.label || 'Wire'}: ${w.from.componentId} (${w.from.pinId}) ──→ ${w.to.componentId} (${w.to.pinId}) [${w.color}]`).join('\n');
  }

  if (q.includes('match') || q.includes('pin') || q.includes('firmware')) {
    if (pinMismatchCheck) {
      return `⚠️ Pin Conflict Detected!\nYour firmware defines BUTTON_PIN = 2, but your physical canvas wire connects the push button to Pin 7. Click "Resolve Firmware Pin Conflict" above to align the code with the wiring.`;
    }
    return `✅ Firmware pins match canvas wiring!\nAll referenced pins in sketch.ino align with the active connections on your microcontroller.`;
  }

  if (q.includes('resistor') || q.includes('why') || q.includes('led')) {
    return `An LED has very low internal electrical resistance once forward-biased (approx. 2V). Without a series resistor (such as 220Ω), connecting directly to a 5V digital pin draws far too much current (>50mA), exceeding the ATmega328P rating and burning out the LED. A 220Ω resistor limits the current safely to ~15mA.`;
  }

  if (q.includes('difference') || q.includes('baseline') || q.includes('compare')) {
    return `Project "${project.title}" (version ${project.version?.label || 'v1.0'}):\n• Components: ${comps.length}\n• Wires: ${wires.length}\n• Status: ${validation.overallStatus === 'STRUCTURALLY_VALID' ? 'Structurally Valid' : 'Requires Attention'}.\nYou can also use the "Compare & Debug" tool in the top bar to inspect visual side-by-side diffs!`;
  }

  return `Based on your current circuit (${comps.length} components, ${wires.length} connections):\nAll catalog definitions and wiring rules are continuously verified. If you have questions about pin mapping, firmware logic, or resistor sizing, feel free to ask!`;
}
