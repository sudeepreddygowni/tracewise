import { supabase, isSupabaseConfigured } from './supabase.js';

const LOCAL_POSTS_KEY = 'tracewise_community_posts_v3';
const LOCAL_COMMENTS_KEY = 'tracewise_community_comments_v3';
const LOCAL_REPORTS_KEY = 'tracewise_community_reports_v3';

// Curated preview discussions (clearly separated from user-created live records)
const PREVIEW_COMMUNITY_POSTS = [
  {
    id: 'post-traffic-pedestrian',
    title: 'Why did adding a pedestrian button trigger a pin conflict on Pin 2?',
    category: 'Debugging Help',
    body: 'I was remixing the Starter Traffic Light project to add a crosswalk push button. When I hooked up the button to digital pin 7 on the canvas but defined BUTTON_PIN as 2 in my Arduino sketch, Tracewise immediately warned me that Pin 2 was already driving the Red LED anode! After changing `BUTTON_PIN = 7`, everything worked perfectly. Always double-check your code against your breadboard wiring.',
    tags: ['Arduino Uno', 'Pin Collision', 'Traffic Light', 'Debugging'],
    authorUid: 'preview-student-1',
    authorName: 'Alex Rivera',
    authorHandle: 'alex_circuits',
    authorAvatar: null,
    projectRef: {
      projectId: 'starter-traffic-light-buggy',
      title: 'Pedestrian Crossing Remix',
      version: 'v1.1',
      componentsCount: 6
    },
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    moderationStatus: 'approved',
    commentCount: 2
  },
  {
    id: 'post-led-resistor-current',
    title: 'Visualizing forward voltage and why 220Ω protects your LED',
    category: 'Showcase',
    body: 'A quick tip for beginners building physical circuits after designing in Tracewise: standard red 5mm LEDs drop around 1.8V to 2.1V forward voltage. Connecting it directly from Arduino 5V to GND draws way more than the 20mA limit of ATmega328P pins. Using a 220Ω resistor limits current to approximately (5V - 2V) / 220Ω = 13.6mA, keeping the LED bright and safe forever.',
    tags: ['Circuits 101', 'Ohm\'s Law', 'LED Protection', 'Hardware Safety'],
    authorUid: 'preview-student-2',
    authorName: 'Maya Patel',
    authorHandle: 'maya_robotics',
    authorAvatar: null,
    projectRef: null,
    createdAt: new Date(Date.now() - 3600000 * 52).toISOString(),
    moderationStatus: 'approved',
    commentCount: 1
  },
  {
    id: 'post-analog-ultrasonic-question',
    title: 'Should I use pulseIn() or interrupts for distance sensor echo pins?',
    category: 'Question',
    body: 'I am building an ultrasonic obstacle sensor for a mini rover in Tracewise. `pulseIn()` blocks execution while waiting for the sound bounce, which slows down the motor update loop. Is there a better non-blocking approach for HC-SR04 on an Arduino Uno?',
    tags: ['Sensors', 'Ultrasonic', 'Timing', 'Robotics'],
    authorUid: 'preview-student-3',
    authorName: 'Devon Lee',
    authorHandle: 'devon_maker',
    authorAvatar: null,
    projectRef: null,
    createdAt: new Date(Date.now() - 3600000 * 75).toISOString(),
    moderationStatus: 'approved',
    commentCount: 3
  }
];

