import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Trash2,
  Edit3,
  Flag,
  Cpu,
  ArrowRight,
  GitCompare,
  Calendar,
  Shield,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import {
  getCommunityPostById,
  updateCommunityPost,
  deleteCommunityPost,
  getPostComments,
  addPostComment,
  deletePostComment,
  submitReport
} from '../services/communityService';
import { AuthModal } from '../components/auth/AuthModal';
import { MediaAttachmentPicker } from '../components/ui/MediaAttachmentPicker';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { type: 'post' | 'comment', id }
  const [reportReason, setReportReason] = useState('Inappropriate or Off-Topic Content');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isAuthor = user && post && user.uid === post.authorUid;

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getCommunityPostById(postId);
      if (p) {
        setPost(p);
        setEditTitle(p.title);
        setEditBody(p.body);
        setEditCategory(p.category);
        const c = await getPostComments(postId);
        setComments(c);
      }
    } catch (err) {
      console.error('Error loading post:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [postId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!commentText.trim() && commentAttachments.length === 0) return;

    try {
      setSubmittingComment(true);
      const newCm = await addPostComment(
        postId,
        { text: commentText, author: user },
        commentAttachments
      );
      setComments([...comments, newCm]);
      setCommentText('');
      setCommentAttachments([]);
    } catch (err) {
      alert(err.message || 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete your comment?')) return;
    try {
      await deletePostComment(postId, commentId, user.uid);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const updated = await updateCommunityPost(postId, {
        title: editTitle,
        category: editCategory,
        body: editBody
      }, user.uid);
      setPost(updated);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to update post');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    try {
      await deleteCommunityPost(postId, user.uid);
      navigate('/community');
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleOpenReport = (targetType, targetId) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setReportTarget({ type: targetType, id: targetId });
    setReportReason('Inappropriate or Off-Topic Content');
    setReportSubmitted(false);
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      await submitReport({
        targetType: reportTarget?.type || 'post',
        targetId: reportTarget?.id || postId,
        reason: reportReason,
        reporterUid: user.uid
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setReportModalOpen(false);
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--tw-text-muted)', fontSize: '0.94rem' }}>Loading discussion...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tw-bg)', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
            Discussion Not Found
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', marginBottom: '24px' }}>
            This post may have been removed or the URL is incorrect.
          </p>
          <TracewiseBubbleButton to="/community" variant="primary">
            <span>Back to Community</span>
          </TracewiseBubbleButton>
        </div>
      </div>
    );
  }

  const authorInitial = post.authorName ? post.authorName[0].toUpperCase() : 'S';

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Back link */}
          <Link
            to="/community"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--tw-text-muted)', textDecoration: 'none', fontWeight: 600 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Community</span>
          </Link>

          {/* Main Post Card */}
          <div
            className="glass-card"
            style={{
              padding: '36px 32px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 12px 36px rgba(7, 24, 49, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Header / Author row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--tw-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    backgroundColor: 'var(--tw-brand)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 700,
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {post.authorAvatar ? (
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName || 'User'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    authorInitial
                  )}
                </div>
                <div>
                  <Link
                    to={`/profile/${post.authorHandle}`}
                    style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tw-text)', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tw-text)')}
                  >
                    {post.authorName}
                  </Link>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)' }}>
                    @{post.authorHandle} • {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Badges and Post Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--tw-brand-soft)',
                    color: 'var(--tw-brand)'
                  }}
                >
                  {post.category}
                </span>

                {isAuthor ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <TracewiseBubbleIconButton
                      onClick={() => setIsEditing(!isEditing)}
                      size="sm"
                      variant="ghost"
                      aria-label="Edit post"
                    >
                      <Edit3 size={15} />
                    </TracewiseBubbleIconButton>
                    <TracewiseBubbleIconButton
                      onClick={handleDeletePost}
                      size="sm"
                      variant="ghost"
                      aria-label="Delete post"
                      style={{ color: 'var(--tw-error)' }}
                    >
                      <Trash2 size={15} />
                    </TracewiseBubbleIconButton>
                  </div>
                ) : (
                  <TracewiseBubbleIconButton
                    onClick={() => handleOpenReport('post', post.id)}
                    size="sm"
                    variant="ghost"
                    aria-label="Report post"
                    style={{ color: 'var(--tw-text-muted)' }}
                  >
                    <Flag size={15} />
                  </TracewiseBubbleIconButton>
                )}
              </div>
            </div>

            {/* Editing Form OR Post Content */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--tw-border)', fontSize: '0.94rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--tw-border)', fontSize: '0.9rem' }}
                  >
                    <option value="Question">Question</option>
                    <option value="Debugging Help">Debugging Help</option>
                    <option value="Project Update">Project Update</option>
                    <option value="Showcase">Showcase</option>
                    <option value="General Discussion">General Discussion</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Body</label>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={6}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--tw-border)', fontSize: '0.92rem' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <TracewiseBubbleButton type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                    <span>Cancel</span>
                  </TracewiseBubbleButton>
                  <TracewiseBubbleButton type="submit" variant="primary" disabled={savingEdit}>
                    <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </TracewiseBubbleButton>
                </div>
              </form>
            ) : (
              <>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>
                  {post.title}
                </h1>

                <p style={{ fontSize: '1rem', color: 'var(--tw-text-secondary)', lineHeight: 1.68, margin: 0, whiteSpace: 'pre-line' }}>
                  {post.body}
                </p>

                {/* Render Post Media Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                    {post.attachments.map((att, idx) => (
                      <div key={att.id || idx} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--tw-border)', backgroundColor: 'var(--tw-bg)' }}>
                        {att.type === 'image' && att.url ? (
                          <a href={att.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={att.url}
                              alt={att.name}
                              style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                            />
                          </a>
                        ) : (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', color: 'var(--tw-brand)', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}
                          >
                            <span>📄</span>
                            <span>{att.name}</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>({(att.size / 1024).toFixed(0)} KB)</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Attached Project Card */}
                {post.projectRef && (
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--tw-brand-soft)',
                      border: '1px solid rgba(30, 63, 216, 0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      marginTop: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-brand)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                        <Cpu size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--tw-brand)', fontWeight: 700, textTransform: 'uppercase' }}>
                          Attached Circuit Project
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                          {post.projectRef.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                          Version {post.projectRef.version || 'v1.0'} • {post.projectRef.componentsCount || 0} active components
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <TracewiseBubbleButton
                        to={`/app/studio/${post.projectRef.projectId}`}
                        variant="primary"
                        size="sm"
                        style={{ gap: '6px' }}
                      >
                        <span>Open in Studio</span>
                        <ArrowRight size={14} />
                      </TracewiseBubbleButton>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--tw-border)' }}>
                    {post.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: 'var(--tw-text-muted)',
                          backgroundColor: 'var(--tw-bg)',
                          padding: '3px 10px',
                          borderRadius: '8px'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Comments Section */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 8px 30px rgba(7, 24, 49, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--tw-border)', paddingBottom: '14px' }}>
              <MessageSquare size={18} color="var(--tw-brand)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                Discussion ({comments.length})
              </h3>
            </div>

            {/* Add Comment Input */}
            {isAuthenticated ? (
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Contribute to this discussion or share your circuit observations..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                />

                <MediaAttachmentPicker
                  attachments={commentAttachments}
                  onChange={setCommentAttachments}
                  userId={user?.uid}
                  disabled={submittingComment}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                    Be respectful and constructive. Safe student learning environment.
                  </span>
                  <TracewiseBubbleButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submittingComment || (!commentText.trim() && commentAttachments.length === 0)}
                    style={{ gap: '6px' }}
                  >
                    <Send size={13} />
                    <span>{submittingComment ? 'Posting...' : 'Post Reply'}</span>
                  </TracewiseBubbleButton>
                </div>
              </form>
            ) : (
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--tw-bg)', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)' }}>
                  Sign in to participate in this engineering discussion.
                </span>
                <TracewiseBubbleButton onClick={() => setAuthModalOpen(true)} variant="primary" size="sm">
                  <span>Sign In</span>
                </TracewiseBubbleButton>
              </div>
            )}

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.length > 0 ? (
                comments.map((cm) => {
                  const cmInitial = cm.authorName ? cm.authorName[0].toUpperCase() : 'S';
                  const isCommentAuthor = user && user.uid === cm.authorUid;

                  return (
                    <div
                      key={cm.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--tw-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              backgroundColor: 'var(--tw-brand)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}
                          >
                            {cmInitial}
                          </div>
                          <Link
                            to={`/profile/${cm.authorHandle}`}
                            style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--tw-text)', textDecoration: 'none' }}
                          >
                            {cm.authorName}
                          </Link>
                          <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                            @{cm.authorHandle} • {new Date(cm.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Comment actions */}
                        <div>
                          {isCommentAuthor ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(cm.id)}
                              style={{ border: 'none', background: 'none', color: 'var(--tw-text-muted)', cursor: 'pointer', padding: '4px' }}
                              title="Delete comment"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReport('comment', cm.id)}
                              style={{ border: 'none', background: 'none', color: 'var(--tw-text-muted)', cursor: 'pointer', padding: '4px' }}
                              title="Report comment"
                            >
                              <Flag size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {cm.body || cm.text}
                      </p>

                      {/* Comment Attachments */}
                      {cm.attachments && cm.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                          {cm.attachments.map((att, aIdx) => (
                            <div key={att.id || aIdx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--tw-border)' }}>
                              {att.type === 'image' && att.url ? (
                                <a href={att.url} target="_blank" rel="noopener noreferrer">
                                  <img src={att.url} alt={att.name} style={{ maxHeight: '140px', maxWidth: '200px', objectFit: 'contain', display: 'block' }} />
                                </a>
                              ) : (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', fontSize: '0.78rem', color: 'var(--tw-brand)', textDecoration: 'none' }}>
                                  📄 {att.name}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--tw-text-muted)', fontSize: '0.88rem', margin: 0, textAlign: 'center', padding: '20px' }}>
                  No replies yet. Be the first to add your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(7, 24, 49, 0.72)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 24px 60px rgba(7, 24, 49, 0.45)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tw-error)' }}>
                <Flag size={18} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Report Content</h3>
              </div>
              <TracewiseBubbleIconButton size="sm" variant="ghost" onClick={() => setReportModalOpen(false)}>
                <X size={16} />
              </TracewiseBubbleIconButton>
            </div>

            {reportSubmitted ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--tw-success)' }}>
                <Check size={28} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 600, margin: 0 }}>Report submitted. Thank you for keeping Tracewise safe for students.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                  Please tell our student moderation system why this content violates community guidelines.
                </p>

                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--tw-border)', fontSize: '0.88rem' }}
                >
                  <option value="Inappropriate or Off-Topic Content">Inappropriate or Off-Topic Content</option>
                  <option value="Spam or Promotion">Spam or Promotion</option>
                  <option value="Personal Information or Privacy Breach">Personal Information or Privacy Breach</option>
                  <option value="Harassment or Disrespect">Harassment or Disrespect</option>
                </select>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <TracewiseBubbleButton type="button" variant="ghost" size="sm" onClick={() => setReportModalOpen(false)}>
                    <span>Cancel</span>
                  </TracewiseBubbleButton>
                  <TracewiseBubbleButton type="submit" variant="primary" size="sm" style={{ backgroundColor: 'var(--tw-error)' }}>
                    <span>Submit Report</span>
                  </TracewiseBubbleButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </TracewiseBubbleArea>
  );
}
