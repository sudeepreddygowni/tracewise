import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Minus,
  Send,
  HelpCircle,
  Play,
  ArrowRight,
  BookOpen,
  Wrench,
  RotateCcw,
  Bot
} from 'lucide-react';
import { ROUTE_CONTEXTS, matchLocalKnowledge } from '../../data/tracewiseKnowledge';
import { TUTORIAL_LESSONS } from '../../tutorials/tutorialData';
import { TutorialPlayer } from '../onboarding/TutorialPlayer';
import { assistantProvider } from '../../domain/assistant/assistantProvider';
import { SafeMarkdown } from '../studio/SafeMarkdown';
import { Analytics } from '../../services/analyticsService';

export function TracewiseMini() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [currentRole, setCurrentRole] = useState('Assistant');
  const chatBottomRef = useRef(null);

  // Normalize route context
  const getRouteContext = (pathname) => {
    const key = Object.keys(ROUTE_CONTEXTS).find(r => pathname.startsWith(r)) || '/app';
    return ROUTE_CONTEXTS[key] || ROUTE_CONTEXTS['/app'];
  };

  // Re-seed conversation when route changes if no ongoing conversation
  useEffect(() => {
    const ctx = getRouteContext(location.pathname);
    setCurrentRole(ctx.role);
    setSuggestedQuestions(ctx.suggestedQuestions);

    // Initial contextual message
    setMessages([
      {
        id: 'msg-init-' + location.pathname,
        role: 'assistant',
        text: `### 👋 Hi! I am Tracewise Mini\n\n${ctx.welcome}\n\nAsk me anything about this page or choose a suggestion below:`,
        recommendedLessonId: ctx.recommendedLessonId
      }
    ]);
  }, [location.pathname]);

  // Listen for global custom events to open Mini
  useEffect(() => {
    const handleOpenMini = (e) => {
      setIsOpen(true);
      Analytics.miniOpened?.(location.pathname);
      if (e.detail?.query) {
        handleSend(e.detail.query);
      }
    };
    window.addEventListener('tracewise:open_mini', handleOpenMini);
    return () => window.removeEventListener('tracewise:open_mini', handleOpenMini);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    Analytics.miniOpened?.(location.pathname);
  };

  const handleSend = async (queryToUse) => {
    const query = (queryToUse || inputText).trim();
    if (!query) return;

    const userMsg = { id: 'usr-' + Date.now(), role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      // 1. Try local deterministic knowledge base first (0 network latency, 100% verified)
      const localResult = matchLocalKnowledge(query, location.pathname);

      if (localResult) {
        Analytics.miniQueried?.(query, true);
        if (localResult.recommendedLessonId) {
          Analytics.tutorialRecommended?.(localResult.recommendedLessonId);
        }

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: 'ast-' + Date.now(),
              role: 'assistant',
              text: localResult.text,
              sourceTag: localResult.sourceTag,
              recommendedLessonId: localResult.recommendedLessonId,
              followUps: localResult.followUps
            }
          ]);
          setIsThinking(false);
        }, 150);
        return;
      }

      // 2. Query shared AI assistant gateway
      Analytics.miniQueried?.(query, false);
      const aiResponse = await assistantProvider.getResponse({
        queryText: query,
        task: 'mini_help',
        history: messages.slice(-4),
        project: null,
        validation: null
      });

      // Check if response references any known tutorial
      let recLesson = null;
      const lowerText = (aiResponse.text || '').toLowerCase();
      if (lowerText.includes('component') || lowerText.includes('add') || lowerText.includes('led')) {
        recLesson = 'components';
      } else if (lowerText.includes('wire') || lowerText.includes('connect')) {
        recLesson = 'wiring';
      } else if (lowerText.includes('code') || lowerText.includes('firmware') || lowerText.includes('setup')) {
        recLesson = 'firmware';
      } else if (lowerText.includes('simulat')) {
        recLesson = 'simulation';
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'ast-' + Date.now(),
          role: 'assistant',
          text: aiResponse.text || 'I’m here to help! Could you clarify what you’d like to build or debug?',
          sourceTag: aiResponse.sourceTag || 'Tracewise AI Gateway',
          recommendedLessonId: recLesson
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'ast-err-' + Date.now(),
          role: 'assistant',
          text: 'I ran into a connection issue, but you can explore our 8 interactive tutorials or open the Studio Assistant for offline diagnostics.',
          recommendedLessonId: 'dashboard'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLaunchLesson = (lessonId) => {
    // Clean lesson id
    const cleanId = String(lessonId).replace(/^lesson-\d+-/, '');
    const found = TUTORIAL_LESSONS.find(l => l.id === cleanId || l.id === lessonId);
    if (found) {
      setActiveLesson(found);
    } else {
      setActiveLesson(TUTORIAL_LESSONS[0]);
    }
  };

  const handleHandoffToStudio = () => {
    setIsOpen(false);
    if (location.pathname.includes('/studio')) {
      // Trigger open assistant tab event
      window.dispatchEvent(new CustomEvent('tracewise:open_studio_assistant'));
    } else {
      navigate('/app/studio/starter-traffic-light', { state: { openAssistant: true } });
    }
  };

  return (
    <>
      {/* Floating Launcher Button (visible when closed) */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Open Tracewise Mini AI Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 950,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 58, 138, 0.85))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35), 0 0 16px rgba(56, 189, 248, 0.25)',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(56, 189, 248, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.35), 0 0 16px rgba(56, 189, 248, 0.25)';
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={17} color="#38bdf8" />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 6px #38bdf8'
              }}
            />
          </div>
          <span>Ask Mini</span>
        </button>
      )}

      {/* Floating Mini Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Tracewise Mini Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 960,
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.2)',
            color: '#f8fafc',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.35), rgba(56, 189, 248, 0.1))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={16} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                  Tracewise Mini
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>
                  {currentRole}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Minimize"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages scroll area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '92%'
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isUser ? 'rgba(30, 64, 175, 0.45)' : 'rgba(255, 255, 255, 0.05)',
                      border: isUser ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      color: isUser ? '#e0f2fe' : '#f1f5f9'
                    }}
                  >
                    <SafeMarkdown content={msg.text} />
                  </div>

                  {/* Tutorial recommendation card */}
                  {msg.recommendedLessonId && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Play size={14} color="#38bdf8" />
                        <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                          Recommended Tutorial
                        </span>
                      </div>
                      <button
                        onClick={() => handleLaunchLesson(msg.recommendedLessonId)}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Watch Now
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}

                  {/* Follow up pills if any */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {msg.followUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(fu)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#cbd5e1',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isThinking && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 14px',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={13} color="#38bdf8" />
                Thinking...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Studio handoff bar if in studio */}
          {location.pathname.includes('/studio') && (
            <div
              style={{
                padding: '8px 14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                backgroundColor: 'rgba(30, 58, 138, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Need deep circuit debugging?
              </span>
              <button
                onClick={handleHandoffToStudio}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                Open Studio Assistant
                <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Suggested question pills */}
          {suggestedQuestions.length > 0 && (
            <div
              style={{
                padding: '8px 14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#bae6fd',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              gap: '8px'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask about circuits, code, or tutorials..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              aria-label="Send query"
              style={{
                background: inputText.trim() && !isThinking
                  ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '10px',
                cursor: inputText.trim() && !isThinking ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Tutorial Player Modal if opened from Mini */}
      {activeLesson && (
        <TutorialPlayer
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onSelectLesson={l => setActiveLesson(l)}
          totalLessons={TUTORIAL_LESSONS.length}
          onLaunchPractice={() => {
            setActiveLesson(null);
            setIsOpen(false);
            navigate('/app/studio/starter-traffic-light', { state: { practiceMode: true } });
          }}
        />
      )}
    </>
  );
}