// Helper to normalize Supabase row into frontend shape
function mapPostRow(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    tags: row.tags || [],
    authorUid: row.author_id,
    authorName: row.author_name,
    authorHandle: row.author_handle,
    projectRef: row.project_reference,
    attachments: row.attachments || [],
    moderationStatus: row.moderation_status,
    commentCount: row.comment_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCommentRow(row) {
  return {
    id: row.id,
    postId: row.post_id,
    authorUid: row.author_id,
    authorName: row.author_name,
    authorHandle: row.author_handle,
    body: row.body,
    attachments: row.attachments || [],
    likes: row.likes || 0,
    createdAt: row.created_at,
    moderationStatus: row.moderation_status
  };
}

// -----------------------------------------------------------------------------
// POST QUERIES & MUTATIONS
// -----------------------------------------------------------------------------

export async function getCommunityPosts({ category = 'All', authorUid = null, limitCount = 50 } = {}) {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const isUuid = authorUid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorUid);

      if (authorUid && !isUuid) {
        // If authorUid is a preview ID or guest handle, query preview posts directly
        return PREVIEW_COMMUNITY_POSTS.filter(p => p.authorUid === authorUid);
      }

      if (authorUid && isUuid) {
        query = query.eq('author_id', authorUid);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase community posts query warning:', error.message);
        return PREVIEW_COMMUNITY_POSTS.filter(p => !authorUid || p.authorUid === authorUid);
      }

      // When Supabase is configured, return genuine database posts
      return (data || []).map(mapPostRow);
    } catch (err) {
      console.warn('Supabase community posts query note:', err.message);
      return PREVIEW_COMMUNITY_POSTS.filter(p => !authorUid || p.authorUid === authorUid);
    }
  }

  // Fallback to local storage ONLY in unconfigured offline/preview mode
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    let posts = raw ? JSON.parse(raw) : PREVIEW_COMMUNITY_POSTS;

    if (category && category !== 'All') {
      posts = posts.filter(p => p.category === category);
    }
    if (authorUid) {
      posts = posts.filter(p => p.authorUid === authorUid);
    }
    return posts;
  } catch (e) {
    return PREVIEW_COMMUNITY_POSTS;
  }
}

export async function getCommunityPostById(postId) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Row not found
        throw error;
      }
      return data ? mapPostRow(data) : null;
    } catch (err) {
      console.warn('Supabase post detail query note:', err.message);
      return null;
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    const posts = raw ? JSON.parse(raw) : PREVIEW_COMMUNITY_POSTS;
    return posts.find(p => p.id === postId) || null;
  } catch (e) {
    return PREVIEW_COMMUNITY_POSTS.find(p => p.id === postId) || null;
  }
}

export async function createCommunityPost(postData, author) {
  if (!author) {
    throw new Error('You must be signed in to post in the community.');
  }

  if (author.isAnonymous) {
    throw new Error('Guest visitors cannot create public posts. Please save or connect an account first.');
  }

  const cleanTags = (postData.tags || [])
    .map(t => t.trim())
    .filter(Boolean);

  if (isSupabaseConfigured() && supabase) {
    try {
      const row = {
        author_id: author.uid,
        author_name: author.displayName || 'Student Maker',
        author_handle: author.handle || 'student',
        title: postData.title.trim(),
        body: postData.body.trim(),
        category: postData.category,
        tags: cleanTags,
        project_reference: postData.projectRef || null,
        attachments: postData.attachments || [],
        moderation_status: 'approved',
        comment_count: 0
      };

      const { data, error } = await supabase
        .from('community_posts')
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return mapPostRow(data);
    } catch (err) {
      console.error('Supabase post creation failed:', err);
      throw err;
    }
  }

  // Local fallback
  const newPost = {
    id: 'post-' + Date.now(),
    title: postData.title.trim(),
    body: postData.body.trim(),
    category: postData.category,
    tags: cleanTags,
    authorUid: author.uid,
    authorName: author.displayName || 'Student Maker',
    authorHandle: author.handle || 'student',
    authorAvatar: author.avatarUrl || null,
    projectRef: postData.projectRef || null,
    createdAt: new Date().toISOString(),
    moderationStatus: 'approved',
    commentCount: 0
  };

  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    const posts = raw ? JSON.parse(raw) : [...PREVIEW_COMMUNITY_POSTS];
    posts.unshift(newPost);
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Local post save failed:', e);
  }

  return newPost;
}

