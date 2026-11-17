import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Shield,
  ShieldAlert,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  X,
  Plus,
  Users,
  Paperclip,
  ExternalLink,
  Ban
} from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  startConversationRequest,
  respondToConversationRequest,
  markConversationAsRead,
  blockUser,
  unblockUser,
  getBlockedUsers,
  subscribeToConversationMessages
} from '../services/messagingService';
import { MediaAttachmentPicker } from '../components/ui/MediaAttachmentPicker';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';
import { AuthModal } from '../components/auth/AuthModal';

export function MessagesPage() {
  const { conversationId: paramConvId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(paramConvId || null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'requests' | 'blocked'
  const [blockedUsers, setBlockedUsers] = useState([]);

  // New message modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [targetHandle, setTargetHandle] = useState('');
  const [initialMsgText, setInitialMsgText] = useState('');
  const [newModalError, setNewModalError] = useState(null);
  const [creatingConv, setCreatingConv] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Block modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const messagesEndRef = useRef(null);
  const activeConv = conversations.find(c => c.id === activeConvId);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user || user.isAnonymous) {
      setLoadingConvs(false);
      return;
    }
    setLoadingConvs(true);
    try {
      const list = await getConversations(user.uid);
      setConversations(list);

      // Auto-select first conversation if none selected
      if (!activeConvId && list.length > 0) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.warn('Load conversations error:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [user, activeConvId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load blocked users
  useEffect(() => {
    if (user && !user.isAnonymous) {
      getBlockedUsers(user.uid).then(setBlockedUsers).catch(() => {});
    }
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId || !user) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    getConversationMessages(activeConvId, user.uid)
      .then(msgs => {
        if (isMounted) {
          setMessages(msgs);
          markConversationAsRead(activeConvId, user.uid);
        }
      })
      .catch(err => console.warn('Get messages error:', err))
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
      });

    // Realtime subscription
    const unsubscribe = subscribeToConversationMessages(activeConvId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, { ...newMsg, isMine: newMsg.senderId === user.uid }];
      });
      markConversationAsRead(activeConvId, user.uid);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeConvId, user]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    const clean = messageText.trim();
    if (!clean && attachments.length === 0) return;
    if (!activeConvId) return;

    setSending(true);
    try {
      const sent = await sendMessage(activeConvId, clean, attachments, user);
      setMessages(prev => [...prev, sent]);
      setMessageText('');
      setAttachments([]);

      // Update local conversation lastMessage
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConvId
            ? { ...c, lastMessageText: clean || 'Sent an attachment', lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Respond to message request
  const handleRequestResponse = async (action) => {
    if (!activeConvId || !user) return;
    try {
      await respondToConversationRequest(activeConvId, action, user);
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConvId
            ? { ...c, status: action === 'accept' ? 'accepted' : 'declined' }
            : c
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update request.');
    }
  };

  // Block user handler
  const handleBlockUser = async () => {
    if (!activeConv?.otherUser?.id || !user) return;
    try {
      await blockUser(activeConv.otherUser.id, blockReason, user);
      setBlockModalOpen(false);
      setBlockReason('');
      loadConversations();
      alert(`User @${activeConv.otherUser.handle} has been blocked.`);
    } catch (err) {
      alert(err.message || 'Failed to block user.');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'requests') {
      return c.status === 'pending' && !c.isInitiator;
    }
    if (activeTab === 'active') {
      return c.status === 'accepted' || (c.status === 'pending' && c.isInitiator);
    }
    return false;
  }).filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.otherUser?.name?.toLowerCase().includes(q) ||
      c.otherUser?.handle?.toLowerCase().includes(q) ||
      c.lastMessageText?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#071831', paddingTop: '100px', paddingBottom: '40px', color: '#f8fafc' }}>
      <div className="container-tw" style={{ maxWidth: '1200px' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Private Collaboration
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
              Direct Messages
            </h1>
          </div>

          <TracewiseBubbleArea theme="dark" style={{ display: 'flex', gap: '10px' }}>
            <TracewiseBubbleButton
              onClick={() => {
                if (!isAuthenticated) setAuthModalOpen(true);
                else setNewModalOpen(true);
              }}
              variant="primary"
              size="md"
            >
              <Plus size={16} />
              <span>New Message</span>
            </TracewiseBubbleButton>
          </TracewiseBubbleArea>
        </div>

        {/* Guest Warning Banner if not authenticated */}
        {!isAuthenticated && (
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(45, 197, 233, 0.1)', border: '1px solid rgba(45, 197, 233, 0.3)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>Sign in to message makers</h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: '2px' }}>
                Private messaging requires an account to protect maker privacy and prevent spam.
              </p>
            </div>
            <TracewiseBubbleButton onClick={() => setAuthModalOpen(true)} variant="primary" size="sm">
              Connect Account
            </TracewiseBubbleButton>
          </div>
        )}

        {/* Main Messenger Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 340px) 1fr',
            backgroundColor: '#0a1f40',
            border: '1px solid rgba(74, 167, 242, 0.25)',
            borderRadius: '24px',
            overflow: 'hidden',
            minHeight: '620px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
          }}
          className="messenger-container"
        >
          {/* =========================================================================
              LEFT COLUMN: CONVERSATION LIST
          ========================================================================= */}
          <div style={{ borderRight: '1px solid rgba(74, 167, 242, 0.15)', display: 'flex', flexDirection: 'column', backgroundColor: '#071831' }}>
            
            {/* Search conversations */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(74, 167, 242, 0.15)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '8px 12px 8px 36px',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Tabs: Active vs. Requests */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeTab === 'active' ? 'rgba(45, 197, 233, 0.2)' : 'transparent',
                    color: activeTab === 'active' ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeTab === 'requests' ? 'rgba(45, 197, 233, 0.2)' : 'transparent',
                    color: activeTab === 'requests' ? '#38bdf8' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Requests</span>
                  {conversations.filter(c => c.status === 'pending' && !c.isInitiator).length > 0 && (
                    <span style={{ backgroundColor: '#2dc5e9', color: '#071831', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '10px', fontWeight: 800 }}>
                      {conversations.filter(c => c.status === 'pending' && !c.isInitiator).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Conversation list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingConvs ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {activeTab === 'requests' ? 'No message requests pending.' : 'No conversations yet.'}
                  <div style={{ marginTop: '12px' }}>
                    <TracewiseBubbleButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewModalOpen(true)}
                    >
                      Start a Conversation
                    </TracewiseBubbleButton>
                  </div>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isSelected = conv.id === activeConvId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      style={{
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: isSelected ? 'rgba(45, 197, 233, 0.12)' : 'transparent',
                        borderLeft: isSelected ? '3px solid #2dc5e9' : '3px solid transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(30, 63, 216, 0.35)',
                          border: '1px solid rgba(45, 197, 233, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          flexShrink: 0
                        }}
                      >
                        {conv.otherUser?.name?.[0]?.toUpperCase() || 'M'}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.otherUser?.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.78rem', color: isSelected ? '#cbd5e1' : '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.status === 'pending' && !conv.isInitiator ? '✉️ Message request...' : (conv.lastMessageText || 'No messages yet')}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2dc5e9', flexShrink: 0 }} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: ACTIVE CHAT THREAD
          ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0a1f40' }}>
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(74, 167, 242, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(7, 24, 49, 0.6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#17387e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#ffffff' }}>
                      {activeConv.otherUser?.name?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                        {activeConv.otherUser?.name}
                      </h3>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        @{activeConv.otherUser?.handle}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link
                      to={`/profile/${activeConv.otherUser?.handle}`}
                      style={{ fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none', padding: '4px 10px', borderRadius: '8px', background: 'rgba(45, 197, 233, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Profile</span>
                      <ExternalLink size={12} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setBlockModalOpen(true)}
                      style={{ fontSize: '0.78rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Ban size={12} />
                      <span>Block</span>
                    </button>
                  </div>
                </div>

                {/* Request Banner if pending */}
                {activeConv.status === 'pending' && (
                  <div style={{ padding: '12px 20px', backgroundColor: 'rgba(234, 179, 8, 0.15)', borderBottom: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.84rem', color: '#fef08a' }}>
                      {activeConv.isInitiator
                        ? 'Waiting for recipient to accept your message request.'
                        : 'This maker requested to message you. Accept to start direct communication.'}
                    </div>
                    {!activeConv.isInitiator && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <TracewiseBubbleButton size="sm" variant="primary" onClick={() => handleRequestResponse('accept')}>
                          Accept
                        </TracewiseBubbleButton>
                        <TracewiseBubbleButton size="sm" variant="ghost" onClick={() => handleRequestResponse('decline')}>
                          Decline
                        </TracewiseBubbleButton>
                      </div>
                    )}
                  </div>
                )}

                {/* Messages Scroll Area */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>
                      No messages yet. Send a friendly message to begin collaborating!
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isMine = m.isMine;
                      return (
                        <div
                          key={m.id || idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMine ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            alignSelf: isMine ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div
                            style={{
                              padding: '10px 14px',
                              borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              backgroundColor: isMine ? '#1e3fd8' : '#071831',
                              border: isMine ? '1px solid rgba(45, 197, 233, 0.4)' : '1px solid rgba(74, 167, 242, 0.25)',
                              color: '#ffffff',
                              fontSize: '0.88rem',
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            {m.content}

                            {/* Render Attachments */}
                            {m.attachments && m.attachments.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {m.attachments.map((att, aIdx) => (
                                  <div key={att.id || aIdx} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                    {att.type === 'image' && att.url ? (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={att.url}
                                          alt={att.name}
                                          style={{ maxHeight: '160px', maxWidth: '240px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#38bdf8', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem' }}
                                      >
                                        📄 {att.name}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message Metadata (Timestamp & Status) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '0.7rem', color: '#94a3b8' }}>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMine && (
                              <span>
                                {m.deliveryStatus === 'read' ? (
                                  <CheckCheck size={12} color="#38bdf8" />
                                ) : (
                                  <Check size={12} color="#94a3b8" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(74, 167, 242, 0.15)',
                    backgroundColor: 'rgba(7, 24, 49, 0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <MediaAttachmentPicker
                    attachments={attachments}
                    onChange={setAttachments}
                    userId={user?.uid}
                    disabled={sending}
                  />

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sending}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '14px',
                        padding: '10px 16px',
                        fontSize: '0.9rem',
                        color: '#ffffff',
                        outline: 'none'
                      }}
                    />

                    <TracewiseBubbleButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={sending || (!messageText.trim() && attachments.length === 0)}
                    >
                      <Send size={15} />
                      <span>Send</span>
                    </TracewiseBubbleButton>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <MessageSquare size={48} color="#17387e" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700 }}>Select a Conversation</h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '340px', marginTop: '6px' }}>
                  Choose an existing thread from the left, or send a new message request to connect with another maker.
                </p>
                <div style={{ marginTop: '16px' }}>
                  <TracewiseBubbleButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (!isAuthenticated) setAuthModalOpen(true);
                      else setNewModalOpen(true);
                    }}
                  >
                    Start a New Conversation
                  </TracewiseBubbleButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          NEW MESSAGE MODAL
      ========================================================================= */}
      {newModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 24, 49, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setNewModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#071831',
              border: '1px solid rgba(74, 167, 242, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Start a Conversation
              </h3>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              Send an introduction message request. The conversation will begin once the maker accepts.
            </p>

            {newModalError && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.82rem' }}>
                {newModalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Recipient Username Handle
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>@</span>
                <input
                  type="text"
                  placeholder="e.g. alex_circuits"
                  value={targetHandle}
                  onChange={(e) => setTargetHandle(e.target.value.replace(/^@/, ''))}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '10px 12px 10px 30px',
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Introduction Message
              </label>
              <textarea
                rows={3}
                placeholder="Hi! I noticed your robotics project and wanted to ask about your motor driver wiring..."
                value={initialMsgText}
                onChange={(e) => setInitialMsgText(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <TracewiseBubbleButton variant="ghost" size="sm" onClick={() => setNewModalOpen(false)}>
                Cancel
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                variant="primary"
                size="sm"
                disabled={creatingConv || !targetHandle.trim() || !initialMsgText.trim()}
                onClick={async () => {
                  setCreatingConv(true);
                  setNewModalError(null);
                  try {
                    // Search recipient profile by handle
                    const { data: prof, error: pErr } = await supabase
                      .from('profiles')
                      .select('id, display_name, handle')
                      .ilike('handle', targetHandle.trim())
                      .single();

                    if (pErr || !prof) {
                      throw new Error(`Maker "@${targetHandle.trim()}" not found.`);
                    }

                    const res = await startConversationRequest(
                      {
                        recipientId: prof.id,
                        recipientName: prof.display_name,
                        recipientHandle: prof.handle,
                        initialMessage: initialMsgText.trim()
                      },
                      user
                    );

                    setNewModalOpen(false);
                    setTargetHandle('');
                    setInitialMsgText('');
                    await loadConversations();
                    setActiveConvId(res.conversationId);
                  } catch (err) {
                    setNewModalError(err.message || 'Failed to start conversation.');
                  } finally {
                    setCreatingConv(false);
                  }
                }}
              >
                <span>{creatingConv ? 'Sending...' : 'Send Request'}</span>
              </TracewiseBubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BLOCK USER MODAL
      ========================================================================= */}
      {blockModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 24, 49, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setBlockModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#071831',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
              <ShieldAlert size={22} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Block @{activeConv?.otherUser?.handle}?
              </h3>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              Blocked users cannot send you messages or view your private projects. You can unblock them at any time in Settings.
            </p>

            <textarea
              rows={2}
              placeholder="Reason for blocking (optional)..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '0.86rem',
                color: '#ffffff',
                outline: 'none',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <TracewiseBubbleButton variant="ghost" size="sm" onClick={() => setBlockModalOpen(false)}>
                Cancel
              </TracewiseBubbleButton>
              <TracewiseBubbleButton variant="danger" size="sm" onClick={handleBlockUser}>
                Confirm Block
              </TracewiseBubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal if guest clicks messaging */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
