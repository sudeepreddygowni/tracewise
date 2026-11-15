import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useProject } from '../../store/useProjectStore';
import { TracewiseBubbleButton, TracewiseBubbleIconButton, TracewiseBubbleArea } from '../ui/BubbleActions';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { activeProject } = useProject();

  const studioRoute = activeProject ? `/app/studio/${activeProject.id}` : '/app';

  const navLinks = [
    { label: 'Studio', to: '/#workspace' },
    { label: 'How it Works', to: '/#how-it-works' },
    { label: 'Projects', to: '/projects' },
    { label: 'Compare & Debug', to: activeProject ? `/app/compare/${activeProject.id}` : '/app/compare/starter-traffic-light-buggy' },
    { label: 'Practice Lab', to: '/learn' },
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
      <TracewiseBubbleArea theme="light" style={{ width: '100%', maxWidth: '1180px', pointerEvents: 'auto' }}>
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
                  fontWeight: 600,
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

          {/* Action Button Cluster with Bubble UI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TracewiseBubbleButton
              to={studioRoute}
              variant="primary"
              size="sm"
              style={{ borderRadius: 'var(--tw-radius-pill)', padding: '8px 18px' }}
            >
              <span>Open Studio</span>
              <ArrowUpRight size={15} />
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
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            zIndex: 101,
            borderRadius: '20px'
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