export async function updateCommunityPost(postId, updates, author) {
  if (!author) throw new Error('Unauthorized');
  if (author.isAnonymous) throw new Error('Guest visitors cannot update posts.');

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .update({
          title: updates.title,
          body: updates.body,
          category: updates.category,
          tags: updates.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('author_id', author.uid)
        .select()
        .single();

      if (error) throw error;
      return mapPostRow(data);
    } catch (err) {
      console.error('Supabase update post failed:', err);
      throw err;
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    if (raw) {
      const posts = JSON.parse(raw);
      const idx = posts.findIndex(p => p.id === postId);
      if (idx !== -1 && posts[idx].authorUid === author.uid) {
        posts[idx] = { ...posts[idx], ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
        return posts[idx];
      }
    }
  } catch (e) {}
  return null;
}

export async function deleteCommunityPost(postId, author) {
  if (!author) throw new Error('Unauthorized');
  if (author.isAnonymous) throw new Error('Guest visitors cannot delete posts.');

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', author.uid);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase delete post failed:', err);
      throw err;
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    if (raw) {
      const posts = JSON.parse(raw);
      const filtered = posts.filter(p => !(p.id === postId && p.authorUid === author.uid));
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}
  return true;
}

// -----------------------------------------------------------------------------
// COMMENTS QUERIES & MUTATIONS
// -----------------------------------------------------------------------------

export async function getPostComments(postId) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapCommentRow);
    } catch (err) {
      console.error('Supabase comments query error:', err.message);
      throw err;
    }
  }

  // Local fallback ONLY when unconfigured
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    const comments = raw ? JSON.parse(raw) : [];
    return comments.filter(c => c.postId === postId);
  } catch (e) {
    return [];
  }
}

export async function addComment(postId, body, author, attachments = []) {
  if (!author) {
    throw new Error('You must be signed in to comment.');
  }

  if (author.isAnonymous) {
    throw new Error('Guest visitors cannot post public comments. Please save or connect an account first.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const row = {
        post_id: postId,
        author_id: author.uid,
        author_name: author.displayName || 'Student Maker',
        author_handle: author.handle || 'student',
        body: body.trim(),
        attachments: attachments || [],
        moderation_status: 'approved',
        likes: 0
      };

      const { data, error } = await supabase
        .from('community_comments')
        .insert(row)
        .select()
        .single();

      if (error) throw error;

      // Update post comment count
      try {
        await supabase.rpc('increment_comment_count', { target_post_id: postId });
      } catch (e) {}

      return mapCommentRow(data);
    } catch (err) {
      console.error('Supabase add comment failed:', err);
      throw err;
    }
  }

  // Local fallback
  const newComment = {
    id: 'comm-' + Date.now(),
    postId,
    authorUid: author.uid,
    authorName: author.displayName || 'Student Maker',
    authorHandle: author.handle || 'student',
    body: body.trim(),
    createdAt: new Date().toISOString(),
    likes: 0
  };

  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    const comments = raw ? JSON.parse(raw) : [];
    comments.push(newComment);
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
  } catch (e) {}

  return newComment;
}

export async function deleteComment(commentId, author) {
  if (!author) throw new Error('Unauthorized');

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', author.uid);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase delete comment failed:', err);
      throw err;
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    if (raw) {
      const comments = JSON.parse(raw);
      const filtered = comments.filter(c => !(c.id === commentId && c.authorUid === author.uid));
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}
  return true;
}

// -----------------------------------------------------------------------------
// REPORTING
// -----------------------------------------------------------------------------

export async function submitContentReport({ targetType, targetId, reason, details, reporterUid }) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('community_reports')
        .insert({
          target_type: targetType,
          target_id: targetId,
          reason,
          details: details || '',
          reporter_id: reporterUid || null,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase report submission failed:', err);
      throw err;
    }
  }

  // Local report save
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ targetType, targetId, reason, details, reporterUid, createdAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(list));
  } catch (e) {}

  return true;
}

// -----------------------------------------------------------------------------
// COMMUNITY GROUPS & PUBLISHED PROJECTS
// -----------------------------------------------------------------------------

export const PREVIEW_GROUPS = [
  {
    id: 'group-robotics',
    name: 'Arduino Robotics Lab',
    slug: 'arduino-robotics',
    description: 'Student community building obstacle avoiders, line followers, and motor control systems with Arduino Uno.',
    category: 'Robotics',
    avatarEmoji: '🤖',
    creatorName: 'Tracewise Community',
    memberCount: 42,
    postCount: 8,
    isVerified: true
  },
  {
    id: 'group-circuits',
    name: 'Circuits 101 & Hardware Safety',
    slug: 'circuits-101',
    description: 'Beginner-friendly hardware advice, Ohm’s law formulas, pull-up resistors, and breadboard layout techniques.',
    category: 'Education',
    avatarEmoji: '⚡',
    creatorName: 'Tracewise Community',
    memberCount: 89,
    postCount: 15,
    isVerified: true
  },
  {
    id: 'group-iot',
    name: 'IoT & Smart Automation',
    slug: 'iot-automation',
    description: 'Interactive electronics, sensor telemetry, automated switches, and state machines for home automation.',
    category: 'Automation',
    avatarEmoji: '🌐',
    creatorName: 'Tracewise Community',
    memberCount: 34,
    postCount: 5,
    isVerified: true
  }
];

