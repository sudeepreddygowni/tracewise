import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cpu, Layers, GitCompare, BookOpen, Wrench, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { useProject } from '../../store/useProjectStore';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { activeProject } = useProject();

  const studioRoute = activeProject ? `/app/studio/${activeProject.id}` : '/app';

  const navLinks = [
    { label: 'Platform', to: '/#features' },
    { label: 'How it Works', to: '/#how-it-works' },
    { label: 'Projects', to: '/projects' },
    { label: 'Practice Lab', to: '/learn' },
    { label: 'Compare & Debug', to: activeProject ? `/app/compare/${activeProject.id}` : '/app/compare/starter-traffic-light-buggy' },
    { label: 'FAQ', to: '/#faq' }
  ];

  const isActive = (path) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  return (
    <header style={{
      position: 'fixed',
      top: 16,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'center',
      padding: '0 16px',
      pointerEvents: 'none'
    }}>
      <nav
        className="glass-nav"
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '1180px',
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
            gap: '24px'
          }}
          className="desktop-nav-links"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              style={{
                fontSize: '0.92rem',
                fontWeight: 500,
                color: isActive(link.to) ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                transition: 'color 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isActive(link.to) ? 'var(--tw-brand)' : 'var(--tw-text-secondary)')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Button Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to={studioRoute}
            className="btn-primary"
            style={{
              padding: '9px 20px',
              fontSize: '0.88rem',
              borderRadius: 'var(--tw-radius-pill)'
            }}
          >
            <span>Open Studio</span>
            <ArrowUpRight size={16} />
          </Link>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--tw-text)'
            }}
            className="mobile-menu-btn"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="glass-card"
          style={{
            pointerEvents: 'auto',
            position: 'absolute',
            top: 68,
            left: 16,
            right: 16,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            zIndex: 101
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--tw-text)',
                padding: '8px 0'
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={studioRoute}
            onClick={() => setMobileMenuOpen(false)}
            className="btn-primary"
            style={{ width: '100%', textAlign: 'center', marginTop: '8px' }}
          >
            Open Studio →
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav-links {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
