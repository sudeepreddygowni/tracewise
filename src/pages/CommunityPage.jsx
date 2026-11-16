import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tag,
  Users,
  FolderGit2,
  Linkedin,
  ExternalLink,
  Globe,
  Check
} from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import { useProject } from '../store/useProjectStore';
import {
  getCommunityPosts,
  createCommunityPost,
  searchCommunity,
  getCommunityGroups,
  joinCommunityGroup,
  leaveCommunityGroup,
  getPublishedProjects
} from '../services/communityService';
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
  const initialTab = searchParams.get('tab') || 'All';

  const { user, isAuthenticated } = useAuth();
  const { projects } = useProject();

  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [publishedProjects, setPublishedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [searchTab, setSearchTab] = useState(initialTab); // 'All' | 'Posts' | 'People' | 'Projects' | 'Groups'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [joinedGroupIds, setJoinedGroupIds] = useState(new Set());
  const [groupActionLoading, setGroupActionLoading] = useState(null);

  // Unified search results
  const [searchResults, setSearchResults] = useState({
    posts: [],
    people: [],
    projects: [],
    groups: []
  });

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

  const searchTabs = [
    { id: 'All', label: 'All', icon: Globe },
    { id: 'Posts', label: 'Discussions', icon: MessageSquare },
    { id: 'People', label: 'People', icon: Users },
    { id: 'Projects', label: 'Projects', icon: Cpu },
    { id: 'Groups', label: 'Groups', icon: Users }
  ];

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

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const authorUid = selectedFilter === 'My Posts' && user ? user.uid : null;
      const [fetchedPosts, fetchedGroups, fetchedProjects] = await Promise.all([
        getCommunityPosts({ category: selectedCategory, authorUid, filter: selectedFilter }),
        getCommunityGroups(),
        getPublishedProjects()
      ]);
      setPosts(fetchedPosts);
      setGroups(fetchedGroups);
      setPublishedProjects(fetchedProjects);
    } catch (err) {
      console.error('Error fetching initial community data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [selectedCategory, selectedFilter, user]);

  // Execute unified search when debounced query or search tab changes
  useEffect(() => {
    let active = true;
    async function runSearch() {
      if (!debouncedQuery && searchTab === 'All') {
        setSearchResults({ posts: [], people: [], projects: [], groups: [] });
        return;
      }

      setIsSearching(true);
      try {
        const typeArg = searchTab.toLowerCase();
        const res = await searchCommunity({ query: debouncedQuery, type: typeArg });
        if (active) {
          setSearchResults(res);
        }
      } catch (err) {
        console.warn('Unified search note:', err);
      } finally {
        if (active) setIsSearching(false);
      }
    }

    runSearch();
    return () => { active = false; };
  }, [debouncedQuery, searchTab]);

  const handleJoinLeaveGroup = async (group) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    const isJoined = joinedGroupIds.has(group.id);
    setGroupActionLoading(group.id);
    try {
      if (isJoined) {
        await leaveCommunityGroup(group.id, user);
        setJoinedGroupIds(prev => {
          const next = new Set(prev);
          next.delete(group.id);
          return next;
        });
      } else {
        await joinCommunityGroup(group.id, user);
        setJoinedGroupIds(prev => {
          const next = new Set(prev);
          next.add(group.id);
          return next;
        });
      }
    } catch (err) {
      console.error('Group join/leave error:', err);
    } finally {
      setGroupActionLoading(null);
    }
  };

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
      await loadInitialData();
    } catch (err) {
      setModalError(err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Question': return { bg: '#eff6ff', color: 'var(--tw-brand)' };
      case 'Debugging Help': return { bg: '#fef3c7', color: '#b45309' };
      case 'Showcase': return { bg: '#f0fdf4', color: 'var(--tw-success)' };
      case 'Project Update': return { bg: '#f5f3ff', color: '#7c3aed' };
      default: return { bg: 'var(--tw-bg)', color: 'var(--tw-text-secondary)' };
    }
  };

  // Determine what list to show for posts
  const activePostsList = useMemo(() => {
    if (debouncedQuery) {
      return searchResults.posts;
    }
    return posts;
  }, [debouncedQuery, searchResults.posts, posts]);

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
                Share circuit experiments, join special-interest engineering groups, discover published projects, and search across student makers.
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

          {/* Unified Search & Multi-Entity Navigation Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Unified Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--tw-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across posts, people, projects, and groups (e.g. 'Robotics', 'LED', 'Sudeep', 'Buzzer')..."
                style={{
                  width: '100%',
                  padding: '12px 18px 12px 46px',
                  borderRadius: 'var(--tw-radius-pill)',
                  border: '1px solid var(--tw-border)',
                  backgroundColor: '#ffffff',
                  fontSize: '0.94rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: '0 2px 10px rgba(7, 24, 49, 0.04)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--tw-text-muted)'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Entity Filter Tabs (All | Posts | People | Projects | Groups) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {searchTabs.map((tab) => {
                  const isSelected = searchTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSearchTab(tab.id)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--tw-radius-pill)',
                        border: 'none',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isSelected ? 'var(--tw-brand)' : '#ffffff',
                        color: isSelected ? '#ffffff' : 'var(--tw-text-secondary)',
                        boxShadow: isSelected ? '0 4px 14px rgba(30, 63, 216, 0.25)' : '0 1px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={15} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Category Pills (Visible when in Posts or All mode) */}
              {(searchTab === 'All' || searchTab === 'Posts') && !debouncedQuery && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
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
              )}
            </div>
          </div>

          {/* VIEW: COMMUNITY GROUPS (Tab: 'Groups' or 'All' when searched) */}
          {(searchTab === 'Groups' || (debouncedQuery && (searchTab === 'All' && searchResults.groups.length > 0))) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} color="var(--tw-brand)" />
                  <span>Community Groups & Labs</span>
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)' }}>
                  Collaborative student teams & hardware clubs
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {(debouncedQuery ? searchResults.groups : groups).map((group) => {
                  const isJoined = joinedGroupIds.has(group.id);
                  const isActionLoading = groupActionLoading === group.id;

                  return (
                    <div
                      key={group.id}
                      className="glass-card"
                      style={{
                        padding: '22px',
                        backgroundColor: '#ffffff',
                        borderRadius: '18px',
                        boxShadow: '0 6px 20px rgba(7, 24, 49, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        border: '1px solid var(--tw-border)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: 'var(--tw-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                              {group.avatarEmoji || '⚡'}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                                {group.name}
                              </h4>
                              <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                                #{group.slug}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)' }}>
                            {group.category}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginTop: '12px', marginBottom: 0 }}>
                          {group.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--tw-border)' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
                          👥 {group.memberCount} members
                        </span>

                        <TracewiseBubbleButton
                          variant={isJoined ? 'ghost' : 'primary'}
                          size="sm"
                          onClick={() => handleJoinLeaveGroup(group)}
                          disabled={isActionLoading}
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          {isJoined ? (
                            <>
                              <Check size={14} />
                              <span>Joined</span>
                            </>
                          ) : (
                            <span>{isActionLoading ? 'Joining...' : 'Join Group'}</span>
                          )}
                        </TracewiseBubbleButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: PEOPLE (Tab: 'People' or 'All' when searched) */}
          {(searchTab === 'People' || (debouncedQuery && (searchTab === 'All' && searchResults.people.length > 0))) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} color="var(--tw-brand)" />
                  <span>Student Makers & Contributors</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                  Public profiles only · Privacy preserved
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {searchResults.people.map((person) => (
                  <div
                    key={person.id}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(7, 24, 49, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      border: '1px solid var(--tw-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: 'var(--tw-brand)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {person.displayName ? person.displayName[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                          <Link
                            to={`/profile/${person.handle}`}
                            style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--tw-text)', textDecoration: 'none' }}
                          >
                            {person.displayName}
                          </Link>
                          <div style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                            @{person.handle}
                          </div>
                        </div>
                      </div>

                      {person.linkedinUrl && (
                        <a
                          href={person.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            backgroundColor: '#0077b5',
                            color: '#ffffff',
                            textDecoration: 'none'
                          }}
                          title="LinkedIn Profile"
                        >
                          <Linkedin size={16} />
                        </a>
                      )}
                    </div>

                    <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {person.bio || 'Electronics maker building with Tracewise.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
                      <Link
                        to={`/profile/${person.handle}`}
                        style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>View Profile</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: PUBLISHED PROJECTS (Tab: 'Projects' or 'All' when searched) */}
          {(searchTab === 'Projects' || (debouncedQuery && (searchTab === 'All' && searchResults.projects.length > 0))) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={20} color="var(--tw-brand)" />
                  <span>Published Educational Projects</span>
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)' }}>
                  Interactive starter circuits ready to remix
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {(debouncedQuery ? searchResults.projects : publishedProjects).map((proj) => (
                  <div
                    key={proj.id}
                    className="glass-card"
                    style={{
                      padding: '22px',
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      boxShadow: '0 6px 20px rgba(7, 24, 49, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      border: '1px solid var(--tw-border)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                          {proj.title}
                        </h4>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)' }}>
                          {proj.remixCount || 0} remixes
                        </span>
                      </div>

                      <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginTop: '8px', marginBottom: '12px' }}>
                        {proj.description}
                      </p>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {proj.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
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
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--tw-border)' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                        by <b>@{proj.authorHandle || 'maker'}</b>
                      </span>

                      <Link
                        to="/app/studio"
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--tw-brand)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: 'var(--tw-brand-soft)',
                          padding: '6px 12px',
                          borderRadius: '8px'
                        }}
                      >
                        <span>Remix in Studio</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: POSTS FEED (Tab: 'Posts' or 'All') */}
          {(searchTab === 'All' || searchTab === 'Posts') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} color="var(--tw-brand)" />
                  <span>Discussion Threads</span>
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)' }}>
                  {activePostsList.length} discussions
                </span>
              </div>

              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--tw-text-muted)' }}>
                  Loading discussions...
                </div>
              ) : activePostsList.length > 0 ? (
                activePostsList.map((post) => {
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
                })
              ) : (
                <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '24px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--tw-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--tw-brand)' }}>
                    <MessageSquare size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', margin: '0 0 6px 0' }}>
                    No discussions found
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    {debouncedQuery
                      ? `No posts matched "${debouncedQuery}". Try another keyword or explore the Groups tab.`
                      : 'Be the first to ask a technical question or share a project update with the community.'}
                  </p>
                  <TracewiseBubbleButton onClick={handleCreatePostClick} variant="primary" size="sm">
                    <span>Start the First Discussion</span>
                  </TracewiseBubbleButton>
                </div>
              )}
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