export const PREVIEW_PROJECTS = [
  {
    id: 'proj-disco',
    title: 'Three-Color Button Disco Light',
    description: 'Interactive lighting controller with debounced button selector switching between Red, Green, and Blue LEDs.',
    authorName: 'Sudeep Reddy',
    authorHandle: 'sudeepreddy',
    tags: ['LED', 'Push Button', 'State Machine', 'Arduino Uno'],
    likes: 28,
    remixCount: 14,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'proj-traffic',
    title: 'Interactive Pedestrian Traffic Light',
    description: 'Simulated 3-state intersection light with pedestrian crossing interrupt request button.',
    authorName: 'Alex Rivera',
    authorHandle: 'alex_circuits',
    tags: ['Traffic Light', 'Safety', 'Debounce', 'Arduino Uno'],
    likes: 19,
    remixCount: 7,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'proj-dimmer',
    title: 'Rotary Dimmer & Tone Generator',
    description: 'Analog potentiometer reading on A0 driving active piezo buzzer sound frequency and LED brightness.',
    authorName: 'Maya Patel',
    authorHandle: 'maya_robotics',
    tags: ['Potentiometer', 'Buzzer', 'PWM', 'Analog Input'],
    likes: 31,
    remixCount: 11,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString()
  }
];

export async function getCommunityGroups({ category = 'All' } = {}) {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('community_groups')
        .select('*')
        .order('member_count', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase groups query warning:', error.message);
        return PREVIEW_GROUPS;
      }
      return (data || []).map(g => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        category: g.category,
        avatarEmoji: g.avatar_emoji || '⚡',
        avatarUrl: g.avatar_url || null,
        coverUrl: g.cover_url || null,
        visibility: g.visibility || 'public',
        creatorId: g.creator_id,
        creatorName: g.creator_name,
        memberCount: g.member_count || 1,
        postCount: g.post_count || 0,
        isVerified: g.is_verified || false,
        createdAt: g.created_at
      }));
    } catch (err) {
      console.warn('Supabase groups error fallback:', err.message);
      return PREVIEW_GROUPS;
    }
  }
  return PREVIEW_GROUPS;
}

export async function joinCommunityGroup(groupId, user) {
  if (!user || user.isAnonymous) {
    throw new Error('Please sign in or save an account to join community groups.');
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('community_group_members')
        .insert({
          group_id: groupId,
          user_id: user.uid,
          user_name: user.displayName || 'Maker',
          user_handle: user.handle || 'maker',
          role: 'member'
        });

      if (error && error.code !== '23505') { // Ignore unique conflict if already joined
        throw error;
      }

      // Increment member_count on group
      await supabase.rpc('increment_group_member_count', { g_id: groupId }).catch(() => {});
      return true;
    } catch (err) {
      console.error('Join group error:', err);
      throw err;
    }
  }
  return true;
}

export async function leaveCommunityGroup(groupId, user) {
  if (!user) return false;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('community_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.uid);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Leave group error:', err);
      throw err;
    }
  }
  return true;
}

