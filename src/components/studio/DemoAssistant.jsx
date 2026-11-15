import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  Wrench,
  RefreshCw,
  Send,
  Cpu,
  Zap,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function DemoAssistant({ project, validation, onApplyFix }) {
  const [appliedProposalId, setAppliedProposalId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `Hello! I am your Tracewise Engineering Assistant. I continuously inspect your canvas wiring, component catalog definitions, and Arduino firmware. How can I help you today?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Validation checks inspection
  const pinMismatchCheck = validation.checks?.find(c => c.id === 'check-pin-mismatch' && c.status === 'FAILED');
  const ledProtectionCheck = validation.checks?.find(c => c.id === 'check-led-current' && c.status === 'WARNING');

  // Discover reviewable proposals
  const proposals = [];

  if (pinMismatchCheck) {
    proposals.push({
      id: 'fix-pin-mismatch',
      title: 'Resolve Firmware Pin Conflict',
      summary: 'Change BUTTON_PIN definition in firmware from Pin 2 to Pin 7 to match physical wiring on the canvas.',
      changes: [
        { type: 'code', description: 'Replace "const int BUTTON_PIN = 2;" with "const int BUTTON_PIN = 7;"' },
        { type: 'validation', description: 'Clears Pin Conflict Error on D2' }
      ],
      action: () => {
        const currentCode = project.firmware?.files?.[0]?.content || '';
        const fixedCode = currentCode.replace(
          /(?:const\s+int|int|#define)\s+BUTTON_PIN\s*=?\s*2;?/,
          'const int BUTTON_PIN = 7;'
        );
        onApplyFix({ code: fixedCode });
        setAppliedProposalId('fix-pin-mismatch');
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
      action: () => {
        const led = project.components?.find(c => c.type === 'led');
        if (!led) return;

        // Find existing wire on cathode
        const cathodeWire = (project.connections || []).find(
          w => (w.from?.componentId === led.id && w.from?.pinId === 'cathode') ||
               (w.to?.componentId === led.id && w.to?.pinId === 'cathode')
        );

        let groundTarget = null;
        if (cathodeWire) {
          groundTarget = cathodeWire.from?.componentId === led.id ? cathodeWire.to : cathodeWire.from;
        } else {
          // Fallback to Arduino GND or breadboard
          const uno = project.components?.find(c => c.type === 'arduino-uno');
          groundTarget = { componentId: uno ? uno.id : 'uno-1', pinId: 'gnd-1' };
        }

        onApplyFix({
          type: 'insert_resistor_series',
          ledId: led.id,
          removeWireId: cathodeWire?.id,
          groundTarget
        });
        setAppliedProposalId('fix-led-resistor');
      }
    });
  }

  // Format code structure proposal
  proposals.push({
    id: 'opt-format-code',
    title: 'Format Arduino C++ Structure',
    summary: 'Standardize indentation, comment headers, and setup/loop structure.',
    changes: [
      { type: 'code', description: 'Clean indentation and trailing spaces' }
    ],
    action: () => {
      const currentCode = project.firmware?.files?.[0]?.content || '';
      const formatted = currentCode
        .split('\n')
        .map(l => l.trimEnd())
        .join('\n');
      onApplyFix({ code: formatted });
      setAppliedProposalId('opt-format-code');
    }
  });

  // Assistant query processor
  const handleQuery = (queryText) => {
    if (!queryText.trim()) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Generate intelligent response based on live project state
    setTimeout(() => {
      let responseText = '';
      const q = queryText.toLowerCase();

      if (q.includes('wired') || q.includes('connection') || q.includes('how my circuit is wired')) {
        const comps = project.components || [];
        const wires = project.connections || [];
        responseText = `Your circuit currently has ${comps.length} components (${comps.map(c => c.name || c.type).join(', ')}) and ${wires.length} wires:\n\n` +
          wires.map(w => `• ${w.label || 'Wire'}: ${w.from.componentId} (${w.from.pinId}) ──→ ${w.to.componentId} (${w.to.pinId}) [${w.color}]`).join('\n');
      } else if (q.includes('match') || q.includes('pin') || q.includes('firmware')) {
        const code = project.firmware?.files?.[0]?.content || '';
        if (pinMismatchCheck) {
          responseText = `⚠️ Pin Conflict Detected!\nYour firmware defines BUTTON_PIN = 2, but your physical canvas wire connects the push button to Pin 7. Click "Resolve Firmware Pin Conflict" above to align the code with the wiring.`;
        } else {
          responseText = `✅ Firmware pins match canvas wiring!\nAll referenced pins in sketch.ino align with the active connections on your microcontroller.`;
        }
      } else if (q.includes('resistor') || q.includes('why') || q.includes('led')) {
        responseText = `An LED has very low internal electrical resistance once forward-biased (approx. 2V). Without a series resistor (such as 220Ω), connecting directly to a 5V digital pin draws far too much current (>50mA), exceeding the ATmega328P rating and burning out the LED. A 220Ω resistor limits the current safely to ~15mA.`;
      } else if (q.includes('difference') || q.includes('baseline') || q.includes('compare')) {
        responseText = `Project "${project.title}" (version ${project.version?.label || 'v1.0'}):\n• Components: ${project.components?.length || 0}\n• Wires: ${project.connections?.length || 0}\n• Status: ${validation.overallStatus === 'STRUCTURALLY_VALID' ? 'Structurally Valid' : 'Requires Attention'}.\nYou can also use the "Compare & Debug" tool in the top bar to inspect visual side-by-side diffs!`;
      } else {
        responseText = `Based on your current circuit (${project.components?.length || 0} components, ${project.connections?.length || 0} connections):\nAll catalog definitions and wiring rules are continuously verified. If you have questions about pin mapping, firmware logic, or resistor sizing, feel free to ask!`;
      }

      setMessages(prev => [...prev, { id: `ast-${Date.now()}`, role: 'assistant', text: responseText }]);
    }, 300);
  };

  const quickPrompts = [
    'Explain how my circuit is wired',
    'Check if my firmware pins match hardware',
    'Explain why I need a resistor for the LED',
    'Summarize project differences from baseline'
  ];

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#ffffff' }}>
        {/* Assistant Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--tw-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--tw-brand) 0%, var(--tw-cyan) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
                Engineering Assistant
              </h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)' }}>
                Rule & Schema Aware • Deterministic Output
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content: Proposals + Live Chat */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Proposals Section */}
          {proposals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actionable Proposals ({proposals.length})
                </span>
              </div>

              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: appliedProposalId === prop.id ? '1.5px solid var(--tw-success)' : '1px solid var(--tw-border)',
                    backgroundColor: appliedProposalId === prop.id ? '#f0fdf4' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h5 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                      {prop.title}
                    </h5>
                    {appliedProposalId === prop.id && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tw-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={13} /> Applied
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {prop.summary}
                  </p>

                  <div style={{ background: 'var(--tw-bg)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {prop.changes.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--tw-text-secondary)' }}>
                        <span style={{ color: 'var(--tw-brand)', fontWeight: 'bold' }}>•</span>
                        <span>{c.description}</span>
                      </div>
                    ))}
                  </div>

                  <TracewiseBubbleButton
                    onClick={prop.action}
                    disabled={appliedProposalId === prop.id}
                    variant={appliedProposalId === prop.id ? 'secondary' : 'primary'}
                    size="sm"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      alignSelf: 'flex-start',
                      marginTop: '2px',
                      gap: '6px',
                      opacity: appliedProposalId === prop.id ? 0.7 : 1
                    }}
                  >
                    <Wrench size={12} />
                    <span>{appliedProposalId === prop.id ? 'Fix Applied' : 'Apply Proposal'}</span>
                  </TracewiseBubbleButton>
                </div>
              ))}
            </div>
          )}

          {/* Chat Conversation Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assistant Conversation
            </span>

            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: m.role === 'user' ? 'var(--tw-brand)' : 'var(--tw-bg)',
                  color: m.role === 'user' ? '#ffffff' : 'var(--tw-text)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--tw-border)',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
              Suggested Questions:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuery(p)}
                  style={{
                    backgroundColor: 'var(--tw-brand-soft)',
                    border: '1px solid var(--tw-border)',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    color: 'var(--tw-brand)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30,63,216,0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--tw-brand-soft)'}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--tw-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery(inputText)}
            placeholder="Ask a circuit or code question..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '20px',
              border: '1px solid var(--tw-border)',
              fontSize: '0.8rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <TracewiseBubbleIconButton
            onClick={() => handleQuery(inputText)}
            variant="primary"
            size="sm"
            title="Send Question"
            disabled={!inputText.trim()}
          >
            <Send size={14} />
          </TracewiseBubbleIconButton>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
