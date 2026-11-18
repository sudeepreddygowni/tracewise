import { supabase, isSupabaseConfigured } from './supabase.js';
import {
  parseMessageSecurity,
  getOrCreateDeviceIdentity,
  fetchRecipientPublicKey,
  deriveSharedSessionKey,
  encryptDirectMessage,
  decryptDirectMessage
} from './e2eeService.js';

const LOCAL_MESSAGES_KEY = 'tracewise_direct_messages_v1';
const LOCAL_CONVERSATIONS_KEY = 'tracewise_conversations_v1';
const LOCAL_BLOCKS_KEY = 'tracewise_user_blocks_v1';

// -----------------------------------------------------------------------------
// GET USER CONVERSATIONS (Active, Requests, Blocked)
// -----------------------------------------------------------------------------
export async function getConversations(userId) {
  if (!userId || !isSupabaseConfigured() || !supabase) {
    try {
      const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  try {
    // 1. Fetch conversation IDs user participates in
    const { data: myParts, error: partErr } = await supabase
      .from('conversation_participants')
      .select('conversation_id, unread_count, last_read_at')
      .eq('user_id', userId);

    if (partErr || !myParts || myParts.length === 0) return [];

    const convIds = myParts.map(p => p.conversation_id);

    // 2. Fetch conversations
    const { data: convRows, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('last_message_at', { ascending: false });

    if (convErr || !convRows) return [];

    // 3. Fetch all other participants in these conversations
    const { data: allParts, error: allPartsErr } = await supabase
      .from('conversation_participants')
      .select('*')
      .in('conversation_id', convIds);

    const partsMap = new Map();
    (allParts || []).forEach(p => {
      if (!partsMap.has(p.conversation_id)) partsMap.set(p.conversation_id, []);
      partsMap.get(p.conversation_id).push(p);
    });

    const myPartsMap = new Map(myParts.map(p => [p.conversation_id, p]));

    return convRows.map(c => {
      const parts = partsMap.get(c.id) || [];
      const otherPart = parts.find(p => p.user_id !== userId) || parts[0] || {};
      const myPart = myPartsMap.get(c.id) || {};

      return {
        id: c.id,
        status: c.status,
        createdBy: c.created_by,
        isInitiator: c.created_by === userId,
        lastMessageText: c.last_message_text || '',
        lastMessageAt: c.last_message_at || c.created_at,
        unreadCount: myPart.unread_count || 0,
        otherUser: {
          id: otherPart.user_id,
          name: otherPart.user_name || 'Maker',
          handle: otherPart.user_handle || 'maker',
          avatarUrl: otherPart.user_avatar || null
        }
      };
    });
  } catch (err) {
    console.warn('Get conversations note:', err.message);
    return [];
  }
}

// -----------------------------------------------------------------------------
// GET MESSAGES FOR A CONVERSATION
// -----------------------------------------------------------------------------
export async function getConversationMessages(conversationId, userId) {
  if (!conversationId) return [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Identify the other participant in this conversation for cryptographic derivation
      let otherUserId = null;
      try {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId);
        const other = (participants || []).find(p => p.user_id !== userId);
        if (other) otherUserId = other.user_id;
      } catch {
        // Fallback without participant query
      }

      // Check if current user has cryptographic identity
      let myIdentity = null;
      let sharedSessionKey = null;
      if (userId && otherUserId) {
        try {
          myIdentity = await getOrCreateDeviceIdentity(userId);
          const otherKeyRecord = await fetchRecipientPublicKey(otherUserId);
          if (myIdentity?.keyPair?.privateKey && otherKeyRecord?.publicKeyJwk) {
            sharedSessionKey = await deriveSharedSessionKey(
              myIdentity.keyPair.privateKey,
              otherKeyRecord.publicKeyJwk,
              conversationId
            );
          }
        } catch (err) {
          console.warn('Session key derivation notice:', err.message);
        }
      }

      return await Promise.all((data || []).map(async (m) => {
        const sec = parseMessageSecurity(m);
        let displayText = m.content;
        let isDecrypted = false;
        let isKeyMissing = false;

        if (sec.isEncrypted && sec.payload) {
          if (sharedSessionKey) {
            try {
              displayText = await decryptDirectMessage(sec.payload, sharedSessionKey);
              isDecrypted = true;
            } catch (decErr) {
              console.warn('Decryption tag mismatch or error:', decErr.message);
              displayText = '[Encrypted message - could not verify authentication tag]';
              isKeyMissing = true;
            }
          } else {
            displayText = '[Encrypted message - key not registered on this device]';
            isKeyMissing = true;
          }
        }

        return {
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderHandle: m.sender_handle,
          content: displayText,
          attachments: m.attachments || [],
          deliveryStatus: m.delivery_status || 'sent',
          createdAt: m.created_at,
          isMine: m.sender_id === userId,
          isEncrypted: sec.isEncrypted,
          isDecrypted,
          isKeyMissing,
          isLegacy: sec.isLegacy,
          securityBadge: sec.badge
        };
      }));
    } catch (err) {
      console.warn('Get messages note:', err.message);
      return [];
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter(m => m.conversationId === conversationId);
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// START A CONVERSATION REQUEST (Privacy-first workflow)
// -----------------------------------------------------------------------------
export async function startConversationRequest({ recipientId, recipientName, recipientHandle, initialMessage, attachments = [] }, sender) {
  if (!sender || sender.isAnonymous) {
    throw new Error('Please sign in or save an account to message makers.');
  }

  if (recipientId === sender.uid) {
    throw new Error('You cannot start a direct conversation with yourself.');
  }

  const cleanText = (initialMessage || '').trim();
  if (!cleanText && attachments.length === 0) {
    throw new Error('Please type a message to introduce yourself.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Check if recipient has blocked sender or sender blocked recipient
      const { data: block } = await supabase
        .from('user_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${recipientId},blocked_id.eq.${sender.uid}),and(blocker_id.eq.${sender.uid},blocked_id.eq.${recipientId})`)
        .limit(1);

      if (block && block.length > 0) {
        throw new Error('Unable to message this user.');
      }

      // 2. Check if an existing conversation exists between both users
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', sender.uid);

      if (myConvs && myConvs.length > 0) {
        const myIds = myConvs.map(c => c.conversation_id);
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', myIds)
          .eq('user_id', recipientId)
          .limit(1);

        if (shared && shared.length > 0) {
          const existingId = shared[0].conversation_id;
          // Send message in existing conversation
          await sendMessage(existingId, cleanText, attachments, sender);
          return { conversationId: existingId, isExisting: true };
        }
      }

      // 3. Create new conversation in 'pending' request state
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          created_by: sender.uid,
          status: 'pending',
          last_message_text: cleanText || (attachments.length > 0 ? 'Sent an attachment' : ''),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convErr) throw convErr;

      // 4. Add sender participant
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conv.id,
          user_id: sender.uid,
          user_name: sender.displayName || 'Sender',
          user_handle: sender.handle || 'sender',
          user_avatar: sender.avatarUrl || null,
          unread_count: 0
        });

      // 5. Add recipient participant (with unread count = 1)
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conv.id,
          user_id: recipientId,
          user_name: recipientName || 'Maker',
          user_handle: recipientHandle || 'maker',
          user_avatar: null,
          unread_count: 1
        });

      // 6. Insert initial message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conv.id,
          sender_id: sender.uid,
          sender_name: sender.displayName || 'Sender',
          sender_handle: sender.handle || 'sender',
          content: cleanText,
          attachments: attachments || [],
          delivery_status: 'delivered'
        });

      return { conversationId: conv.id, isExisting: false };
    } catch (err) {
      console.error('Start conversation request failed:', err);
      throw err;
    }
  }

  // Fallback
  return { conversationId: 'conv-' + Date.now(), isExisting: false };
}