export async function checkGroupMembership(groupId, userId) {
  if (!userId || !isSupabaseConfigured() || !supabase) return false;
  try {
    const { data, error } = await supabase
      .from('community_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
    if (error && error.code === 'PGRST116') return false;
    return !!data;
  } catch {
    return false;
  }
}

export async function getUserGroupMembership(groupId, userId) {
  if (!userId || !isSupabaseConfigured() || !supabase) {
    return { isMember: false, role: null, isPending: false };
  }
  try {
    // 1. Check member status
    const { data: memberData } = await supabase
      .from('community_group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (memberData) {
      return { isMember: true, role: memberData.role, isPending: false };
    }

    // 2. Check join request status if not a member
    const { data: reqData } = await supabase
      .from('community_group_join_requests')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (reqData && reqData.status === 'pending') {
      return { isMember: false, role: null, isPending: true };
    }

    return { isMember: false, role: null, isPending: false };
  } catch {
    return { isMember: false, role: null, isPending: false };
  }
}

export async function createCommunityGroup({
  name,
  description = '',
  category = 'General',
  avatarEmoji = '⚡',
  avatarUrl = null,
  coverUrl = null,
  visibility = 'public'
}, author) {
  if (!author || author.isAnonymous) {
    throw new Error('Please sign in or save an account to create a community group.');
  }

  const cleanName = (name || '').trim();
  if (!cleanName || cleanName.length < 3) {
    throw new Error('Group name must be at least 3 characters.');
  }

  // Generate unique slug
  let slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!slug) slug = 'group-' + Date.now();

  if (isSupabaseConfigured() && supabase) {
    try {
      // Check for slug collision
      const { data: existing } = await supabase
        .from('community_groups')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const { data: group, error: groupErr } = await supabase
        .from('community_groups')
        .insert({
          name: cleanName,
          slug,
          description: description.trim(),
          category,
          avatar_emoji: avatarEmoji || '⚡',
          avatar_url: avatarUrl || null,
          cover_url: coverUrl || null,
          visibility: visibility === 'private' ? 'private' : 'public',
          creator_id: author.uid,
          creator_name: author.displayName || 'Community Member',
          member_count: 1,
          post_count: 0
        })
        .select()
        .single();

      if (groupErr) throw groupErr;

      // Add creator as owner member
      await supabase
        .from('community_group_members')
        .insert({
          group_id: group.id,
          user_id: author.uid,
          user_name: author.displayName || 'Owner',
          user_handle: author.handle || 'owner',
          role: 'owner'
        });

      return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        category: group.category,
        avatarEmoji: group.avatar_emoji,
        avatarUrl: group.avatar_url,
        coverUrl: group.cover_url,
        visibility: group.visibility,
        creatorId: group.creator_id,
        creatorName: group.creator_name,
        memberCount: 1,
        postCount: 0,
        createdAt: group.created_at
      };
    } catch (err) {
      console.error('Failed to create group:', err);
      throw err;
    }
  }

  return {
    id: 'grp-' + Date.now(),
    name: cleanName,
    slug,
    description,
    category,
    avatarEmoji,
    avatarUrl,
    coverUrl,
    visibility,
    creatorId: author.uid,
    creatorName: author.displayName,
    memberCount: 1,
    postCount: 0,
    createdAt: new Date().toISOString()
  };
}

export async function requestJoinGroup(groupId, user, note = '') {
  if (!user || user.isAnonymous) {
    throw new Error('Please sign in or save an account to join or request access to groups.');
  }

  if (isSupabaseConfigured() && supabase) {
    // 1. Fetch group visibility
    const { data: group, error: gErr } = await supabase
      .from('community_groups')
      .select('id, visibility')
      .eq('id', groupId)
      .single();

    if (gErr || !group) throw new Error('Group not found');

    if (group.visibility === 'public') {
      return joinCommunityGroup(groupId, user);
    }

    // 2. Private group -> Create join request
    const { data, error } = await supabase
      .from('community_group_join_requests')
      .upsert({
        group_id: groupId,
        user_id: user.uid,
        user_name: user.displayName || 'Student Maker',
        user_handle: user.handle || 'maker',
        user_avatar: user.avatarUrl || null,
        note: (note || '').trim(),
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { status: 'pending', request: data };
  }

  return { status: 'pending' };
}

export async function getGroupJoinRequests(groupId, user) {
  if (!user || !isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('community_group_join_requests')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      groupId: r.group_id,
      userId: r.user_id,
      userName: r.user_name || 'Student Maker',
      userHandle: r.user_handle || 'maker',
      userAvatar: r.user_avatar,
      note: r.note,
      status: r.status,
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn('Get join requests error:', err.message);
    return [];
  }
}

export async function respondToJoinRequest(requestId, status, groupId, requestingUserId, reviewerUser) {
  if (!reviewerUser || !isSupabaseConfigured() || !supabase) {
    throw new Error('Unauthorized');
  }

  const validStatus = status === 'approved' ? 'approved' : 'rejected';

  // 1. Update request status
  const { data: reqRow, error: reqErr } = await supabase
    .from('community_group_join_requests')
    .update({ status: validStatus, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (reqErr) throw reqErr;

  // 2. If approved, insert into community_group_members
  if (validStatus === 'approved') {
    const targetUserId = requestingUserId || reqRow.user_id;
    await supabase
      .from('community_group_members')
      .upsert({
        group_id: groupId || reqRow.group_id,
        user_id: targetUserId,
        user_name: reqRow.user_name || 'Maker',
        user_handle: reqRow.user_handle || 'maker',
        role: 'member'
      });

    await supabase.rpc('increment_group_member_count', { g_id: groupId || reqRow.group_id }).catch(() => {});
  }

  return true;
}

export async function getGroupMembers(groupId) {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('community_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(m => ({
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      userName: m.user_name || 'Student Maker',
      userHandle: m.user_handle || 'maker',
      role: m.role || 'member',
      joinedAt: m.joined_at
    }));
  } catch (err) {
    console.warn('Get group members note:', err.message);
    return [];
  }
}

export const GROUP_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member'
};

