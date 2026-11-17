import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  Check,
  Lock,
  Crown,
  ShieldCheck,
  Send,
  Trash2,
  UserCheck,
  UserX,
  Settings
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
  createCommunityGroup,
  getUserGroupMembership,
  requestJoinGroup,
  getGroupJoinRequests,
  respondToJoinRequest,
  getGroupMembers,
  updateGroupMemberRole,
  removeGroupMember,
  getGroupDiscussions,
  createGroupDiscussion,
  getGroupComments,
  addGroupComment,
  getPublishedProjects,
  deleteCommunityGroup,
  publishCommunityProject,
  unpublishCommunityProject
} from '../services/communityService';
import { AuthModal } from '../components/auth/AuthModal';
import { PublishProjectModal } from '../components/studio/PublishProjectModal';
import { MediaAttachmentPicker } from '../components/ui/MediaAttachmentPicker';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function CommunityPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialFilter = searchParams.get('filter') || 'Latest';
  const initialTab = searchParams.get('tab') || 'All';

  const { user, isAuthenticated } = useAuth();
  const { projects, activeProject, remixProject } = useProject();

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

  // Group Deletion state
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false);
  const [deleteGroupConfirmName, setDeleteGroupConfirmName] = useState('');
  const [deletingGroup, setDeletingGroup] = useState(false);

  // Project Publishing state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [projectToPublish, setProjectToPublish] = useState(null);
  const [unpublishingProjectId, setUnpublishingProjectId] = useState(null);

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
  const [postAttachments, setPostAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Create Group modal state
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCat, setNewGroupCat] = useState('General');
  const [newGroupEmoji, setNewGroupEmoji] = useState('⚡');
  const [newGroupVisibility, setNewGroupVisibility] = useState('public');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupModalError, setGroupModalError] = useState(null);

  // Group Detail Modal / Drawer state
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupTab, setGroupTab] = useState('discussions'); // 'discussions' | 'members' | 'requests'
  const [groupMembership, setGroupMembership] = useState({ isMember: false, role: null, isPending: false });
  const [groupDiscussions, setGroupDiscussions] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupRequests, setGroupRequests] = useState([]);
  const [loadingGroupDetail, setLoadingGroupDetail] = useState(false);
  const [joinNote, setJoinNote] = useState('');
  const [requestingAccess, setRequestingAccess] = useState(false);

  // New Group Discussion Form inside modal
  const [discModalOpen, setDiscModalOpen] = useState(false);
  const [discTitle, setDiscTitle] = useState('');
  const [discBody, setDiscBody] = useState('');
  const [discAttachments, setDiscAttachments] = useState([]);
  const [submittingDisc, setSubmittingDisc] = useState(false);

  // Active Discussion Comments Modal
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [discComments, setDiscComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [submittingReply, setSubmittingReply] = useState(false);

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
        attachments: postAttachments,
        author: user
      });

      setPostTitle('');
      setPostBody('');
      setPostTags('');
      setAttachedProjectId('');
      setPostAttachments([]);
      setCreateModalOpen(false);
      await loadInitialData();
    } catch (err) {
      setModalError(err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------------------------
  // GROUP MANAGEMENT ACTIONS
  // -----------------------------------------------------------------------------
  const openGroupDetails = async (group) => {
    setSelectedGroup(group);
    setGroupTab('discussions');
    setLoadingGroupDetail(true);

    try {
      const [membership, discussions, members] = await Promise.all([
        user ? getUserGroupMembership(group.id, user.uid) : { isMember: false, role: null, isPending: false },
        getGroupDiscussions(group.id),
        getGroupMembers(group.id)
      ]);

      setGroupMembership(membership);
      setGroupDiscussions(discussions);
      setGroupMembers(members);

      // If owner/admin and group is private, load join requests
      const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin' || group.creator_id === user?.uid;
      if (isOwnerOrAdmin && user && group.visibility === 'private') {
        const reqs = await getGroupJoinRequests(group.id, user);
        setGroupRequests(reqs);
      } else {
        setGroupRequests([]);
      }
    } catch (err) {
      console.warn('Load group detail error:', err);
    } finally {
      setLoadingGroupDetail(false);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!selectedGroup || !user) return;
    setDeletingGroup(true);
    try {
      await deleteCommunityGroup(selectedGroup.id, user);
      setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
      setDeleteGroupModalOpen(false);
      setSelectedGroup(null);
      alert(`Group "${selectedGroup.name}" has been permanently deleted.`);
    } catch (err) {
      alert(err.message || 'Failed to delete group.');
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleRemixPublishedProject = (proj) => {
    const remixTitle = `${proj.title} (Remix)`;
    const projectToLoad = proj.projectData || proj;
    const cloned = remixProject ? remixProject(projectToLoad, remixTitle) : null;
    if (cloned) {
      navigate(`/app/studio/${cloned.id}`);
    } else {
      navigate('/app/studio');
    }
  };

  const handleUnpublishProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to unpublish this project from the Community?')) return;
    setUnpublishingProjectId(projectId);
    try {
      await unpublishCommunityProject(projectId, user);
      setPublishedProjects(prev => prev.filter(p => p.id !== projectId));
      alert('Project unpublished from the Community.');
    } catch (err) {
      alert(err.message || 'Failed to unpublish project.');
    } finally {
      setUnpublishingProjectId(null);
    }
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setGroupModalError(null);
    setCreatingGroup(true);

    try {
      const created = await createCommunityGroup({
        name: newGroupName,
        description: newGroupDesc,
        category: newGroupCat,
        avatarEmoji: newGroupEmoji || '⚡',
        visibility: newGroupVisibility
      }, user);

      setGroups(prev => [created, ...prev]);
      setJoinedGroupIds(prev => new Set([...prev, created.id]));
      setCreateGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupEmoji('⚡');
      setNewGroupVisibility('public');
      openGroupDetails(created);
    } catch (err) {
      setGroupModalError(err.message || 'Failed to create group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleRequestGroupAccess = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!selectedGroup) return;

    setRequestingAccess(true);
    try {
      const res = await requestJoinGroup(selectedGroup.id, user, joinNote);
      if (res.status === 'pending') {
        setGroupMembership({ isMember: false, role: null, isPending: true });
        alert('Your membership request was submitted to the group administrator.');
      } else {
        // Immediate join for public group
        setGroupMembership({ isMember: true, role: 'member', isPending: false });
        setJoinedGroupIds(prev => new Set([...prev, selectedGroup.id]));
        const updatedMembers = await getGroupMembers(selectedGroup.id);
        setGroupMembers(updatedMembers);
      }
      setJoinNote('');
    } catch (err) {
      alert(err.message || 'Failed to join group.');
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleCreateGroupDiscussion = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!discTitle.trim() || !discBody.trim()) return;

    setSubmittingDisc(true);
    try {
      const newD = await createGroupDiscussion(selectedGroup.id, {
        title: discTitle,
        body: discBody,
        attachments: discAttachments
      }, user);

      setGroupDiscussions(prev => [newD, ...prev]);
      setDiscTitle('');
      setDiscBody('');
      setDiscAttachments([]);
      setDiscModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to create group discussion.');
    } finally {
      setSubmittingDisc(false);
    }
  };

  const handleRespondToJoinRequest = async (requestId, status, requestingUserId) => {
    try {
      await respondToJoinRequest(requestId, status, selectedGroup.id, requestingUserId, user);
      setGroupRequests(prev => prev.filter(r => r.id !== requestId));
      if (status === 'approved') {
        const updatedMembers = await getGroupMembers(selectedGroup.id);
        setGroupMembers(updatedMembers);
      }
    } catch (err) {
      alert(err.message || 'Failed to process request.');
    }
  };

  const handleUpdateMemberRole = async (targetUserId, newRole) => {
    try {
      await updateGroupMemberRole(selectedGroup.id, targetUserId, newRole, user);
      setGroupMembers(prev =>
        prev.map(m => m.userId === targetUserId ? { ...m, role: newRole } : m)
      );
    } catch (err) {
      alert(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await removeGroupMember(selectedGroup.id, targetUserId, user);
      setGroupMembers(prev => prev.filter(m => m.userId !== targetUserId));
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  const openDiscussionComments = async (disc) => {
    setActiveDiscussion(disc);
    try {
      const comments = await getGroupComments(disc.id);
      setDiscComments(comments);
    } catch {
      setDiscComments([]);
    }
  };

  const handleAddGroupReply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!replyText.trim() && replyAttachments.length === 0) return;

    setSubmittingReply(true);
    try {
      const newC = await addGroupComment(selectedGroup.id, activeDiscussion.id, replyText, replyAttachments, user);
      setDiscComments(prev => [...prev, newC]);
      setReplyText('');
      setReplyAttachments([]);
    } catch (err) {
      alert(err.message || 'Failed to submit reply.');
    } finally {
      setSubmittingReply(false);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} color="var(--tw-brand)" />
                    <span>Community Groups & Labs</span>
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)' }}>
                    Collaborative student teams & hardware clubs
                  </span>
                </div>

                <TracewiseBubbleButton
                  onClick={() => {
                    if (!isAuthenticated) setAuthModalOpen(true);
                    else setCreateGroupModalOpen(true);
                  }}
                  variant="primary"
                  size="sm"
                >
                  <Plus size={15} />
                  <span>Create Group</span>
                </TracewiseBubbleButton>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {(debouncedQuery ? searchResults.groups : groups).map((group) => {
                  const isJoined = joinedGroupIds.has(group.id);
                  const isActionLoading = groupActionLoading === group.id;
                  const isPrivate = group.visibility === 'private';

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
                        border: '1px solid var(--tw-border)',
                        cursor: 'pointer'
                      }}
                      onClick={() => openGroupDetails(group)}
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
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {isPrivate && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#b45309', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Lock size={10} />
                                <span>Private</span>
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)' }}>
                              {group.category}
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginTop: '12px', marginBottom: 0 }}>
                          {group.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--tw-border)' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
                          👥 {group.memberCount} members • 💬 {group.postCount || 0} discussions
                        </span>

                        <TracewiseBubbleButton
                          variant={isJoined ? 'ghost' : 'primary'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPrivate && !isJoined) {
                              openGroupDetails(group);
                            } else {
                              handleJoinLeaveGroup(group);
                            }
                          }}
                          disabled={isActionLoading}
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          {isJoined ? (
                            <>
                              <Check size={14} />
                              <span>Joined</span>
                            </>
                          ) : isPrivate ? (
                            <span>View Group</span>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
                      <Link
                        to={`/profile/${person.handle}`}
                        style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>View Profile</span>
                        <ArrowRight size={13} />
                      </Link>

                      {user && user.uid !== person.id && (
                        <TracewiseBubbleButton
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate('/messages')}
                          style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                        >
                          <MessageSquare size={12} />
                          <span>Message</span>
                        </TracewiseBubbleButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: PUBLISHED PROJECTS (Tab: 'Projects' or 'All' when searched) */}
          {(searchTab === 'Projects' || (debouncedQuery && (searchTab === 'All' && searchResults.projects.length > 0))) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={20} color="var(--tw-brand)" />
                    <span>Published Educational Projects</span>
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)' }}>
                    Interactive circuits created by the community, ready to explore & remix
                  </span>
                </div>

                <TracewiseBubbleButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalOpen(true);
                    } else {
                      setProjectToPublish(activeProject || (projects && projects[0]) || null);
                      setPublishModalOpen(true);
                    }
                  }}
                >
                  <Globe size={14} />
                  <span>Publish a Project</span>
                </TracewiseBubbleButton>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {(debouncedQuery ? searchResults.projects : publishedProjects).map((proj) => {
                  const isAuthor = user && (proj.authorId === user.uid || proj.author_id === user.uid);
                  const compCount = (proj.projectData?.components || []).length;
                  const wireCount = (proj.projectData?.connections || []).length;

                  return (
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
                            {proj.category || 'General'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginTop: '8px', marginBottom: '12px' }}>
                          {proj.description}
                        </p>

                        {/* Specs Pill */}
                        {(compCount > 0 || wireCount > 0) && (
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--tw-text-muted)', marginBottom: '10px' }}>
                            {compCount > 0 && <span>⚡ {compCount} components</span>}
                            {wireCount > 0 && <span>• {wireCount} wires</span>}
                          </div>
                        )}

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
                          by <b>@{proj.authorHandle || proj.author_handle || 'maker'}</b>
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => handleUnpublishProject(proj.id)}
                              disabled={unpublishingProjectId === proj.id}
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                color: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Unpublish this project from Community"
                            >
                              <Trash2 size={12} />
                              <span>{unpublishingProjectId === proj.id ? 'Removing...' : 'Unpublish'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemixPublishedProject(proj)}
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: 'var(--tw-brand)',
                              backgroundColor: 'var(--tw-brand-soft)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>Remix in Studio</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

              {/* Media Attachments */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Media Attachments (Optional)
                </label>
                <MediaAttachmentPicker
                  attachments={postAttachments}
                  onChange={setPostAttachments}
                  userId={user?.uid}
                  disabled={isSubmitting}
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

      {/* =========================================================================
          CREATE GROUP MODAL
      ========================================================================= */}
      {createGroupModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(7, 24, 49, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setCreateGroupModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
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
                  Create an Engineering Group
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', margin: '2px 0 0' }}>
                  Form a hardware lab, student robotics club, or topic community.
                </p>
              </div>
              <TracewiseBubbleIconButton
                size="sm"
                variant="ghost"
                onClick={() => setCreateGroupModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </TracewiseBubbleIconButton>
            </div>

            <form onSubmit={handleCreateGroupSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {groupModalError && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.84rem' }}>
                  {groupModalError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Autonomous Rovers Club"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={newGroupCat}
                    onChange={(e) => setNewGroupCat(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="Robotics">Robotics</option>
                    <option value="Education">Education & 101</option>
                    <option value="Automation">Automation & IoT</option>
                    <option value="Sensors">Sensors & Telemetry</option>
                    <option value="General">General Electronics</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    Avatar Symbol
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['⚡', '🤖', '🌐', '🔬', '💡', '🚀'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewGroupEmoji(em)}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          fontSize: '1.2rem',
                          border: newGroupEmoji === em ? '2px solid var(--tw-brand)' : '1px solid var(--tw-border)',
                          backgroundColor: newGroupEmoji === em ? 'var(--tw-brand-soft)' : '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Visibility
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => setNewGroupVisibility('public')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: newGroupVisibility === 'public' ? '2px solid var(--tw-brand)' : '1px solid var(--tw-border)',
                      backgroundColor: newGroupVisibility === 'public' ? 'var(--tw-brand-soft)' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tw-text)' }}>Public Group</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>Anyone can discover, view, and join immediately.</div>
                  </div>

                  <div
                    onClick={() => setNewGroupVisibility('private')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: newGroupVisibility === 'private' ? '2px solid var(--tw-brand)' : '1px solid var(--tw-border)',
                      backgroundColor: newGroupVisibility === 'private' ? 'var(--tw-brand-soft)' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tw-text)' }}>Private Group 🔒</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>Requires approval from group admin to view and join.</div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What is the goal of this hardware group? What projects will you build together?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <TracewiseBubbleButton type="button" variant="ghost" size="sm" onClick={() => setCreateGroupModalOpen(false)}>
                  Cancel
                </TracewiseBubbleButton>
                <TracewiseBubbleButton type="submit" variant="primary" size="sm" disabled={creatingGroup}>
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </TracewiseBubbleButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          GROUP DETAIL MODAL / DRAWER
      ========================================================================= */}
      {selectedGroup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(7, 24, 49, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '820px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(7, 24, 49, 0.45)',
              maxHeight: '92vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Group Banner Header */}
            <div style={{ padding: '24px 28px', backgroundColor: 'var(--tw-brand-soft)', borderBottom: '1px solid var(--tw-border)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '16px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                    {selectedGroup.avatarEmoji || '⚡'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0 }}>
                        {selectedGroup.name}
                      </h2>
                      {selectedGroup.visibility === 'private' ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#b45309', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Lock size={10} />
                          <span>Private</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' }}>
                          Public
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#ffffff', color: 'var(--tw-brand)' }}>
                        {selectedGroup.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
                      {selectedGroup.description}
                    </p>
                  </div>
                </div>

                <TracewiseBubbleIconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedGroup(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </TracewiseBubbleIconButton>
              </div>

              {/* Membership & Role Status Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
                    👥 {selectedGroup.memberCount} members
                  </span>

                  {groupMembership.isMember && (
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: 'var(--tw-brand)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {groupMembership.role === 'owner' && <Crown size={12} />}
                      {groupMembership.role === 'admin' && <ShieldCheck size={12} />}
                      <span>{groupMembership.role?.toUpperCase()}</span>
                    </span>
                  )}

                  {groupMembership.isPending && (
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: '#fef08a', color: '#854d0e' }}>
                      ⏳ Request Pending Approval
                    </span>
                  )}
                </div>

                {/* Join / Leave Actions */}
                <div>
                  {!groupMembership.isMember && !groupMembership.isPending && (
                    selectedGroup.visibility === 'private' ? (
                      <TracewiseBubbleButton
                        variant="primary"
                        size="sm"
                        onClick={handleRequestGroupAccess}
                        disabled={requestingAccess}
                      >
                        <Lock size={14} />
                        <span>{requestingAccess ? 'Requesting...' : 'Request to Join'}</span>
                      </TracewiseBubbleButton>
                    ) : (
                      <TracewiseBubbleButton
                        variant="primary"
                        size="sm"
                        onClick={handleRequestGroupAccess}
                        disabled={requestingAccess}
                      >
                        <span>{requestingAccess ? 'Joining...' : 'Join Group'}</span>
                      </TracewiseBubbleButton>
                    )
                  )}

                  {groupMembership.isMember && groupMembership.role !== 'owner' && (
                    <TracewiseBubbleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(user.uid)}
                      style={{ color: '#ef4444' }}
                    >
                      <span>Leave Group</span>
                    </TracewiseBubbleButton>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Tabs: Discussions | Members | Join Requests */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--tw-border)', padding: '0 24px', backgroundColor: '#fafafa' }}>
              <button
                type="button"
                onClick={() => setGroupTab('discussions')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: groupTab === 'discussions' ? '3px solid var(--tw-brand)' : '3px solid transparent',
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  color: groupTab === 'discussions' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
                  cursor: 'pointer'
                }}
              >
                Discussions ({groupDiscussions.length})
              </button>

              <button
                type="button"
                onClick={() => setGroupTab('members')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: groupTab === 'members' ? '3px solid var(--tw-brand)' : '3px solid transparent',
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  color: groupTab === 'members' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
                  cursor: 'pointer'
                }}
              >
                Members ({groupMembers.length})
              </button>

              {(groupMembership.role === 'owner' || groupMembership.role === 'admin' || selectedGroup.creator_id === user?.uid) && selectedGroup.visibility === 'private' && (
                <button
                  type="button"
                  onClick={() => setGroupTab('requests')}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: groupTab === 'requests' ? '3px solid var(--tw-brand)' : '3px solid transparent',
                    background: 'transparent',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    color: groupTab === 'requests' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Requests</span>
                  {groupRequests.length > 0 && (
                    <span style={{ backgroundColor: '#2dc5e9', color: '#071831', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                      {groupRequests.length}
                    </span>
                  )}
                </button>
              )}

              {(groupMembership.role === 'owner' || groupMembership.role === 'admin' || selectedGroup.creator_id === user?.uid) && (
                <button
                  type="button"
                  onClick={() => setGroupTab('settings')}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: groupTab === 'settings' ? '3px solid var(--tw-brand)' : '3px solid transparent',
                    background: 'transparent',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    color: groupTab === 'settings' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              {loadingGroupDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--tw-text-muted)' }}>
                  Loading group content...
                </div>
              ) : groupTab === 'discussions' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Start discussion row if member */}
                  {groupMembership.isMember && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <TracewiseBubbleButton
                        variant="primary"
                        size="sm"
                        onClick={() => setDiscModalOpen(true)}
                      >
                        <Plus size={15} />
                        <span>Start Group Discussion</span>
                      </TracewiseBubbleButton>
                    </div>
                  )}

                  {groupDiscussions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: 'var(--tw-text-muted)', fontSize: '0.9rem' }}>
                      No discussions yet in this group. Be the first to start a conversation!
                    </div>
                  ) : (
                    groupDiscussions.map((disc) => (
                      <div
                        key={disc.id}
                        onClick={() => openDiscussionComments(disc)}
                        style={{
                          padding: '18px 20px',
                          borderRadius: '16px',
                          border: '1px solid var(--tw-border)',
                          backgroundColor: '#fafafa',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'border-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--tw-brand)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--tw-border)')}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                            {disc.title}
                          </h4>
                          <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                            {new Date(disc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          {disc.body}
                        </p>

                        {/* Attachments preview */}
                        {disc.attachments && disc.attachments.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            {disc.attachments.map((att, aIdx) => (
                              <span key={aIdx} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'var(--tw-brand-soft)', color: 'var(--tw-brand)' }}>
                                📎 {att.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                          <span>By @{disc.authorHandle}</span>
                          <span>💬 {disc.commentCount || 0} replies</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : groupTab === 'members' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {groupMembers.map((m) => {
                    const isOwner = groupMembership.role === 'owner';
                    const isAdmin = groupMembership.role === 'admin';
                    const canManage = isOwner || (isAdmin && m.role !== 'owner' && m.userId !== user?.uid);

                    return (
                      <div
                        key={m.id}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '14px',
                          border: '1px solid var(--tw-border)',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--tw-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {m.userName?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                              {m.userName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                              @{m.userHandle}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', backgroundColor: m.role === 'owner' ? '#eff6ff' : m.role === 'admin' ? '#f0fdf4' : '#fafafa', color: m.role === 'owner' ? 'var(--tw-brand)' : m.role === 'admin' ? '#16a34a' : 'var(--tw-text-secondary)', border: '1px solid var(--tw-border)' }}>
                            {m.role?.toUpperCase()}
                          </span>

                          {/* Role Management Dropdown */}
                          {canManage && (
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateMemberRole(m.userId, e.target.value)}
                              style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--tw-border)', backgroundColor: '#fff', outline: 'none' }}
                            >
                              {isOwner && <option value="admin">Promote to Admin</option>}
                              <option value="moderator">Set Moderator</option>
                              <option value="member">Set Member</option>
                            </select>
                          )}

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId)}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Remove Member"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : groupTab === 'requests' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {groupRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: 'var(--tw-text-muted)', fontSize: '0.9rem' }}>
                      No pending membership requests.
                    </div>
                  ) : (
                    groupRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          padding: '16px 20px',
                          borderRadius: '14px',
                          border: '1px solid var(--tw-border)',
                          backgroundColor: '#fafafa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                            {req.userName} <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>@{req.userHandle}</span>
                          </div>
                          {req.note && (
                            <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)', margin: '4px 0 0' }}>
                              "{req.note}"
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <TracewiseBubbleButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleRespondToJoinRequest(req.id, 'approved', req.userId)}
                          >
                            <UserCheck size={14} />
                            <span>Approve</span>
                          </TracewiseBubbleButton>
                          <TracewiseBubbleButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRespondToJoinRequest(req.id, 'rejected', req.userId)}
                            style={{ color: '#ef4444' }}
                          >
                            <UserX size={14} />
                            <span>Decline</span>
                          </TracewiseBubbleButton>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : groupTab === 'settings' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid var(--tw-border)' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', margin: '0 0 12px' }}>
                      Group Settings & Metadata
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', fontSize: '0.86rem', color: 'var(--tw-text-secondary)' }}>
                      <span style={{ fontWeight: 600 }}>Group Name:</span>
                      <span style={{ fontWeight: 700, color: 'var(--tw-text)' }}>{selectedGroup.name}</span>
                      <span style={{ fontWeight: 600 }}>Category:</span>
                      <span>{selectedGroup.category}</span>
                      <span style={{ fontWeight: 600 }}>Visibility:</span>
                      <span>{selectedGroup.visibility === 'private' ? '🔒 Private (join request required)' : '🌐 Public (open to all students)'}</span>
                      <span style={{ fontWeight: 600 }}>Total Members:</span>
                      <span>{selectedGroup.memberCount || groupMembers.length} members</span>
                      <span style={{ fontWeight: 600 }}>Your Role:</span>
                      <span style={{ fontWeight: 700, color: 'var(--tw-brand)' }}>
                        {groupMembership.role ? groupMembership.role.toUpperCase() : (selectedGroup.creator_id === user?.uid ? 'OWNER (CREATOR)' : 'ADMIN')}
                      </span>
                    </div>
                  </div>

                  {/* Danger Zone: Permanent Group Deletion */}
                  <div style={{ padding: '22px', borderRadius: '18px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', marginBottom: '8px' }}>
                      <AlertCircle size={20} />
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                        Danger Zone: Permanently Delete Group
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: '#7f1d1d', lineHeight: 1.5, margin: '0 0 16px' }}>
                      Permanently delete <strong>{selectedGroup.name}</strong>. All group discussions, member assignments, replies, and join requests will be permanently erased. Independent community discussions and studio projects will remain untouched.
                    </p>
                    <TracewiseBubbleButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeleteGroupConfirmName('');
                        setDeleteGroupModalOpen(true);
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete Group</span>
                    </TracewiseBubbleButton>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PERMANENT GROUP DELETION CONFIRMATION MODAL
      ========================================================================= */}
      {deleteGroupModalOpen && selectedGroup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(7, 24, 49, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setDeleteGroupModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
              border: '2px solid #ef4444'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '14px' }}>
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Permanently Delete Group?
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--tw-text)', lineHeight: 1.5, margin: '0 0 14px' }}>
              Are you sure you want to delete <strong>{selectedGroup.name}</strong>? This action cannot be undone. All discussions, replies, and member roles will be deleted permanently.
            </p>

            <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)', marginBottom: '8px' }}>
              To confirm deletion, please type the group name <strong style={{ color: '#dc2626' }}>{selectedGroup.name}</strong> below:
            </p>

            <input
              type="text"
              value={deleteGroupConfirmName}
              onChange={(e) => setDeleteGroupConfirmName(e.target.value)}
              placeholder={selectedGroup.name}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                marginBottom: '18px',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <TracewiseBubbleButton
                variant="ghost"
                size="sm"
                onClick={() => setDeleteGroupModalOpen(false)}
                disabled={deletingGroup}
              >
                Cancel
              </TracewiseBubbleButton>
              <TracewiseBubbleButton
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteGroup}
                disabled={deleteGroupConfirmName.trim() !== selectedGroup.name || deletingGroup}
              >
                <Trash2 size={14} />
                <span>{deletingGroup ? 'Deleting...' : 'Permanently Delete Group'}</span>
              </TracewiseBubbleButton>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COMMUNITY PROJECT PUBLISHING MODAL
      ========================================================================= */}
      {publishModalOpen && (
        <PublishProjectModal
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          project={projectToPublish || activeProject || { id: 'custom-proj', name: 'My Electronic Project', components: [], connections: [] }}
          user={user}
          onProjectPublished={(published) => {
            setPublishedProjects(prev => [published, ...prev]);
          }}
        />
      )}

      {/* =========================================================================
          NEW GROUP DISCUSSION MODAL
      ========================================================================= */}
      {discModalOpen && selectedGroup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(7, 24, 49, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setDiscModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(7, 24, 49, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                Start Discussion in {selectedGroup.name}
              </h3>
              <TracewiseBubbleIconButton size="sm" variant="ghost" onClick={() => setDiscModalOpen(false)}>
                <X size={16} />
              </TracewiseBubbleIconButton>
            </div>

            <form onSubmit={handleCreateGroupDiscussion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Discussion Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solving motor jitter with external power decoupling"
                  value={discTitle}
                  onChange={(e) => setDiscTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Share details, schematic questions, or hardware ideas..."
                  value={discBody}
                  onChange={(e) => setDiscBody(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <MediaAttachmentPicker
                attachments={discAttachments}
                onChange={setDiscAttachments}
                userId={user?.uid}
                disabled={submittingDisc}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <TracewiseBubbleButton type="button" variant="ghost" size="sm" onClick={() => setDiscModalOpen(false)}>
                  Cancel
                </TracewiseBubbleButton>
                <TracewiseBubbleButton type="submit" variant="primary" size="sm" disabled={submittingDisc}>
                  {submittingDisc ? 'Posting...' : 'Post Discussion'}
                </TracewiseBubbleButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          GROUP DISCUSSION REPLIES MODAL
      ========================================================================= */}
      {activeDiscussion && selectedGroup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(7, 24, 49, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={() => setActiveDiscussion(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(7, 24, 49, 0.45)',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0 }}>
                  {activeDiscussion.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                  Posted by @{activeDiscussion.authorHandle} in {selectedGroup.name}
                </span>
              </div>
              <TracewiseBubbleIconButton size="sm" variant="ghost" onClick={() => setActiveDiscussion(null)}>
                <X size={16} />
              </TracewiseBubbleIconButton>
            </div>

            <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', lineHeight: 1.6, margin: 0, padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--tw-border)' }}>
              {activeDiscussion.body}
            </p>

            {/* Replies List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                Replies ({discComments.length})
              </span>

              {discComments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--tw-text-muted)', fontSize: '0.84rem', padding: '16px' }}>
                  No replies yet. Join the conversation below!
                </div>
              ) : (
                discComments.map((c) => (
                  <div key={c.id} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                        @{c.authorHandle}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)' }}>
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                      {c.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Form */}
            {groupMembership.isMember ? (
              <form onSubmit={handleAddGroupReply} style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--tw-border)' }}>
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.88rem', outline: 'none' }}
                />

                <MediaAttachmentPicker
                  attachments={replyAttachments}
                  onChange={setReplyAttachments}
                  userId={user?.uid}
                  disabled={submittingReply}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <TracewiseBubbleButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submittingReply || (!replyText.trim() && replyAttachments.length === 0)}
                  >
                    <span>{submittingReply ? 'Posting...' : 'Post Reply'}</span>
                  </TracewiseBubbleButton>
                </div>
              </form>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)', textAlign: 'center', padding: '10px' }}>
                Join this group to participate in discussions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </TracewiseBubbleArea>
  );
}
