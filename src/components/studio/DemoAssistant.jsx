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
import { assistantProvider } from '../../domain/assistant/assistantProvider';

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

  // Discover reviewable proposals through Assistant Architecture Provider
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    let mounted = true;
    assistantProvider.getProposals({
      project,
      validation,
      onApplyFix: (fix) => {
        onApplyFix(fix);
        if (fix?.id) setAppliedProposalId(fix.id);
      }
    }).then((list) => {
      if (mounted) setProposals(list);
    });
    return () => { mounted = false; };
  }, [project, validation]);

  // Assistant query processor via Provider interface
  const handleQuery = async (queryText) => {
    if (!queryText.trim()) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    const res = await assistantProvider.getResponse({
      queryText,
      project,
      validation,
      history: messages
    });

    setMessages(prev => [...prev, { id: `ast-${Date.now()}`, role: 'assistant', text: res.text }]);
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