export async function updateGroupMemberRole(groupId, targetUserId, newRole, actorUser) {
  if (!actorUser || actorUser.isAnonymous || !isSupabaseConfigured() || !supabase) {
    throw new Error('Unauthorized');
  }

  const allowedRoles = Object.values(GROUP_ROLES);
  if (!allowedRoles.includes(newRole)) {
    throw new Error('Invalid role specified.');
  }

  // Check actor role
  const { data: actorMember } = await supabase
    .from('community_group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', actorUser.uid)
    .single();

  const actorRole = actorMember?.role;
  if (!actorRole || (actorRole !== 'owner' && actorRole !== 'admin')) {
    throw new Error('Only group owners and admins can update member roles.');
  }

  // Admins cannot change owner or promote anyone to owner
  if (actorRole === 'admin' && (newRole === 'owner' || targetUserId === actorUser.uid)) {
    throw new Error('Admins cannot transfer ownership or self-promote.');
  }

  const { error } = await supabase
    .from('community_group_members')
    .update({ role: newRole })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);

  if (error) throw error;
  return true;
}

export async function removeGroupMember(groupId, targetUserId, actorUser) {
  if (!actorUser || !isSupabaseConfigured() || !supabase) {
    throw new Error('Unauthorized');
  }

  // Allow users to leave group themselves
  if (targetUserId === actorUser.uid) {
    return leaveCommunityGroup(groupId, actorUser);
  }

  // Otherwise check admin/owner permissions
  const { data: actorMember } = await supabase
    .from('community_group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', actorUser.uid)
    .single();

  const actorRole = actorMember?.role;
  if (!actorRole || (actorRole !== 'owner' && actorRole !== 'admin')) {
    throw new Error('Only owners and admins can remove members.');
  }

  // Admins cannot remove the owner
  const { data: targetMember } = await supabase
    .from('community_group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)
    .single();

  if (targetMember?.role === 'owner') {
    throw new Error('Group owner cannot be removed.');
  }

  const { error } = await supabase
    .from('community_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);

  if (error) throw error;
  return true;
}

export async function getGroupDiscussions(groupId) {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('community_group_posts')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      groupId: p.group_id,
      authorUid: p.author_id,
      authorName: p.author_name,
      authorHandle: p.author_handle,
      title: p.title,
      body: p.body,
      attachments: p.attachments || [],
      likes: p.likes || 0,
      commentCount: p.comment_count || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
  } catch (err) {
    console.warn('Group discussions error:', err.message);
    return [];
  }
}

export async function createGroupDiscussion(groupId, postData, author) {
  if (!author || author.isAnonymous) {
    throw new Error('Please sign in or save an account to start group discussions.');
  }

  if (isSupabaseConfigured() && supabase) {
    const row = {
      group_id: groupId,
      author_id: author.uid,
      author_name: author.displayName || 'Student Maker',
      author_handle: author.handle || 'maker',
      title: (postData.title || '').trim(),
      body: (postData.body || '').trim(),
      attachments: postData.attachments || [],
      project_reference: postData.projectRef || null,
      likes: 0,
      comment_count: 0
    };

    const { data, error } = await supabase
      .from('community_group_posts')
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    // Increment group post_count
    await supabase.rpc('increment_group_post_count', { g_id: groupId }).catch(() => {});

    return {
      id: data.id,
      groupId: data.group_id,
      authorUid: data.author_id,
      authorName: data.author_name,
      authorHandle: data.author_handle,
      title: data.title,
      body: data.body,
      attachments: data.attachments || [],
      likes: data.likes || 0,
      commentCount: 0,
      createdAt: data.created_at
    };
  }

  return null;
}

export async function getGroupComments(postId) {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('community_group_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(c => ({
      id: c.id,
      postId: c.post_id,
      groupId: c.group_id,
      authorUid: c.author_id,
      authorName: c.author_name,
      authorHandle: c.author_handle,
      body: c.body,
      attachments: c.attachments || [],
      likes: c.likes || 0,
      createdAt: c.created_at
    }));
  } catch (err) {
    console.warn('Group comments note:', err.message);
    return [];
  }
}

