import {
  db,
  isFirebaseConfigured,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from './firebase';

const LOCAL_POSTS_KEY = 'tracewise_community_posts_v2';
const LOCAL_COMMENTS_KEY = 'tracewise_community_comments_v2';
const LOCAL_REPORTS_KEY = 'tracewise_community_reports_v2';

// Realistic Student Engineering Initial Posts
const INITIAL_COMMUNITY_POSTS = [
  {
    id: 'post-traffic-pedestrian',
    title: 'Why did adding a pedestrian button trigger a pin conflict on Pin 2?',
    category: 'Debugging Help',
    body: 'I was remixing the Starter Traffic Light project to add a crosswalk push button. When I hooked up the button to digital pin 7 on the canvas but defined BUTTON_PIN as 2 in my Arduino sketch, Tracewise immediately warned me that Pin 2 was already driving the Red LED anode! After changing `BUTTON_PIN = 7`, everything worked perfectly. Always double-check your code against your breadboard wiring.',
    tags: ['Arduino Uno', 'Pin Collision', 'Traffic Light', 'Debugging'],
    authorUid: 'student-demo-101',
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
    authorUid: 'student-maya-202',
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
    body: 'Working on an obstacle-avoiding rover on a breadboard. `pulseIn(echoPin, HIGH)` blocks the main loop while waiting for sound waves to bounce back. Has anyone implemented timer interrupts on Uno pin D2 or D3 for sensor reads without stuttering motor PWM?',
    tags: ['Ultrasonic', 'Sensors', 'Arduino Uno', 'Robotics'],
    authorUid: 'student-devon-303',
    authorName: 'Devon Lee',
    authorHandle: 'devon_maker',
    authorAvatar: null,
    projectRef: null,
    createdAt: new Date(Date.now() - 3600000 * 75).toISOString(),
    moderationStatus: 'approved',
    commentCount: 3
  }
];

const INITIAL_COMMENTS = {
  'post-traffic-pedestrian': [
    {
      id: 'cm-1',
      postId: 'post-traffic-pedestrian',
      authorUid: 'student-maya-202',
      authorName: 'Maya Patel',
      authorHandle: 'maya_robotics',
      text: 'Great catch! The diff viewer makes it so clear because it highlights the exact wire on D7 next to the code line on D2.',
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      id: 'cm-2',
      postId: 'post-traffic-pedestrian',
      authorUid: 'student-demo-101',
      authorName: 'Alex Rivera',
      authorHandle: 'alex_circuits',
      text: 'Exactly! Before Tracewise I would spend hours looking for loose breadboard jumpers when it was just an inverted pin number in setup().',
      createdAt: new Date(Date.now() - 3600000 * 16).toISOString()
    }
  ],
  'post-led-resistor-current': [
    {
      id: 'cm-3',
      postId: 'post-led-resistor-current',
      authorUid: 'student-devon-303',
      authorName: 'Devon Lee',
      authorHandle: 'devon_maker',
      text: 'Thanks for writing out the formula step-by-step. Very helpful reference for our robotics club!',
      createdAt: new Date(Date.now() - 3600000 * 30).toISOString()
    }
  ],
  'post-analog-ultrasonic-question': [
    {
      id: 'cm-4',
      postId: 'post-analog-ultrasonic-question',
      authorUid: 'student-demo-101',
      authorName: 'Alex Rivera',
      authorHandle: 'alex_circuits',
      text: 'Check out PinChangeInt or use the NewPing library! It uses hardware timer 2 to trigger non-blocking pings.',
      createdAt: new Date(Date.now() - 3600000 * 60).toISOString()
    }
  ]
};

// Helper: load local posts
function loadLocalPosts() {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(INITIAL_COMMUNITY_POSTS));
      return INITIAL_COMMUNITY_POSTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_COMMUNITY_POSTS;
  }
}

function saveLocalPosts(posts) {
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Failed to save local community posts:', e);
  }
}

function loadLocalComments() {
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(INITIAL_COMMENTS));
      return INITIAL_COMMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_COMMENTS;
  }
}

