import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Cpu,
  ArrowRight,
  Shield,
  HelpCircle,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  Calendar,
  Tag
} from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import { useProject } from '../store/useProjectStore';
import { getCommunityPosts, createCommunityPost } from '../services/communityService';
import { AuthModal } from '../components/auth/AuthModal';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialFilter = searchParams.get('filter') || 'Latest';

  const { user, isAuthenticated } = useAuth();
  const { projects } = useProject();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Create post modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('Question');
  const [postBody, setPostBody] = useState('');
  const [postTags, setPostTags] = useState('');
  const [attachedProjectId, setAttachedProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const categories = [
    'All',
    'Question',
    'Debugging Help',
    'Project Update',
    'Showcase',
    'General Discussion'
  ];

  const filterTabs = [
    'Latest',
    'Questions',
    'Project Updates',
    'Showcases',
    'My Posts'
  ];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const authorUid = selectedFilter === 'My Posts' && user ? user.uid : null;
      const data = await getCommunityPosts({
        category: selectedCategory,
        authorUid,
        filter: selectedFilter
      });
      setPosts(data);
    } catch (err) {
      console.error('Error fetching community posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedFilter, user]);

  const handleCreatePostClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      setCreateModalOpen(true);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!postTitle.trim() || postTitle.length < 5) {
      setModalError('Title must be at least 5 characters long.');
      return;
    }
    if (!postBody.trim() || postBody.length < 15) {
      setModalError('Post body must be at least 15 characters to explain your project context.');
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenProject = attachedProjectId
        ? projects.find(p => p.id === attachedProjectId)
        : null;

      const tagsArray = postTags
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      await createCommunityPost({
        title: postTitle,
        category: postCategory,
        body: postBody,
        tags: tagsArray.length > 0 ? tagsArray : ['Arduino Uno'],
        projectRef: chosenProject,
        author: user
      });

      setPostTitle('');
      setPostBody('');
      setPostTags('');
      setAttachedProjectId('');
      setCreateModalOpen(false);
      await fetchPosts();
    } catch (err) {
      setModalError(err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter by search query
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.title?.toLowerCase().includes(q) ||
      post.body?.toLowerCase().includes(q) ||
      post.authorName?.toLowerCase().includes(q) ||
      post.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Question': return { bg: '#eff6ff', color: 'var(--tw-brand)' };
      case 'Debugging Help': return { bg: '#fef3c7', color: '#b45309' };
      case 'Showcase': return { bg: '#f0fdf4', color: 'var(--tw-success)' };
      case 'Project Update': return { bg: '#f5f3ff', color: '#7c3aed' };
      default: return { bg: 'var(--tw-bg)', color: 'var(--tw-text-secondary)' };
    }
  };

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '120px 24px 80px' }}>
        <div className="container-tw" style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '20px',
              borderBottom: '1px solid var(--tw-border)',
              paddingBottom: '28px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Engineering Community
              </span>
              <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
                Build together. Learn from every change.
              </h1>
              <p style={{ fontSize: '1.02rem', color: 'var(--tw-text-secondary)', marginTop: '8px', maxWidth: '640px', lineHeight: 1.55 }}>
                Share circuit experiments, ask debugging questions, and discover how other students solve wiring conflicts and Arduino C++ logic.
              </p>
            </div>

            <TracewiseBubbleButton
              onClick={handleCreatePostClick}
              variant="primary"
              size="md"
              style={{ gap: '8px', padding: '10px 22px' }}
            >
              <Plus size={18} />
              <span>Create Post</span>
            </TracewiseBubbleButton>
          </div>

          {/* Search & Navigation Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {filterTabs.map((tab) => {
                  const isSelected = selectedFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedFilter(tab)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--tw-radius-pill)',
                        border: 'none',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--tw-brand)' : '#ffffff',
                        color: isSelected ? '#ffffff' : 'var(--tw-text-secondary)',
                        boxShadow: isSelected ? '0 4px 14px rgba(30, 63, 216, 0.25)' : '0 1px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={16} color="var(--tw-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions or tags..."
                  style={{
                    width: '100%',
                    padding: '8px 14px 8px 36px',
                    borderRadius: 'var(--tw-radius-pill)',
                    border: '1px solid var(--tw-border)',
                    backgroundColor: '#ffffff',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Category Pills Filter */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-muted)' }}>Category:</span>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--tw-brand)' : 'var(--tw-border)',
                      backgroundColor: isSelected ? 'var(--tw-brand-soft)' : '#ffffff',
                      color: isSelected ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--tw-text-muted)' }}>
              Loading discussions...
            </div>
          ) : filteredPosts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {filteredPosts.map((post) => {
                const catColor = getCategoryColor(post.category);
                const authorInitial = post.authorName ? post.authorName[0].toUpperCase() : 'S';

                return (
                  <div
                    key={post.id}
                    className="glass-card"
                    style={{
                      padding: '24px 28px',
                      backgroundColor: '#ffffff',
                      borderRadius: '20px',
                      boxShadow: '0 8px 24px rgba(7, 24, 49, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    {/* Header info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'var(--tw-brand)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                        >
                          {authorInitial}
                        </div>
                        <div>
                          <Link
                            to={`/profile/${post.authorHandle}`}
                            style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--tw-text)', textDecoration: 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tw-text)')}
                          >
                            {post.authorName}
                          </Link>
                          <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)', marginLeft: '6px' }}>
                            @{post.authorHandle}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '10px',
                            backgroundColor: catColor.bg,
                            color: catColor.color
                          }}
                        >
                          {post.category}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Post Title */}
                    <Link
                      to={`/community/post/${post.id}`}
                      style={{
                        fontSize: '1.24rem',
                        fontWeight: 700,
                        color: 'var(--tw-text)',
                        textDecoration: 'none',
                        lineHeight: 1.35,
                        fontFamily: 'var(--font-heading)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tw-text)')}
                    >
                      {post.title}
                    </Link>

                    {/* Preview Body */}
                    <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {post.body.length > 220 ? `${post.body.slice(0, 220)}...` : post.body}
                    </p>

                    {/* Attached Project Badge (if any) */}
                    {post.projectRef && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--tw-brand-soft)',
                          border: '1px solid rgba(30, 63, 216, 0.18)',
                          fontSize: '0.84rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tw-brand)', fontWeight: 600 }}>
                          <Cpu size={16} />
                          <span>Attached Project: <b>{post.projectRef.title}</b> ({post.projectRef.componentsCount || 0} components)</span>
                        </div>
                        <Link
                          to={`/app/studio/${post.projectRef.projectId}`}
                          style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>Open in Studio</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}

                    {/* Footer: Tags and Discussion Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {post.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.74rem',
                              color: 'var(--tw-text-muted)',
                              backgroundColor: 'var(--tw-bg)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <Link
                        to={`/community/post/${post.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: 'var(--tw-brand)',
                          textDecoration: 'none'
                        }}
                      >
                        <MessageSquare size={15} />
                        <span>{post.commentCount || 0} {post.commentCount === 1 ? 'Comment' : 'Comments'}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--tw-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--tw-brand)' }}>
                <MessageSquare size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', margin: '0 0 6px 0' }}>
                No discussions found in this view
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {searchQuery
                  ? `No posts matched "${searchQuery}". Try a different keyword or reset filters.`
                  : 'Be the first to ask a technical question or share a project update with the community.'}
              </p>
              <TracewiseBubbleButton onClick={handleCreatePostClick} variant="primary" size="sm">
                <span>Start the First Discussion</span>
              </TracewiseBubbleButton>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {createModalOpen && (
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
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(7, 24, 49, 0.45)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--tw-border)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                  Share with Tracewise Community
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', margin: '2px 0 0' }}>
                  Ask a question, share progress, or explain an electronics change.
                </p>
              </div>
              <TracewiseBubbleIconButton
                size="sm"
                variant="ghost"
                onClick={() => setCreateModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </TracewiseBubbleIconButton>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {modalError && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Post Title
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. How does forward voltage affect 5V Arduino PWM pins?"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.94rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Question">Question</option>
                  <option value="Debugging Help">Debugging Help</option>
                  <option value="Project Update">Project Update</option>
                  <option value="Showcase">Showcase</option>
                  <option value="General Discussion">General Discussion</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Post Content
                </label>
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  placeholder="Describe the circuit behavior, components involved, code changes you tried, or what question you have..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.55
                  }}
                  required
                />
              </div>

              {/* Attach real project */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Attach a Tracewise Project (Optional)
                </label>
                <select
                  value={attachedProjectId}
                  onChange={(e) => setAttachedProjectId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- No project attached (Text only) --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.title} ({proj.components?.length || 0} components, {proj.version?.label || 'v1.0'})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '4px', display: 'block' }}>
                  <b>Privacy Notice:</b> Only metadata (title, version, and component count) will be visible in the post preview. Your private files are not published without explicit action.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="Arduino Uno, LED, Resistor, Breadboard"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Student Safety Reminder */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--tw-bg)', border: '1px solid var(--tw-border)', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.76rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45 }}>
                <Shield size={14} color="var(--tw-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Please keep posts respectful and focused on electronics learning. Never share personal phone numbers, home addresses, or passwords.
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                <TracewiseBubbleButton
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateModalOpen(false)}
                >
                  <span>Cancel</span>
                </TracewiseBubbleButton>

                <TracewiseBubbleButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Publishing...' : 'Publish Post'}</span>
                </TracewiseBubbleButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </TracewiseBubbleArea>
  );
}
