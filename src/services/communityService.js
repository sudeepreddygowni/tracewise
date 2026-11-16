import { supabase, isSupabaseConfigured } from './supabase';

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

      if (authorUid) {
        query = query.eq('author_id', authorUid);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        return data.map(mapPostRow);
      }
    } catch (err) {
      console.warn('Supabase community posts query error:', err.message);
    }
  }

  // Fallback to local storage
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

      if (error) throw error;
      if (data) return mapPostRow(data);
    } catch (err) {
      console.warn('Supabase post detail query note:', err.message);
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
      if (data) return data.map(mapCommentRow);
    } catch (err) {
      console.warn('Supabase comments query note:', err.message);
    }
  }

  // Local fallback
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    const comments = raw ? JSON.parse(raw) : [];
    return comments.filter(c => c.postId === postId);
  } catch (e) {
    return [];
  }
}

export async function addComment(postId, body, author) {
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