export async function addGroupComment(groupId, postId, body, attachments = [], author) {
  if (!author || author.isAnonymous) {
    throw new Error('Please sign in or save an account to reply in group discussions.');
  }

  if (isSupabaseConfigured() && supabase) {
    const row = {
      post_id: postId,
      group_id: groupId,
      author_id: author.uid,
      author_name: author.displayName || 'Student Maker',
      author_handle: author.handle || 'maker',
      body: (body || '').trim(),
      attachments: attachments || [],
      likes: 0
    };

    const { data, error } = await supabase
      .from('community_group_comments')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      postId: data.post_id,
      groupId: data.group_id,
      authorUid: data.author_id,
      authorName: data.author_name,
      authorHandle: data.author_handle,
      body: data.body,
      attachments: data.attachments || [],
      likes: 0,
      createdAt: data.created_at
    };
  }

  return null;
}

export async function getPublishedProjects({ limitCount = 30 } = {}) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('published_projects')
        .select('*')
        .order('likes', { ascending: false })
        .limit(limitCount);

      if (error) {
        console.warn('Published projects query warning:', error.message);
        return PREVIEW_PROJECTS;
      }
      return (data || []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        authorName: p.author_name,
        authorHandle: p.author_handle,
        projectData: p.project_data,
        tags: p.tags || [],
        likes: p.likes || 0,
        remixCount: p.remix_count || 0,
        createdAt: p.created_at
      }));
    } catch (err) {
      return PREVIEW_PROJECTS;
    }
  }
  return PREVIEW_PROJECTS;
}

// -----------------------------------------------------------------------------
// UNIFIED COMMUNITY SEARCH (Across Posts, People, Projects, Groups)
// Strictly privacy-preserving: NO email addresses returned
// -----------------------------------------------------------------------------