// -----------------------------------------------------------------------------
// RESPOND TO MESSAGE REQUEST (Accept or Decline)
// -----------------------------------------------------------------------------
export async function respondToConversationRequest(conversationId, action, user) {
  if (!user || !isSupabaseConfigured() || !supabase) return false;

  const validStatus = action === 'accept' ? 'accepted' : 'declined';
  try {
    const { error } = await supabase
      .from('conversations')
      .update({
        status: validStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Respond to request error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// SEND MESSAGE IN AN EXISTING CONVERSATION
// Supports both typed options object and legacy positional contracts
// -----------------------------------------------------------------------------
export async function sendMessage(arg1, arg2, arg3, arg4) {
  let conversationId;
  let content = '';
  let attachments = [];
  let sender = null;

  // Case 1: Typed Request Object { conversationId, content, attachments, sender }
  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && (arg1.conversationId || arg1.content !== undefined || arg1.sender)) {
    conversationId = arg1.conversationId;
    content = arg1.content || '';
    attachments = Array.isArray(arg1.attachments) ? arg1.attachments : [];
    sender = arg1.sender;
  } else {
    // Case 2: Positional Call
    conversationId = arg1;

    // Detect inverted call: sendMessage(conversationId, userObj, contentStr, attachmentsArr)
    if (typeof arg2 === 'object' && arg2 !== null && (arg2.uid || arg2.id)) {
      sender = arg2;
      content = arg3 || '';
      attachments = Array.isArray(arg4) ? arg4 : [];
    } else if (typeof arg2 === 'string' && typeof arg3 === 'string') {
      // Called with (conversationId, senderIdString, contentString, attachmentsArr)
      sender = { uid: arg2, displayName: 'User', handle: 'user' };
      content = arg3;
      attachments = Array.isArray(arg4) ? arg4 : [];
    } else {
      // Standard signature: sendMessage(conversationId, content, attachments, sender)
      content = arg2 || '';
      attachments = Array.isArray(arg3) ? arg3 : [];
      sender = arg4;
    }
  }

  if (!sender || sender.isAnonymous) {
    throw new Error('Please sign in or save an account to send messages.');
  }

  const cleanText = (content || '').trim();
  if (!cleanText && (!attachments || attachments.length === 0)) {
    throw new Error('Cannot send empty message.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      // Determine recipient ID and check for cryptographic device key
      let isEncrypted = false;
      let storedContent = cleanText;
      let previewSnippet = cleanText || (attachments.length > 0 ? 'Sent an attachment' : '');

      try {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId);
        const recipient = (participants || []).find(p => p.user_id !== sender.uid);

        if (recipient?.user_id) {
          const recipientKeyRecord = await fetchRecipientPublicKey(recipient.user_id);
          if (recipientKeyRecord?.publicKeyJwk) {
            const myIdentity = await getOrCreateDeviceIdentity(sender.uid);
            if (myIdentity?.keyPair?.privateKey) {
              const sharedKey = await deriveSharedSessionKey(
                myIdentity.keyPair.privateKey,
                recipientKeyRecord.publicKeyJwk,
                conversationId
              );
              const encryptedPayload = await encryptDirectMessage(cleanText, sharedKey);
              storedContent = JSON.stringify(encryptedPayload);
              isEncrypted = true;
              // Guard preview text: do not leak plaintext to unauthenticated observers
              previewSnippet = '🔒 Encrypted message';
            }
          }
        }
      } catch (cryptoErr) {
        console.warn('E2EE key negotiation notice, standard transport used:', cryptoErr.message);
      }

      // 1. Insert message
      const { data: msg, error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: sender.uid,
          sender_name: sender.displayName || 'Sender',
          sender_handle: sender.handle || 'sender',
          content: storedContent,
          attachments: attachments || [],
          delivery_status: 'delivered',
          is_encrypted: isEncrypted
        })
        .select()
        .single();

      if (msgErr) throw msgErr;

      // 2. Update conversation last message timestamp & snippet
      await supabase
        .from('conversations')
        .update({
          last_message_text: previewSnippet,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // 3. Increment unread count for other participants
      await supabase
        .from('conversation_participants')
        .update({ unread_count: 1 })
        .eq('conversation_id', conversationId)
        .neq('user_id', sender.uid);

      return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderHandle: msg.sender_handle,
        content: cleanText, // Return decrypted plaintext to sender UI
        attachments: msg.attachments || [],
        deliveryStatus: msg.delivery_status,
        createdAt: msg.created_at,
        isMine: true,
        isEncrypted,
        isDecrypted: isEncrypted,
        securityBadge: isEncrypted ? 'E2EE (Web Crypto AES-GCM-256)' : 'Legacy Plaintext'
      };
    } catch (err) {
      console.error('Send message failed:', err);
      throw err;
    }
  }

  return {
    id: 'msg-' + Date.now(),
    conversationId,
    senderId: sender.uid,
    senderName: sender.displayName,
    senderHandle: sender.handle,
    content: cleanText,
    attachments,
    deliveryStatus: 'sent',
    createdAt: new Date().toISOString(),
    isMine: true
  };
}

// -----------------------------------------------------------------------------
// MARK CONVERSATION AS READ
// -----------------------------------------------------------------------------
export async function markConversationAsRead(conversationId, userId) {
  if (!userId || !conversationId || !isSupabaseConfigured() || !supabase) return;

  try {
    // Reset participant unread count
    await supabase
      .from('conversation_participants')
      .update({
        unread_count: 0,
        last_read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    // Update message delivery status to 'read'
    await supabase
      .from('messages')
      .update({ delivery_status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .neq('delivery_status', 'read');
  } catch (err) {
    console.warn('Mark read note:', err.message);
  }
}

// -----------------------------------------------------------------------------
// USER BLOCK & REPORT CONTROLS
// -----------------------------------------------------------------------------
export async function blockUser(targetUserId, reason = '', blockerUser) {
  if (!blockerUser || blockerUser.isAnonymous || !isSupabaseConfigured() || !supabase) {
    throw new Error('Unauthorized');
  }

  try {
    const { error } = await supabase
      .from('user_blocks')
      .upsert({
        blocker_id: blockerUser.uid,
        blocked_id: targetUserId,
        reason: reason.trim()
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Block user failed:', err);
    throw err;
  }
}

export async function unblockUser(targetUserId, blockerUser) {
  if (!blockerUser || !isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerUser.uid)
      .eq('blocked_id', targetUserId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Unblock user failed:', err);
    throw err;
  }
}

export async function getBlockedUsers(blockerUserId) {
  if (!blockerUserId || !isSupabaseConfigured() || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id, reason, created_at')
      .eq('blocker_id', blockerUserId);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// REALTIME SUBSCRIPTION FOR CONVERSATION MESSAGES
// -----------------------------------------------------------------------------
export function subscribeToConversationMessages(conversationId, onMessageReceived) {
  if (!conversationId || !isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`conv_messages_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        if (payload.new && onMessageReceived) {
          onMessageReceived({
            id: payload.new.id,
            conversationId: payload.new.conversation_id,
            senderId: payload.new.sender_id,
            senderName: payload.new.sender_name,
            senderHandle: payload.new.sender_handle,
            content: payload.new.content,
            attachments: payload.new.attachments || [],
            deliveryStatus: payload.new.delivery_status || 'delivered',
            createdAt: payload.new.created_at
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
