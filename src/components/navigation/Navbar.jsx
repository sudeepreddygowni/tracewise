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
  Sparkles
} from 'lucide-react';
import { useProject } from '../../store/useProjectStore';
import { useAuth } from '../../store/useAuthStore';
import { AuthModal } from '../auth/AuthModal';
import { TracewiseBubbleButton, TracewiseBubbleIconButton, TracewiseBubbleArea } from '../ui/BubbleActions';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const userMenuRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const { user, isAuthenticated, signOut } = useAuth();

  const studioRoute = activeProject ? `/app/studio/${activeProject.id}` : '/app';

  const navLinks = [
    { label: 'Studio', to: '/#workspace' },
    { label: 'How it Works', to: '/#how-it-works' },
    { label: 'Projects', to: '/projects' },
    { label: 'Community', to: '/community' },
    { label: 'Compare & Debug', to: activeProject ? `/app/compare/${activeProject.id}` : '/app/compare/starter-traffic-light-buggy' },
    { label: 'Practice Lab', to: '/learn' }
  ];

  const isActive = (path) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const initials = user?.isAnonymous
    ? 'G'
    : (user?.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'TW');

  const handleNavLinkClick = (to) => {
    if (to.startsWith('/#')) {
      const hash = to.replace('/#', '');
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
            {/* Brand Logo */}
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

            {/* Desktop Navigation Links */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '22px'
              }}
              className="desktop-nav-links"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => handleNavLinkClick(link.to)}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: isActive(link.to) ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                    transition: 'color 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isActive(link.to) ? 'var(--tw-brand)' : 'var(--tw-text-secondary)')}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Action Buttons & Profile Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid var(--tw-border)',
                      borderRadius: 'var(--tw-radius-pill)',
                      padding: '4px 10px 4px 5px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                    aria-label="User Account Menu"
                  >
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
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.displayName?.split(' ')[0] || user?.handle}
                    </span>
                    <ChevronDown size={14} color="var(--tw-text-muted)" />
                  </button>

                  {/* Profile Dropdown */}
                  {userMenuOpen && (
                    <div
                      className="glass-card"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: '220px',
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
                          <span>{user?.displayName}</span>
                          {user?.isAnonymous && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Guest
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
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
                        <span>My Profile</span>
                      </Link>

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

                      <Link
                        to="/community"
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
                        <MessageSquare size={16} color="var(--tw-brand)" />
                        <span>Community</span>
                      </Link>

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

              {/* Open Studio CTA */}
              <TracewiseBubbleButton
                to={studioRoute}
                variant="primary"
                size="sm"
                style={{ borderRadius: 'var(--tw-radius-pill)', padding: '8px 16px', fontSize: '0.84rem' }}
              >
                <span>Open Studio</span>
                <ArrowUpRight size={14} />
              </TracewiseBubbleButton>

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

        {/* Mobile Drawer */}
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
              borderRadius: '20px'
            }}
          >
            {/* Authenticated user mobile bar */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--tw-border)' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--tw-brand)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--tw-text)' }}>{user?.displayName}</div>
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

            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => {
                  handleNavLinkClick(link.to);
                  setMobileMenuOpen(false);
                }}
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 600,
                  color: 'var(--tw-text)',
                  padding: '6px 0',
                  textDecoration: 'none'
                }}
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '0.96rem',
                fontWeight: 600,
                color: 'var(--tw-text-muted)',
                padding: '6px 0',
                textDecoration: 'none'
              }}
            >
              Settings
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
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            )}

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