export async function searchCommunity({ query = '', type = 'all', limitCount = 20 } = {}) {
  const cleanQ = String(query || '').trim().toLowerCase();
  const results = {
    posts: [],
    people: [],
    projects: [],
    groups: []
  };

  if (!cleanQ) {
    if (type === 'all' || type === 'posts') results.posts = await getCommunityPosts({ limitCount: 10 });
    if (type === 'all' || type === 'groups') results.groups = await getCommunityGroups();
    if (type === 'all' || type === 'projects') results.projects = await getPublishedProjects({ limitCount: 10 });
    return results;
  }

  // 1. Search Posts
  if (type === 'all' || type === 'posts') {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('community_posts')
          .select('*')
          .or(`title.ilike.%${cleanQ}%,body.ilike.%${cleanQ}%`)
          .eq('moderation_status', 'approved')
          .limit(limitCount);

        if (!error && data) {
          results.posts = data.map(mapPostRow);
        } else {
          results.posts = PREVIEW_COMMUNITY_POSTS.filter(p =>
            p.title.toLowerCase().includes(cleanQ) || p.body.toLowerCase().includes(cleanQ)
          );
        }
      } catch {
        results.posts = PREVIEW_COMMUNITY_POSTS.filter(p =>
          p.title.toLowerCase().includes(cleanQ) || p.body.toLowerCase().includes(cleanQ)
        );
      }
    } else {
      results.posts = PREVIEW_COMMUNITY_POSTS.filter(p =>
        p.title.toLowerCase().includes(cleanQ) || p.body.toLowerCase().includes(cleanQ)
      );
    }
  }

  // 2. Search People (Strict privacy: id, display_name, handle, avatar_url, bio, role, linkedin_url - NEVER email!)
  if (type === 'all' || type === 'people') {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, handle, avatar_url, bio, role, linkedin_url, created_at')
          .or(`display_name.ilike.%${cleanQ}%,handle.ilike.%${cleanQ}%,bio.ilike.%${cleanQ}%`)
          .limit(limitCount);

        if (!error && data) {
          results.people = data.map(p => ({
            id: p.id,
            displayName: p.display_name || 'Student Maker',
            handle: p.handle || 'student',
            avatarUrl: p.avatar_url,
            bio: p.bio,
            role: p.role || 'student',
            linkedinUrl: p.linkedin_url
          }));
        }
      } catch (err) {
        console.warn('People search note:', err.message);
      }
    }
    // Add sample public contributors if empty
    if (results.people.length === 0) {
      const publicContributors = [
        { id: 'usr-sudeep', displayName: 'Sudeep Reddy', handle: 'sudeepreddy', role: 'creator', bio: 'Founder & Lead Architect at TraceWise.', linkedinUrl: 'https://linkedin.com/in/sudeepreddy' },
        { id: 'usr-alex', displayName: 'Alex Rivera', handle: 'alex_circuits', role: 'student', bio: 'High-school robotics lead and Arduino tinkerer.', linkedinUrl: null },
        { id: 'usr-maya', displayName: 'Maya Patel', handle: 'maya_robotics', role: 'student', bio: 'Electronics enthusiast focused on autonomous rovers.', linkedinUrl: null }
      ];
      results.people = publicContributors.filter(p =>
        p.displayName.toLowerCase().includes(cleanQ) || p.handle.toLowerCase().includes(cleanQ) || (p.bio && p.bio.toLowerCase().includes(cleanQ))
      );
    }
  }

  // 3. Search Projects
  if (type === 'all' || type === 'projects') {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('published_projects')
          .select('*')
          .or(`title.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
          .limit(limitCount);

        if (!error && data) {
          results.projects = data.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            authorName: p.author_name,
            authorHandle: p.author_handle,
            projectData: p.project_data,
            tags: p.tags || [],
            likes: p.likes || 0,
            remixCount: p.remix_count || 0
          }));
        } else {
          results.projects = PREVIEW_PROJECTS.filter(p =>
            p.title.toLowerCase().includes(cleanQ) || p.description.toLowerCase().includes(cleanQ)
          );
        }
      } catch {
        results.projects = PREVIEW_PROJECTS.filter(p =>
          p.title.toLowerCase().includes(cleanQ) || p.description.toLowerCase().includes(cleanQ)
        );
      }
    } else {
      results.projects = PREVIEW_PROJECTS.filter(p =>
        p.title.toLowerCase().includes(cleanQ) || p.description.toLowerCase().includes(cleanQ)
      );
    }
  }

  // 4. Search Groups
  if (type === 'all' || type === 'groups') {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('community_groups')
          .select('*')
          .or(`name.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%,category.ilike.%${cleanQ}%`)
          .limit(limitCount);

        if (!error && data) {
          results.groups = data.map(g => ({
            id: g.id,
            name: g.name,
            slug: g.slug,
            description: g.description,
            category: g.category,
            avatarEmoji: g.avatar_emoji || '⚡',
            memberCount: g.member_count || 1,
            postCount: g.post_count || 0,
            isVerified: g.is_verified || false
          }));
        } else {
          results.groups = PREVIEW_GROUPS.filter(g =>
            g.name.toLowerCase().includes(cleanQ) || g.description.toLowerCase().includes(cleanQ) || g.category.toLowerCase().includes(cleanQ)
          );
        }
      } catch {
        results.groups = PREVIEW_GROUPS.filter(g =>
          g.name.toLowerCase().includes(cleanQ) || g.description.toLowerCase().includes(cleanQ) || g.category.toLowerCase().includes(cleanQ)
        );
      }
    } else {
      results.groups = PREVIEW_GROUPS.filter(g =>
        g.name.toLowerCase().includes(cleanQ) || g.description.toLowerCase().includes(cleanQ) || g.category.toLowerCase().includes(cleanQ)
      );
    }
  }

  return results;
}

// Backwards-compatible aliases
export const addPostComment = (postId, data, author) => {
  const body = typeof data === 'string' ? data : (data?.text || data?.body || '');
  const authUser = author || (typeof data === 'object' ? data?.author : null);
  return addComment(postId, body, authUser);
};

export const deletePostComment = (postId, commentId, author) => {
  const authUser = typeof author === 'object' ? author : { uid: author };
  return deleteComment(commentId, authUser);
};

export const submitReport = submitContentReport;

