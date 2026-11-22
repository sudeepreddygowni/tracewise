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
import './LiquidGlassNavbar.css';

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

  // Determine whether current page has a dark background (e.g. solid Navy landing page)
  const isDarkPage = location.pathname === '/' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');

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
      <header className="tracewise-liquid-header" role="banner">
        <nav
          className={`tracewise-liquid-navbar ${isDarkPage ? 'theme-dark' : 'theme-light'}`}
          aria-label="Primary Navigation"
        >
          {/* Liquid Caustics (Lens Refraction Layer) */}
          <div className="liquid-glass-caustics" aria-hidden="true" />

          {/* =========================================================
              LEFT GROUP: TRACEWISE BRAND LOGO
          ========================================================= */}
          <Link
            to="/"
            className="liquid-nav-brand"
            aria-label="Tracewise Home"
          >
            <img
              src={isDarkPage ? '/assets/brand/tracewise-logo-light.png' : '/assets/brand/tracewise-logo.png'}
              alt="Tracewise Logo"
            />
          </Link>

          {/* =========================================================
              CENTER GROUP: PRIMARY DESTINATIONS & EXPLORE DROPDOWN
          ========================================================= */}
          <div className="liquid-nav-center desktop-nav-links" role="menubar">
            {/* 1. Studio */}
            <Link
              to={studioRoute}
              className={`liquid-nav-link ${location.pathname.startsWith('/app') ? 'active' : ''}`}
              role="menuitem"
            >
              <span>Studio</span>
            </Link>

            {/* 2. Projects */}
            <Link
              to="/projects"
              className={`liquid-nav-link ${isActive('/projects') ? 'active' : ''}`}
              role="menuitem"
            >
              <span>Projects</span>
            </Link>

            {/* 3. Community */}
            <Link
              to="/community"
              className={`liquid-nav-link ${isActive('/community') ? 'active' : ''}`}
              role="menuitem"
            >
              <span>Community</span>
            </Link>

            {/* 4. Explore Dropdown */}
            <div style={{ position: 'relative' }} ref={exploreMenuRef}>
              <button
                type="button"
                onClick={() => setExploreMenuOpen(!exploreMenuOpen)}
                className={`liquid-nav-link ${exploreMenuOpen ? 'active' : ''}`}
                aria-expanded={exploreMenuOpen}
                aria-haspopup="true"
                aria-label="Explore Menu"
                role="menuitem"
              >
                <span>Explore</span>
                <ChevronDown
                  size={13}
                  style={{
                    transform: exploreMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    opacity: 0.8
                  }}
                />
              </button>

              {/* Explore Dropdown Menu */}
              {exploreMenuOpen && (
                <div
                  className="liquid-glass-dropdown"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                  role="menu"
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
                      color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    role="menuitem"
                  >
                    <HelpCircle size={15} color="var(--tw-brand)" />
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
                      color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    role="menuitem"
                  >
                    <GraduationCap size={15} color="var(--tw-cyan)" />
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
                      color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    role="menuitem"
                  >
                    <GitCompare size={15} color="var(--tw-sky)" />
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
                      color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    role="menuitem"
                  >
                    <BookOpen size={15} color="#10b981" />
                    <span>Learning Resources</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              RIGHT GROUP: ACTION ICONS (DM, USER MENU, CTA)
          ========================================================= */}
          <div className="liquid-nav-right">
            {/* Direct Messages Icon Button */}
            <Link
              to="/messages"
              className={`liquid-icon-btn ${isActive('/messages') ? 'active' : ''}`}
              aria-label="Direct Messages"
              title="Direct Messages"
            >
              <MessageSquare size={16} />
            </Link>

            {/* Authenticated User Menu */}
            {isAuthenticated ? (
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="liquid-profile-btn"
                  aria-label="User Account Menu"
                  aria-expanded={userMenuOpen}
                >
                  {/* User Avatar Image or Initials Fallback */}
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || 'User'}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
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
                        fontSize: '0.72rem',
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
                      maxWidth: '90px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.displayName?.split(' ')[0] || user?.handle}
                  </span>
                  <ChevronDown size={13} style={{ opacity: 0.75 }} />
                </button>

                {/* Profile Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="liquid-glass-dropdown"
                    style={{ right: 0 }}
                    role="menu"
                  >
                    <div
                      style={{
                        padding: '8px 10px',
                        borderBottom: `1px solid ${isDarkPage ? 'rgba(255,255,255,0.12)' : 'var(--tw-border)'}`,
                        marginBottom: '4px'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: isDarkPage ? '#f8fafc' : 'var(--tw-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.displayName}
                        </span>
                        {user?.isAnonymous && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              backgroundColor: 'var(--tw-brand-soft)',
                              color: 'var(--tw-brand)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            Guest
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: isDarkPage ? '#94a3b8' : 'var(--tw-text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
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
                          color: '#38bdf8',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '4px'
                        }}
                      >
                        <Sparkles size={15} />
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
                        fontWeight: 500,
                        color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                    >
                      <User size={15} color="var(--tw-brand)" />
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
                        fontWeight: 500,
                        color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                    >
                      <Edit3 size={15} color="var(--tw-cyan)" />
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
                        fontWeight: 500,
                        color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                    >
                      <FolderKanban size={15} color="var(--tw-sky)" />
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
                        fontWeight: 500,
                        color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                    >
                      <Users size={15} color="#a855f7" />
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
                        fontWeight: 500,
                        color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkPage ? 'rgba(255,255,255,0.08)' : 'var(--tw-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                    >
                      <Settings size={15} color="var(--tw-text-muted)" />
                      <span>Settings</span>
                    </Link>

                    <div
                      style={{
                        height: 1,
                        backgroundColor: isDarkPage ? 'rgba(255,255,255,0.12)' : 'var(--tw-border)',
                        margin: '4px 0'
                      }}
                    />

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
                        fontWeight: 500,
                        color: '#f87171',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="liquid-signin-btn"
                aria-label="Sign in"
              >
                <User size={13} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle (Inspired by Reference Pill) */}
            <div className="liquid-mobile-toggle mobile-menu-btn">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="liquid-icon-btn"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>
        </nav>

        {/* =========================================================
            MOBILE LIQUID GLASS DRAWER / SHEET
        ========================================================= */}
        {mobileMenuOpen && (
          <div
            className="liquid-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Authenticated user mobile bar */}
            {isAuthenticated ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${isDarkPage ? 'rgba(255,255,255,0.12)' : 'var(--tw-border)'}`
                }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      backgroundColor: 'var(--tw-brand)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: isDarkPage ? '#f8fafc' : 'var(--tw-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.displayName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isDarkPage ? '#94a3b8' : 'var(--tw-text-muted)' }}>
                    @{user?.handle}
                  </div>
                </div>
                {user?.isAnonymous ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    style={{
                      fontSize: '0.8rem',
                      color: '#38bdf8',
                      fontWeight: 700,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Save Account
                  </button>
                ) : (
                  <Link
                    to={`/profile/${user?.handle}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      fontSize: '0.8rem',
                      color: '#38bdf8',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Profile
                  </Link>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="liquid-signin-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: '4px' }}
              >
                <User size={15} />
                <span>Sign In or Join</span>
              </button>
            )}

            {/* Primary mobile links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link
                to={studioRoute}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  backgroundColor: location.pathname.startsWith('/app') ? (isDarkPage ? 'rgba(255,255,255,0.12)' : 'rgba(30,63,216,0.08)') : 'transparent'
                }}
              >
                Studio
              </Link>

              <Link
                to="/projects"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  backgroundColor: isActive('/projects') ? (isDarkPage ? 'rgba(255,255,255,0.12)' : 'rgba(30,63,216,0.08)') : 'transparent'
                }}
              >
                Projects
              </Link>

              <Link
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  backgroundColor: isActive('/community') ? (isDarkPage ? 'rgba(255,255,255,0.12)' : 'rgba(30,63,216,0.08)') : 'transparent'
                }}
              >
                Community
              </Link>

              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  color: isDarkPage ? '#f1f5f9' : 'var(--tw-text)',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isActive('/messages') ? (isDarkPage ? 'rgba(255,255,255,0.12)' : 'rgba(30,63,216,0.08)') : 'transparent'
                }}
              >
                <MessageSquare size={16} />
                <span>Direct Messages</span>
              </Link>
            </div>

            {/* Explore Section */}
            <div
              style={{
                borderTop: `1px solid ${isDarkPage ? 'rgba(255,255,255,0.12)' : 'var(--tw-border)'}`,
                paddingTop: '10px',
                marginTop: '4px'
              }}
            >
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: isDarkPage ? '#94a3b8' : 'var(--tw-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                  paddingLeft: '6px'
                }}
              >
                Explore
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <a
                  href="/#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHashLinkClick('/#how-it-works');
                  }}
                  style={{
                    fontSize: '0.88rem',
                    color: isDarkPage ? '#cbd5e1' : 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '8px'
                  }}
                >
                  <HelpCircle size={15} color="var(--tw-brand)" />
                  <span>How It Works</span>
                </a>

                <Link
                  to="/learn"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '0.88rem',
                    color: isDarkPage ? '#cbd5e1' : 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '8px'
                  }}
                >
                  <GraduationCap size={15} color="var(--tw-cyan)" />
                  <span>Practice Lab</span>
                </Link>

                <Link
                  to={compareRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '0.88rem',
                    color: isDarkPage ? '#cbd5e1' : 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '8px'
                  }}
                >
                  <GitCompare size={15} color="var(--tw-sky)" />
                  <span>Compare & Debug</span>
                </Link>

                <Link
                  to="/learn"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '0.88rem',
                    color: isDarkPage ? '#cbd5e1' : 'var(--tw-text-secondary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '8px'
                  }}
                >
                  <BookOpen size={15} color="#10b981" />
                  <span>Learning Resources</span>
                </Link>
              </div>
            </div>

            {/* Account Settings & Sign Out */}
            <div
              style={{
                borderTop: `1px solid ${isDarkPage ? 'rgba(255,255,255,0.12)' : 'var(--tw-border)'}`,
                paddingTop: '10px',
                marginTop: '4px'
              }}
            >
              {isAuthenticated && (
                <>
                  <Link
                    to="/profile/edit"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: isDarkPage ? '#cbd5e1' : 'var(--tw-text-muted)',
                      padding: '6px 8px',
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
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: isDarkPage ? '#cbd5e1' : 'var(--tw-text-muted)',
                      padding: '6px 8px',
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
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: isDarkPage ? '#cbd5e1' : 'var(--tw-text-muted)',
                  padding: '6px 8px',
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
                    padding: '8px',
                    color: '#f87171',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.88rem',
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

            <Link
              to={studioRoute}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                width: '100%',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #1e3fd8 0%, #7c3aed 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(30, 63, 216, 0.3)'
              }}
            >
              <span>Open Studio</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