function saveLocalComments(comments) {
  try {
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
  } catch (e) {
    console.warn('Failed to save local comments:', e);
  }
}

/**
 * Get Community Posts with filtering
 */
export async function getCommunityPosts({ category = 'All', authorUid = null, filter = 'Latest' } = {}) {
  if (isFirebaseConfigured() && db) {
    try {
      const postsRef = collection(db, 'communityPosts');
      let q = query(postsRef, where('moderationStatus', '==', 'approved'), orderBy('createdAt', 'desc'));

      if (authorUid) {
        q = query(postsRef, where('authorUid', '==', authorUid), orderBy('createdAt', 'desc'));
      } else if (category && category !== 'All') {
        q = query(postsRef, where('category', '==', category), where('moderationStatus', '==', 'approved'), orderBy('createdAt', 'desc'));
      }

      const snap = await getDocs(q);
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (e) {
      console.warn('Firestore getCommunityPosts failed, using local store fallback:', e);
    }
  }

  // Local fallback
  let posts = loadLocalPosts();
  if (authorUid) {
    posts = posts.filter(p => p.authorUid === authorUid);
  }
  if (category && category !== 'All') {
    posts = posts.filter(p => p.category === category);
  }
  if (filter === 'Questions') {
    posts = posts.filter(p => p.category === 'Question' || p.category === 'Debugging Help');
  } else if (filter === 'Project Updates') {
    posts = posts.filter(p => p.category === 'Project Update');
  } else if (filter === 'Showcases') {
    posts = posts.filter(p => p.category === 'Showcase');
  }

  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a single post by ID
 */
export async function getCommunityPostById(postId) {
  if (isFirebaseConfigured() && db) {
    try {
      const postRef = doc(db, 'communityPosts', postId);
      const snap = await getDoc(postRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (e) {
      console.warn('Firestore getDoc failed:', e);
    }
  }

  const posts = loadLocalPosts();
  return posts.find(p => p.id === postId) || null;
}

/**
 * Create a new community post
 */
export async function createCommunityPost({ title, category, body, tags = [], projectRef = null, author }) {
  if (!author || !author.uid) {
    throw new Error('You must be signed in to create a post.');
  }

  const newPost = {
    id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: title.trim(),
    category: category || 'General Discussion',
    body: body.trim(),
    tags: tags.map(t => t.trim()).filter(Boolean),
    authorUid: author.uid,
    authorName: author.displayName || 'Student Maker',
    authorHandle: author.handle || 'student',
    authorAvatar: author.avatarUrl || null,
    projectRef: projectRef ? {
      projectId: projectRef.id || projectRef.projectId,
      title: projectRef.title || 'Untitled Circuit',
      version: projectRef.version?.label || projectRef.version || 'v1.0',
      componentsCount: projectRef.components?.length || projectRef.componentsCount || 0
    } : null,
    createdAt: new Date().toISOString(),
    moderationStatus: 'approved',
    commentCount: 0
  };

  if (isFirebaseConfigured() && db) {
    try {
      const postRef = doc(db, 'communityPosts', newPost.id);
      await setDoc(postRef, {
        ...newPost,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Firestore createCommunityPost failed:', e);
    }
  }

  // Always update local storage
  const posts = loadLocalPosts();
  const updated = [newPost, ...posts];
  saveLocalPosts(updated);
  return newPost;
}

/**
 * Update an existing post
 */
export async function updateCommunityPost(postId, updates, currentUserUid) {
  const posts = loadLocalPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) throw new Error('Post not found');
  if (post.authorUid !== currentUserUid) throw new Error('Permission denied: You can only edit your own posts.');

  const updatedPost = {
    ...post,
    title: updates.title !== undefined ? updates.title.trim() : post.title,
    category: updates.category || post.category,
    body: updates.body !== undefined ? updates.body.trim() : post.body,
    tags: updates.tags || post.tags,
    projectRef: updates.projectRef !== undefined ? updates.projectRef : post.projectRef,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, {
        title: updatedPost.title,
        category: updatedPost.category,
        body: updatedPost.body,
        tags: updatedPost.tags,
        projectRef: updatedPost.projectRef,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Firestore updateDoc failed:', e);
    }
  }

  const updatedList = posts.map(p => p.id === postId ? updatedPost : p);
  saveLocalPosts(updatedList);
  return updatedPost;
}

/**
 * Delete a post
 */
export async function deleteCommunityPost(postId, currentUserUid) {
  const posts = loadLocalPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) throw new Error('Post not found');
  if (post.authorUid !== currentUserUid) throw new Error('Permission denied: You can only delete your own posts.');

  if (isFirebaseConfigured() && db) {
    try {
      const postRef = doc(db, 'communityPosts', postId);
      await deleteDoc(postRef);
    } catch (e) {
      console.error('Firestore deleteDoc failed:', e);
    }
  }

  const updatedList = posts.filter(p => p.id !== postId);
  saveLocalPosts(updatedList);
  return true;
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId) {
  if (isFirebaseConfigured() && db) {
    try {
      const commentsRef = collection(db, 'communityPosts', postId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (e) {
      console.warn('Firestore getPostComments failed, using local store:', e);
    }
  }

  const allComments = loadLocalComments();
  return allComments[postId] || [];
}

/**
 * Add a comment to a post
 */
export async function addPostComment(postId, { text, author }) {
  if (!author || !author.uid) throw new Error('You must be signed in to comment.');
  if (!text || !text.trim()) throw new Error('Comment cannot be empty.');

  const newComment = {
    id: `cm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    postId,
    authorUid: author.uid,
    authorName: author.displayName || 'Student Maker',
    authorHandle: author.handle || 'student',
    authorAvatar: author.avatarUrl || null,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const commentRef = doc(db, 'communityPosts', postId, 'comments', newComment.id);
      await setDoc(commentRef, {
        ...newComment,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Firestore addComment failed:', e);
    }
  }

  // Update local storage comments
  const allComments = loadLocalComments();
  const postComments = allComments[postId] || [];
  allComments[postId] = [...postComments, newComment];
  saveLocalComments(allComments);

  // Increment post comment count
  const posts = loadLocalPosts();
  const updatedPosts = posts.map(p => {
    if (p.id === postId) {
      return { ...p, commentCount: (p.commentCount || 0) + 1 };
    }
    return p;
  });
  saveLocalPosts(updatedPosts);

  return newComment;
}

/**
 * Delete a comment
 */
export async function deletePostComment(postId, commentId, currentUserUid) {
  const allComments = loadLocalComments();
  const postComments = allComments[postId] || [];
  const target = postComments.find(c => c.id === commentId);
  if (!target) throw new Error('Comment not found');
  if (target.authorUid !== currentUserUid) throw new Error('Permission denied.');

  if (isFirebaseConfigured() && db) {
    try {
      const commentRef = doc(db, 'communityPosts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (e) {
      console.error('Firestore deleteComment failed:', e);
    }
  }

  allComments[postId] = postComments.filter(c => c.id !== commentId);
  saveLocalComments(allComments);

  // Decrement comment count
  const posts = loadLocalPosts();
  const updatedPosts = posts.map(p => {
    if (p.id === postId) {
      return { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) };
    }
    return p;
  });
  saveLocalPosts(updatedPosts);

  return true;
}

/**
 * Report a post or comment
 */
export async function submitReport({ targetType, targetId, reason, reporterUid }) {
  if (!reporterUid) throw new Error('Must be signed in to report content.');

  const reportDoc = {
    id: `rep-${Date.now()}`,
    targetType,
    targetId,
    reason: reason || 'Inappropriate content',
    reporterUid,
    status: 'pending_review',
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const repRef = doc(db, 'reports', reportDoc.id);
      await setDoc(repRef, {
        ...reportDoc,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Firestore submitReport failed:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(reportDoc);
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Local report save failed:', e);
  }

  return true;
}
