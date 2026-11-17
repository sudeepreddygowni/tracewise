import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userParam = searchParams.get('user');
    if (userParam && isAuthenticated) {
      setTargetHandle(userParam.replace(/^@/, ''));
      setNewModalOpen(true);
    }
  }, [searchParams, isAuthenticated]);

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

      // On desktop, auto-select first conversation if none selected
      if (!isMobile && !activeConvId && list.length > 0) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.warn('Load conversations error:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [user, activeConvId, isMobile]);

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
          markConversationAsRead(activeConvId, user.uid).catch(() => {});
        }
      })
      .catch(err => {
        console.warn('Load messages error:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
      });

    // Realtime subscription
    const unsubscribe = subscribeToConversationMessages(activeConvId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, {
          id: newMsg.id,
          conversationId: newMsg.conversation_id,
          senderId: newMsg.sender_id,
          content: newMsg.content,
          attachments: newMsg.attachments || [],
          deliveryStatus: newMsg.delivery_status,
          createdAt: newMsg.created_at,
          isMine: newMsg.sender_id === user.uid
        }];
      });
      markConversationAsRead(activeConvId, user.uid).catch(() => {});
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeConvId, user]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if ((!messageText.trim() && attachments.length === 0) || !activeConvId || sending) {
      return;
    }

    setSending(true);
    const pendingText = messageText.trim();
    const pendingAttachments = [...attachments];

    // Optimistic UI insert
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId: activeConvId,
      senderId: user.uid,
      content: pendingText,
      attachments: pendingAttachments,
      deliveryStatus: 'sending',
      createdAt: new Date().toISOString(),
      isMine: true
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setMessageText('');
    setAttachments([]);

    try {
      const saved = await sendMessage(activeConvId, user.uid, pendingText, pendingAttachments);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, isMine: true } : m));
      // Refresh conversation list to bump recent message
      loadConversations();
    } catch (err) {
      console.error('Send message failed:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleRequestResponse = async (action) => {
    if (!activeConvId || !user) return;
    try {
      await respondToConversationRequest(activeConvId, action, user.uid);
      await loadConversations();
    } catch (err) {
      alert(err.message || 'Failed to update request.');
    }
  };

  const handleBlockUser = async () => {
    if (!activeConv || !user) return;
    try {
      await blockUser(user.uid, activeConv.otherUser.id, blockReason);
      setBlockModalOpen(false);
      setBlockReason('');
      setActiveConvId(null);
      await loadConversations();
      const updatedBlocked = await getBlockedUsers(user.uid);
      setBlockedUsers(updatedBlocked);
      alert(`User @${activeConv.otherUser.handle} has been blocked.`);
    } catch (err) {
      alert(err.message || 'Failed to block user.');
    }
  };

  const handleUnblock = async (blockedUserId) => {
    if (!user) return;
    try {
      await unblockUser(user.uid, blockedUserId);
      setBlockedUsers(prev => prev.filter(b => b.blockedUserId !== blockedUserId));
      await loadConversations();
    } catch (err) {
      alert(err.message || 'Failed to unblock user.');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'requests') {
      return c.status === 'pending' && !c.isInitiator;
    }
    if (activeTab === 'active') {
      return c.status === 'active' || (c.status === 'pending' && c.isInitiator);
    }
    return true;
  }).filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.otherUser?.name?.toLowerCase().includes(q) ||
      c.otherUser?.handle?.toLowerCase().includes(q) ||
      c.lastMessageText?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F7FB',
        paddingTop: '90px',
        paddingBottom: '60px',
        color: '#172033',
        fontFamily: 'var(--font-sans)'
      }}
    >
      <div className="container-tw" style={{ maxWidth: '1180px' }}>
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#2563EB',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  backgroundColor: '#EFF6FF',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid #DBEAFE'
                }}
              >
                Maker Collaboration
              </span>
            </div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#172033',
                marginTop: '6px',
                letterSpacing: '-0.02em',
                margin: '6px 0 0'
              }}
            >
              Direct Messages
            </h1>
          </div>

          <TracewiseBubbleArea theme="light" style={{ display: 'flex', gap: '10px' }}>
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
          <div
            style={{
              padding: '18px 24px',
              borderRadius: '16px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E40AF', margin: 0 }}>
                Sign in to message fellow makers
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#3B82F6', margin: '4px 0 0' }}>
                Private messaging requires an authorized account to protect community privacy and ensure safe collaboration.
              </p>
            </div>
            <TracewiseBubbleButton onClick={() => setAuthModalOpen(true)} variant="primary" size="sm">
              Connect Account
            </TracewiseBubbleButton>
          </div>
        )}

        {/* Main Messenger Box */}
        <div
          className="messenger-card-container"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            overflow: 'hidden',
            minHeight: '640px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* =========================================================================
              LEFT COLUMN: CONVERSATION LIST (Hidden on mobile if a conversation is open)
          ========================================================================= */}
          {(!isMobile || !activeConvId) && (
            <div
              style={{
                borderRight: isMobile ? 'none' : '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF'
              }}
            >
              {/* Search conversations */}
              <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    color="#64748B"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '9px 12px 9px 36px',
                      fontSize: '0.85rem',
                      color: '#172033',
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
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: activeTab === 'active' ? '1px solid #DBEAFE' : '1px solid transparent',
                      backgroundColor: activeTab === 'active' ? '#EFF6FF' : 'transparent',
                      color: activeTab === 'active' ? '#2563EB' : '#64748B',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: activeTab === 'requests' ? '1px solid #DBEAFE' : '1px solid transparent',
                      backgroundColor: activeTab === 'requests' ? '#EFF6FF' : 'transparent',
                      color: activeTab === 'requests' ? '#2563EB' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Requests</span>
                    {conversations.filter(c => c.status === 'pending' && !c.isInitiator).length > 0 && (
                      <span
                        style={{
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontWeight: 800
                        }}
                      >
                        {conversations.filter(c => c.status === 'pending' && !c.isInitiator).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Conversation list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loadingConvs ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                    {activeTab === 'requests' ? 'No message requests pending.' : 'No conversations yet.'}
                    <div style={{ marginTop: '14px' }}>
                      <TracewiseBubbleButton
                        size="sm"
                        variant="secondary"
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
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
                          borderBottom: '1px solid #E2E8F0',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: isSelected ? '#FFFFFF' : '#172033',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}
                        >
                          {conv.otherUser?.avatarUrl ? (
                            <img
                              src={conv.otherUser.avatarUrl}
                              alt={conv.otherUser.name || 'User'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            conv.otherUser?.name?.[0]?.toUpperCase() || 'M'
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#172033',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {conv.otherUser?.name}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p
                              style={{
                                fontSize: '0.8rem',
                                color: isSelected ? '#2563EB' : '#64748B',
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {conv.status === 'pending' && !conv.isInitiator ? '✉️ Message request...' : (conv.lastMessageText || 'No messages yet')}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0 }} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              RIGHT COLUMN: ACTIVE CHAT THREAD (Shown on desktop or when conversation selected on mobile)
          ========================================================================= */}
          {(!isMobile || activeConvId) && (
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', minHeight: '600px' }}>
              {activeConv ? (
                <>
                  {/* Chat Header */}
                  <div
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Mobile Back Button */}
                      {isMobile && (
                        <button
                          type="button"
                          onClick={() => setActiveConvId(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: '#172033',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          aria-label="Back to conversations"
                        >
                          <ArrowLeft size={16} />
                          <span>Back</span>
                        </button>
                      )}

                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #DBEAFE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          overflow: 'hidden'
                        }}
                      >
                        {activeConv.otherUser?.avatarUrl ? (
                          <img
                            src={activeConv.otherUser.avatarUrl}
                            alt={activeConv.otherUser.name || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          activeConv.otherUser?.name?.[0]?.toUpperCase() || 'M'
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#172033', margin: 0 }}>
                          {activeConv.otherUser?.name}
                        </h3>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          @{activeConv.otherUser?.handle}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        to={`/profile/${activeConv.otherUser?.handle}`}
                        style={{
                          fontSize: '0.78rem',
                          color: '#2563EB',
                          textDecoration: 'none',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: '#EFF6FF',
                          border: '1px solid #DBEAFE',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        <span>Profile</span>
                        <ExternalLink size={12} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setBlockModalOpen(true)}
                        style={{
                          fontSize: '0.78rem',
                          color: '#DC2626',
                          background: '#FEF2F2',
                          border: '1px solid #FEE2E2',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        <Ban size={12} />
                        <span>Block</span>
                      </button>
                    </div>
                  </div>

                  {/* Request Banner if pending */}
                  {activeConv.status === 'pending' && (
                    <div
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#FEF9C3',
                        borderBottom: '1px solid #FEF08A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ fontSize: '0.84rem', color: '#854D0E' }}>
                        {activeConv.isInitiator
                          ? 'Waiting for recipient to accept your message request.'
                          : 'This maker requested to message you. Accept to start direct communication.'}
                      </div>
                      {!activeConv.isInitiator && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <TracewiseBubbleButton size="sm" variant="primary" onClick={() => handleRequestResponse('accept')}>
                            Accept
                          </TracewiseBubbleButton>
                          <TracewiseBubbleButton size="sm" variant="ghost" onClick={() => handleRequestResponse('decline')} style={{ color: '#DC2626' }}>
                            Decline
                          </TracewiseBubbleButton>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Messages Scroll Area */}
                  <div
                    style={{
                      flex: 1,
                      padding: '20px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      backgroundColor: '#FAFCFF'
                    }}
                  >
                    {loadingMessages ? (
                      <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', margin: 'auto' }}>
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', margin: 'auto' }}>
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
                              maxWidth: '78%',
                              alignSelf: isMine ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div
                              style={{
                                padding: '10px 16px',
                                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                backgroundColor: isMine ? '#2563EB' : '#F1F5F9',
                                border: isMine ? 'none' : '1px solid #E2E8F0',
                                color: isMine ? '#FFFFFF' : '#172033',
                                fontSize: '0.88rem',
                                lineHeight: 1.5,
                                wordBreak: 'break-word',
                                boxShadow: isMine
                                  ? '0 3px 10px rgba(37, 99, 235, 0.25)'
                                  : '0 2px 6px rgba(0, 0, 0, 0.04)'
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
                                            style={{
                                              maxHeight: '160px',
                                              maxWidth: '240px',
                                              objectFit: 'cover',
                                              borderRadius: '8px',
                                              display: 'block'
                                            }}
                                          />
                                        </a>
                                      ) : (
                                        <a
                                          href={att.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                                            color: isMine ? '#FFFFFF' : '#2563EB',
                                            border: isMine ? 'none' : '1px solid #E2E8F0',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                            fontSize: '0.78rem'
                                          }}
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
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '4px',
                                fontSize: '0.7rem',
                                color: '#64748B'
                              }}
                            >
                              <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMine && (
                                <span>
                                  {m.deliveryStatus === 'read' ? (
                                    <CheckCheck size={12} color="#2563EB" />
                                  ) : (
                                    <Check size={12} color="#64748B" />
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
                      borderTop: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
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
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '11px 16px',
                          fontSize: '0.9rem',
                          color: '#172033',
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
                <div style={{ margin: 'auto', textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  <MessageSquare size={44} color="#94A3B8" style={{ marginBottom: '14px' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#172033', fontWeight: 700, margin: 0 }}>
                    Select a Conversation
                  </h3>
                  <p style={{ fontSize: '0.88rem', maxWidth: '340px', margin: '6px auto 0' }}>
                    Choose an existing discussion thread from the left or start a new introduction message request.
                  </p>
                  <div style={{ marginTop: '18px' }}>
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
          )}
        </div>
      </div>

      {/* =========================================================================
          NEW MESSAGE MODAL (Light Theme)
      ========================================================================= */}
      {newModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 24, 49, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setNewModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172033', margin: 0 }}>
                Start a Conversation
              </h3>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Send an introduction message request. The conversation will open once the maker accepts.
            </p>

            {newModalError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  color: '#DC2626',
                  fontSize: '0.84rem'
                }}
              >
                {newModalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#172033', marginBottom: '6px' }}>
                Recipient Username Handle
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>@</span>
                <input
                  type="text"
                  placeholder="e.g. alex_circuits"
                  value={targetHandle}
                  onChange={(e) => setTargetHandle(e.target.value.replace(/^@/, ''))}
                  style={{
                    width: '100%',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '10px 12px 10px 30px',
                    fontSize: '0.9rem',
                    color: '#172033',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#172033', marginBottom: '6px' }}>
                Introduction Message
              </label>
              <textarea
                rows={3}
                placeholder="Hi! I noticed your robotics project and wanted to ask about your motor driver wiring..."
                value={initialMsgText}
                onChange={(e) => setInitialMsgText(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  color: '#172033',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
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
          BLOCK USER MODAL (Light Theme)
      ========================================================================= */}
      {blockModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 24, 49, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setBlockModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCA5A5',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626' }}>
              <ShieldAlert size={22} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#172033' }}>
                Block @{activeConv?.otherUser?.handle}?
              </h3>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Blocked users cannot send you messages or view your private projects. You can unblock them at any time.
            </p>

            <textarea
              rows={2}
              placeholder="Reason for blocking (optional)..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.86rem',
                color: '#172033',
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
