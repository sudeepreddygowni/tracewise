import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  MessageSquare,
  Copy,
  ShieldCheck,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';
import { assistantProvider } from '../../domain/assistant/assistantProvider';
import { SafeMarkdown } from './SafeMarkdown';

export function DemoAssistant({ project, validation, onApplyFix, initialQuery = null }) {
  const [appliedProposalId, setAppliedProposalId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `### 👋 Welcome to Tracewise Studio!\n\nI am your Engineering Assistant for **"${project?.title || 'your project'}"**. I continuously inspect your canvas wiring, component catalog definitions, and Arduino firmware.\n\nHow can I help you today?`,
      sourceTag: 'Deterministic Rule Engine',
      verifiedFacts: [
        `Components: ${(project?.components || []).length}`,
        `Wires: ${(project?.connections || []).length}`
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const scrollContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const prevProjectIdRef = useRef(project?.id);
  const initialQueryExecutedRef = useRef(false);

  // Measure scroll position to support conditional auto-scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const near = distanceToBottom < 80;
    setIsNearBottom(near);
    setShowJumpToBottom(!near && distanceToBottom > 160);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setIsNearBottom(true);
    setShowJumpToBottom(false);
  }, []);

  // Conditional auto-scrolling: only scroll down if near bottom or user just posted
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'user' || isNearBottom) {
      scrollToBottom(true);
    }
  }, [messages, isThinking, isNearBottom, scrollToBottom]);

  // Clean context reset when project switches
  useEffect(() => {
    if (project?.id && project.id !== prevProjectIdRef.current) {
      prevProjectIdRef.current = project.id;
      setAppliedProposalId(null);
      setLastFailedQuery(null);
      setMessages([
        {
          id: `msg-welcome-${project.id}`,
          role: 'assistant',
          text: `### 🔄 Switched Project: ${project.title}\n\nAll pin declarations, catalog definitions, and wiring netlists are loaded for this project. What would you like to verify or improve?`,
          sourceTag: 'Deterministic Rule Engine',
          verifiedFacts: [
            `Project: ${project.title}`,
            `Components: ${(project.components || []).length}`,
            `Connections: ${(project.connections || []).length}`
          ]
        }
      ]);
      scrollToBottom(false);
    }
  }, [project?.id, project?.title, project?.components, project?.connections, scrollToBottom]);

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
  }, [project, validation, onApplyFix]);

  // Assistant query processor
  const handleQuery = async (queryText) => {
    if (!queryText || !queryText.trim() || isThinking) return;

    const cleanQuery = queryText.trim();
    const userMsg = { id: `user-${Date.now()}`, role: 'user', text: cleanQuery };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);
    setLastFailedQuery(null);

    try {
      const res = await assistantProvider.getResponse({
        queryText: cleanQuery,
        project,
        validation,
        history: messages
      });

      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: res.text,
          sourceTag: res.sourceTag || res.provider || 'Deterministic Rule Engine',
          verifiedFacts: res.verifiedFacts || []
        }
      ]);
    } catch (err) {
      setLastFailedQuery(cleanQuery);
      setMessages(prev => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ I encountered a temporary connection issue processing that query. You can click Retry below.`,
          isError: true
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Execute initialQuery if provided via navigation state
  useEffect(() => {
    if (initialQuery && !initialQueryExecutedRef.current) {
      initialQueryExecutedRef.current = true;
      handleQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleCopyMessage = (id, text) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const quickPrompts = [
    'Explain how my circuit is wired',
    'Which pin is my LED connected to?',
    'Check if my firmware pins match hardware',
    'Explain why I need a resistor for the LED'
  ];

  return (
    <TracewiseBubbleArea theme="light" style={{ height: '100%', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Pinned Assistant Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--tw-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            zIndex: 10
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
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
                Engineering Assistant
              </h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)' }}>
                Conversational • Grounded in Circuit Netlist
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: 'var(--tw-brand-soft)',
              color: 'var(--tw-brand)',
              fontSize: '0.68rem',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            <ShieldCheck size={12} />
            <span>Student Safe</span>
          </div>
        </div>

        {/* Scrollable Chat Area with Independent Scrolling */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Active Proposals Section */}
          {proposals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actionable Proposals ({proposals.length})
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)' }}>
                  Requires User Approval
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
                    <span>{appliedProposalId === prop.id ? 'Fix Applied' : 'Review & Apply'}</span>
                  </TracewiseBubbleButton>
                </div>
              ))}
            </div>
          )}

          {/* Chat Conversation Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conversation
            </span>

            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    backgroundColor: m.role === 'user' ? 'var(--tw-brand)' : (m.isError ? '#fef2f2' : 'var(--tw-bg)'),
                    color: m.role === 'user' ? '#ffffff' : (m.isError ? '#991b1b' : 'var(--tw-text)'),
                    border: m.role === 'user' ? 'none' : (m.isError ? '1px solid #fecaca' : '1px solid var(--tw-border)'),
                    fontSize: '0.84rem',
                    lineHeight: 1.55,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    wordBreak: 'break-word'
                  }}
                >
                  {m.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  ) : (
                    <SafeMarkdown content={m.text} />
                  )}
                </div>

                {/* Footer metadata & copy action for assistant replies */}
                {m.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.68rem', color: 'var(--tw-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: m.sourceTag?.includes('Gemini') ? 'var(--tw-cyan)' : 'var(--tw-success)' }} />
                      {m.sourceTag || 'Deterministic Rule Engine'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(m.id, m.text)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--tw-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}
                      title="Copy response to clipboard"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check size={11} color="var(--tw-success)" />
                          <span style={{ color: 'var(--tw-success)', fontWeight: 600 }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  backgroundColor: 'var(--tw-bg)',
                  border: '1px solid var(--tw-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--tw-text-muted)'
                }}
              >
                <RefreshCw size={13} className="animate-spin" />
                <span>Analyzing circuit netlist & AST rules...</span>
              </div>
            )}

            {/* Retry button if last query failed */}
            {lastFailedQuery && !isThinking && (
              <div style={{ alignSelf: 'flex-start' }}>
                <TracewiseBubbleButton
                  onClick={() => handleQuery(lastFailedQuery)}
                  variant="secondary"
                  size="sm"
                  style={{ gap: '6px', fontSize: '0.74rem' }}
                >
                  <RotateCcw size={12} />
                  <span>Retry Question</span>
                </TracewiseBubbleButton>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
              Suggested Questions:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuery(p)}
                  disabled={isThinking}
                  style={{
                    backgroundColor: 'var(--tw-brand-soft)',
                    border: '1px solid var(--tw-border)',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    color: 'var(--tw-brand)',
                    cursor: isThinking ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    opacity: isThinking ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !isThinking && (e.currentTarget.style.backgroundColor = 'rgba(30,63,216,0.12)')}
                  onMouseLeave={(e) => !isThinking && (e.currentTarget.style.backgroundColor = 'var(--tw-brand-soft)')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Jump to Latest Button */}
        {showJumpToBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            style={{
              position: 'absolute',
              bottom: '68px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'var(--tw-brand)',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              boxShadow: '0 4px 14px rgba(30, 63, 216, 0.4)',
              cursor: 'pointer',
              zIndex: 25,
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <span>Jump to latest</span>
            <ChevronDown size={14} />
          </button>
        )}

        {/* Pinned Chat Input Bar */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--tw-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexShrink: 0,
            zIndex: 10
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleQuery(inputText);
              }
            }}
            placeholder="Ask a circuit or code question..."
            disabled={isThinking}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: '20px',
              border: '1px solid var(--tw-border)',
              fontSize: '0.82rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <TracewiseBubbleIconButton
            onClick={() => handleQuery(inputText)}
            variant="primary"
            size="sm"
            title="Send Question"
            disabled={!inputText.trim() || isThinking}
          >
            <Send size={15} />
          </TracewiseBubbleIconButton>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
