import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowUpRight,
  User,
  LogOut,
  FolderKanban,
  MessageSquare,
  Settings,
  ChevronDown,
  Edit3,
  Sparkles,
  Users,
  BookOpen,
  HelpCircle,
  GitCompare,
  GraduationCap
} from 'lucide-react';
import { useProject } from '../../store/useProjectStore';
import { useAuth } from '../../store/useAuthStore';
import { AuthModal } from '../auth/AuthModal';
import { TracewiseBubbleButton, TracewiseBubbleIconButton, TracewiseBubbleArea } from '../ui/BubbleActions';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const userMenuRef = useRef(null);
  const exploreMenuRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const { user, isAuthenticated, signOut } = useAuth();

  const studioRoute = activeProject ? `/app/studio/${activeProject.id}` : '/app';
  const compareRoute = activeProject ? `/app/compare/${activeProject.id}` : '/app/compare/starter-traffic-light-buggy';

  const isActive = (path) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (exploreMenuRef.current && !exploreMenuRef.current.contains(event.target)) {
        setExploreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setExploreMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setExploreMenuOpen(false);
  }, [location.pathname]);

  const initials = user?.isAnonymous
    ? 'G'
    : (user?.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'TW');

  const handleHashLinkClick = (to) => {
    setExploreMenuOpen(false);
    setMobileMenuOpen(false);
    if (to.startsWith('/#')) {
      const hash = to.replace('/#', '');
      if (location.pathname !== '/') {
        navigate(`/#${hash}`);
        return;
      }
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 16,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 16px',
          pointerEvents: 'none'
        }}
      >
        <TracewiseBubbleArea theme="light" style={{ width: '100%', maxWidth: '1220px', pointerEvents: 'auto' }}>
          <nav
            className="glass-nav"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderRadius: 'var(--tw-radius-pill)',
              transition: 'all 0.25s ease'
            }}
          >
            {/* =========================================================
                LEFT: BRAND LOGO
            ========================================================= */}
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none'
              }}
              aria-label="Tracewise Home"
            >
              <img
                src="/assets/brand/tracewise-logo.png"
                alt="Tracewise Logo"
                style={{
                  height: '32px',
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain'
                }}
              />
            </Link>

            {/* =========================================================
                CENTER: PRIMARY DESTINATIONS & EXPLORE DROPDOWN
            ========================================================= */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
              }}
              className="desktop-nav-links"
            >
              {/* 1. Studio */}
              <Link
                to={studioRoute}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: location.pathname.startsWith('/app') ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                  transition: 'color 0.15s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = location.pathname.startsWith('/app') ? 'var(--tw-brand)' : 'var(--tw-text-secondary)')}
              >
                Studio
              </Link>

              {/* 2. Projects */}
              <Link
                to="/projects"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isActive('/projects') ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                  transition: 'color 0.15s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/projects') ? 'var(--tw-brand)' : 'var(--tw-text-secondary)')}
              >
                Projects
              </Link>

              {/* 3. Community */}
              <Link
                to="/community"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isActive('/community') ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                  transition: 'color 0.15s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/community') ? 'var(--tw-brand)' : 'var(--tw-text-secondary)')}
              >
                Community
              </Link>

              {/* 4. Explore Dropdown */}
              <div style={{ position: 'relative' }} ref={exploreMenuRef}>
                <button
                  type="button"
                  onClick={() => setExploreMenuOpen(!exploreMenuOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: exploreMenuOpen ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = exploreMenuOpen ? 'var(--tw-brand)' : 'var(--tw-text-secondary)')}
                  aria-expanded={exploreMenuOpen}
                  aria-haspopup="true"
                  aria-label="Explore Menu"
                >
                  <span>Explore</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: exploreMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>

                {/* Explore Dropdown Menu */}
                {exploreMenuOpen && (
                  <div
                    className="glass-card"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '230px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 16px 36px rgba(7, 24, 49, 0.18)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      zIndex: 120
                    }}
                  >
                    {/* How It Works */}
                    <a
                      href="/#how-it-works"
                      onClick={(e) => {
                        e.preventDefault();
                        handleHashLinkClick('/#how-it-works');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <HelpCircle size={16} color="var(--tw-brand)" />
                      <span>How It Works</span>
                    </a>

                    {/* Practice Lab */}
                    <Link
                      to="/learn"
                      onClick={() => setExploreMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <GraduationCap size={16} color="var(--tw-cyan)" />
                      <span>Practice Lab</span>
                    </Link>

                    {/* Compare & Debug */}
                    <Link
                      to={compareRoute}
                      onClick={() => setExploreMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <GitCompare size={16} color="var(--tw-sky)" />
                      <span>Compare & Debug</span>
                    </Link>

                    {/* Learning Resources */}
                    <Link
                      to="/learn"
                      onClick={() => setExploreMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <BookOpen size={16} color="#10b981" />
                      <span>Learning Resources</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* =========================================================
                RIGHT: MESSAGES & USER PROFILE / SIGN IN
            ========================================================= */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Direct Messages Icon Button */}
              <Link
                to="/messages"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isActive('/messages') ? 'var(--tw-brand-soft)' : 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid var(--tw-border)',
                  color: isActive('/messages') ? 'var(--tw-brand)' : 'var(--tw-text)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--tw-brand-soft)';
                  e.currentTarget.style.color = 'var(--tw-brand)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/messages')) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
                    e.currentTarget.style.color = 'var(--tw-text)';
                  }
                }}
                aria-label="Direct Messages"
                title="Direct Messages"
              >
                <MessageSquare size={17} />
              </Link>

              {/* Authenticated User Menu */}
              {isAuthenticated ? (
                <div style={{ position: 'relative' }} ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid var(--tw-border)',
                      borderRadius: 'var(--tw-radius-pill)',
                      padding: '4px 10px 4px 5px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                    aria-label="User Account Menu"
                    aria-expanded={userMenuOpen}
                  >
                    {/* User Avatar Image or Initials Fallback */}
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName || 'User'}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgba(0,0,0,0.08)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 28,
                          height: 28,
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
                        {initials}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--tw-text)',
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {user?.displayName?.split(' ')[0] || user?.handle}
                    </span>
                    <ChevronDown size={14} color="var(--tw-text-muted)" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {userMenuOpen && (
                    <div
                      className="glass-card"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: '230px',
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 16px 36px rgba(7, 24, 49, 0.2)',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        zIndex: 120
                      }}
                    >
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--tw-border)', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--tw-text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.displayName}
                          </span>
                          {user?.isAnonymous && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Guest
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          @{user?.handle}
                        </div>
                      </div>

                      {user?.isAnonymous && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setAuthModalOpen(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--tw-brand)',
                            backgroundColor: 'rgba(30, 63, 216, 0.08)',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            marginBottom: '4px'
                          }}
                        >
                          <Sparkles size={16} />
                          <span>Save Your Account</span>
                        </button>
                      )}

                      {/* View Profile */}
                      <Link
                        to={`/profile/${user?.handle}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          color: 'var(--tw-text)',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <User size={16} color="var(--tw-brand)" />
                        <span>View Profile</span>
                      </Link>

                      {/* Edit Profile */}
                      <Link
                        to="/profile/edit"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          color: 'var(--tw-text)',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Edit3 size={16} color="var(--tw-cyan)" />
                        <span>Edit Profile</span>
                      </Link>

                      {/* My Projects */}
                      <Link
                        to="/projects"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          color: 'var(--tw-text)',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <FolderKanban size={16} color="var(--tw-sky)" />
                        <span>My Projects</span>
                      </Link>

                      {/* My Groups */}
                      <Link
                        to="/community?tab=Groups"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          color: 'var(--tw-text)',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Users size={16} color="#8b5cf6" />
                        <span>My Groups</span>
                      </Link>

                      {/* Settings */}
                      <Link
                        to="/settings"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          color: 'var(--tw-text)',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Settings size={16} color="var(--tw-text-muted)" />
                        <span>Settings</span>
                      </Link>

                      <div style={{ height: 1, backgroundColor: 'var(--tw-border)', margin: '4px 0' }} />

                      {/* Sign Out */}
                      <button
                        type="button"
                        onClick={signOut}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          color: 'var(--tw-error)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <TracewiseBubbleButton
                  onClick={() => setAuthModalOpen(true)}
                  variant="secondary"
                  size="sm"
                  style={{ borderRadius: 'var(--tw-radius-pill)', padding: '7px 14px', fontSize: '0.84rem' }}
                >
                  <User size={14} />
                  <span>Sign In</span>
                </TracewiseBubbleButton>
              )}

              {/* Mobile hamburger button */}
              <div className="mobile-menu-btn" style={{ display: 'none' }}>
                <TracewiseBubbleIconButton
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  size="sm"
                  variant="secondary"
                  aria-label="Toggle navigation"
                >
                  {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </TracewiseBubbleIconButton>
              </div>
            </div>
          </nav>
        </TracewiseBubbleArea>

        {/* =========================================================
            MOBILE DRAWER
        ========================================================= */}
        {mobileMenuOpen && (
          <div
            className="glass-card"
            style={{
              pointerEvents: 'auto',
              position: 'absolute',
              top: 72,
              left: 16,
              right: 16,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.98)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              zIndex: 101,
              borderRadius: '20px',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto'
            }}
          >
            {/* Authenticated user mobile bar */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--tw-border)' }}>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--tw-brand)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                    {initials}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--tw-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.displayName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>@{user?.handle}</div>
                </div>
                {user?.isAnonymous ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    style={{ fontSize: '0.8rem', color: 'var(--tw-brand)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Save Account
                  </button>
                ) : (
                  <Link
                    to={`/profile/${user?.handle}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontSize: '0.8rem', color: 'var(--tw-brand)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Profile
                  </Link>
                )}
              </div>
            ) : (
              <TracewiseBubbleButton
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                variant="secondary"
                style={{ width: '100%', marginBottom: '6px' }}
              >
                <User size={15} />
                <span>Sign In or Join</span>
              </TracewiseBubbleButton>
            )}

            {/* Primary mobile links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Link
                to={studioRoute}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 600,
                  color: 'var(--tw-text)',
                  padding: '6px 0',
                  textDecoration: 'none'
                }}
              >
                Studio
              </Link>

              <Link
                to="/projects"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 600,
                  color: 'var(--tw-text)',
                  padding: '6px 0',
                  textDecoration: 'none'
                }}
              >
                Projects
              </Link>

              <Link
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 600,
                  color: 'var(--tw-text)',
                  padding: '6px 0',
                  textDecoration: 'none'
                }}
              >
                Community
              </Link>

              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 600,
                  color: 'var(--tw-text)',
                  padding: '6px 0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageSquare size={16} />
                <span>Direct Messages</span>
              </Link>
            </div>

            {/* Explore Section */}
            <div style={{ borderTop: '1px solid var(--tw-border)', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--tw-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Explore
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href="/#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHashLinkClick('/#how-it-works');
                  }}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <HelpCircle size={15} color="var(--tw-brand)" />
                  <span>How It Works</span>
                </a>

                <Link
                  to="/learn"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <GraduationCap size={15} color="var(--tw-cyan)" />
                  <span>Practice Lab</span>
                </Link>

                <Link
                  to={compareRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <GitCompare size={15} color="var(--tw-sky)" />
                  <span>Compare & Debug</span>
                </Link>

                <Link
                  to="/learn"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <BookOpen size={15} color="#10b981" />
                  <span>Learning Resources</span>
                </Link>
              </div>
            </div>

            {/* Account Settings & Sign Out */}
            <div style={{ borderTop: '1px solid var(--tw-border)', paddingTop: '10px', marginTop: '4px' }}>
              {isAuthenticated && (
                <>
                  <Link
                    to="/profile/edit"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--tw-text-muted)',
                      padding: '6px 0',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </Link>

                  <Link
                    to="/community?tab=Groups"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--tw-text-muted)',
                      padding: '6px 0',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Users size={15} />
                    <span>My Groups</span>
                  </Link>
                </>
              )}

              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--tw-text-muted)',
                  padding: '6px 0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </Link>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 0',
                    color: 'var(--tw-error)',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%'
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>

            <TracewiseBubbleButton
              to={studioRoute}
              onClick={() => setMobileMenuOpen(false)}
              variant="primary"
              style={{ width: '100%', marginTop: '6px' }}
            >
              <span>Open Studio</span>
              <ArrowUpRight size={16} />
            </TracewiseBubbleButton>
          </div>
        )}

        <style>{`
          @media (max-width: 900px) {
            .desktop-nav-links {
              display: none !important;
            }
            .mobile-menu-btn {
              display: flex !important;
            }
          }
        `}</style>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
