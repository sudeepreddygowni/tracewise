import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import { STARTER_PROJECTS } from '../data/starterProjects';
import { exportProjectsJson, importProjectsJson } from '../services/projectStorage';
import {
  Plus,
  Search,
  FolderOpen,
  GitFork,
  Trash2,
  Download,
  Upload,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
  Mic,
  Camera,
  ChevronDown,
  Menu,
  X,
  Compass,
  GraduationCap,
  Settings,
  Users,
  MessageSquare
} from 'lucide-react';
import {
  TracewiseBubbleArea,
  TracewiseBubbleButton,
  TracewiseBubbleIconButton
} from '../components/ui/BubbleActions';

export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, createNewProject, forkActive, deleteProject, loadProject } = useProject();
  const { authNotification, clearAuthNotification } = useAuth();
  const [search, setSearch] = useState('');
  const [importError, setImportError] = useState('');

  // Mobile & Header state
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const createMenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Close create menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCreateMenuOpen(false);
        setMobileDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredProjects = (projects || []).filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = () => {
    const newProj = createNewProject('Untitled Circuit');
    navigate(`/app/studio/${newProj.id}`);
  };

  const handleOpen = (proj) => {
    loadProject(proj.id);
    if (proj.project_type === 'documented_physical_project') {
      navigate(`/app/projects/${proj.id}`);
    } else {
      navigate(`/app/studio/${proj.id}`);
    }
  };

  const handleFork = (e, proj) => {
    e.stopPropagation();
    loadProject(proj.id);
    const forked = forkActive(`${proj.title} (Remix)`);
    if (forked) {
      navigate(`/app/studio/${forked.id}`);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportProjectsJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tracewise_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importProjectsJson(event.target.result);
        window.location.reload();
      } catch (err) {
        setImportError('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Header - Strict Geometric Centering via CSS Grid on Desktop */}
      <header
        style={{
          height: isMobile ? '60px' : '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--tw-border)',
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? undefined : 'minmax(0, 1fr) auto minmax(0, 1fr)',
          justifyContent: isMobile ? 'space-between' : undefined,
          alignItems: 'center',
          padding: isMobile ? '0 16px' : '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        {/* Left Section: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {isMobile ? (
              <>
                <img
                  src="/assets/brand/tracewise-mark.png"
                  alt="Tracewise Mark"
                  style={{ height: '30px', width: '30px', objectFit: 'contain' }}
                />
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#071831', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                  Tracewise
                </span>
              </>
            ) : (
              <img
                src="/assets/brand/tracewise-logo.png"
                alt="Tracewise Logo"
                style={{ height: '30px', objectFit: 'contain' }}
              />
            )}
          </Link>
        </div>

        {/* Center Section: Centered Navigation (Desktop Only) */}
        {!isMobile && (
          <nav
            aria-label="Dashboard Primary Navigation"
            style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
          >
            <Link
              to="/app"
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--tw-brand)',
                backgroundColor: 'var(--tw-brand-soft)',
                padding: '6px 12px',
                borderRadius: '8px'
              }}
            >
              My Projects
            </Link>
            <Link
              to="/projects"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--tw-text-secondary)',
                padding: '6px 8px',
                borderRadius: '8px'
              }}
            >
              Explore Starters
            </Link>
            <Link
              to="/learn"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--tw-text-secondary)',
                padding: '6px 8px',
                borderRadius: '8px'
              }}
            >
              Practice Lab
            </Link>
            <Link
              to="/settings"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--tw-text-secondary)',
                padding: '6px 8px',
                borderRadius: '8px'
              }}
            >
              Settings
            </Link>
          </nav>
        )}

        {/* Right Section: Primary Create Button & Mobile Controls */}
        <div
          ref={createMenuRef}
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            position: 'relative'
          }}
        >
          {/* Create Button with Accessible Dropdown Menu */}
          <div style={{ position: 'relative' }}>
            <TracewiseBubbleButton
              onClick={() => setCreateMenuOpen(v => !v)}
              variant="primary"
              size="sm"
              aria-expanded={createMenuOpen}
              aria-haspopup="menu"
              style={{ fontWeight: 700, gap: '6px' }}
            >
              <Plus size={16} />
              <span>{isMobile ? 'Create' : 'Create Project'}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: createMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease'
                }}
              />
            </TracewiseBubbleButton>

            {createMenuOpen && (
              <div
                role="menu"
                aria-label="Create new project options"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: isMobile ? '260px' : '300px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid var(--tw-border)',
                  boxShadow: '0 20px 48px rgba(11, 35, 72, 0.15)',
                  padding: '8px',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCreateMenuOpen(false);
                    handleCreateNew();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-brand-soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(2, 132, 199, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      flexShrink: 0
                    }}
                  >
                    <Plus size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                      New Circuit
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>
                      Interactive canvas & simulation
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCreateMenuOpen(false);
                    navigate('/app/projects/new-existing');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-brand-soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#059669',
                      flexShrink: 0
                    }}
                  >
                    <Layers size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                      Add Existing Project
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>
                      Document physical hardware build
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCreateMenuOpen(false);
                    navigate('/app/reconstruct');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tw-brand-soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      flexShrink: 0
                    }}
                  >
                    <Camera size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                      Reconstruct from Photos
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>
                      AI vision draft from photographs
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Drawer Toggle (Touch Target 44x44px) */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(v => !v)}
              aria-label={mobileDrawerOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              aria-expanded={mobileDrawerOpen}
              style={{
                width: '44px',
                height: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                border: '1px solid var(--tw-border)',
                backgroundColor: '#ffffff',
                color: 'var(--tw-text)',
                cursor: 'pointer'
              }}
            >
              {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* Accessible Mobile Slide-Over Drawer */}
      {isMobile && mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'flex'
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(7, 24, 49, 0.55)',
              backdropFilter: 'blur(3px)'
            }}
          />

          {/* Drawer Pane */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
            style={{
              position: 'relative',
              marginLeft: 'auto',
              width: '82%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 16px',
              gap: '20px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--tw-border)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/assets/brand/tracewise-mark.png" alt="Tracewise" style={{ height: '28px', width: '28px' }} />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#071831', fontFamily: 'var(--font-display)' }}>
                  Tracewise
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close menu"
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'none',
                  color: 'var(--tw-text)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Link
                to="/app"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--tw-brand-soft)',
                  color: 'var(--tw-brand)',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  minHeight: '44px'
                }}
              >
                <FolderOpen size={18} />
                <span>My Projects</span>
              </Link>
              <Link
                to="/projects"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: 'var(--tw-text)',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  minHeight: '44px'
                }}
              >
                <Compass size={18} />
                <span>Explore Starters</span>
              </Link>
              <Link
                to="/learn"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: 'var(--tw-text)',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  minHeight: '44px'
                }}
              >
                <GraduationCap size={18} />
                <span>Practice Lab</span>
              </Link>
              <Link
                to="/community"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: 'var(--tw-text)',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  minHeight: '44px'
                }}
              >
                <Users size={18} />
                <span>Community</span>
              </Link>
              <Link
                to="/messages"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: 'var(--tw-text)',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  minHeight: '44px'
                }}
              >
                <MessageSquare size={18} />
                <span>Messages</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: 'var(--tw-text)',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  minHeight: '44px'
                }}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--tw-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                Tracewise Engineering Workspace
              </div>
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: 'var(--tw-brand)',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
          padding: isMobile ? '20px 16px 48px' : '36px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '24px' : '32px'
        }}
      >
        {/* Auth callback notification banner */}
        {authNotification && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: authNotification.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${authNotification.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
              color: authNotification.type === 'error' ? '#dc2626' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.92rem',
              fontWeight: 500
            }}
          >
            <span>{authNotification.message}</span>
            <button
              onClick={clearAuthNotification}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'currentColor',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Title & Action Cluster */}
        <TracewiseBubbleArea theme="light">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'flex-end',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Engineering Studio
              </span>
              <h1
                style={{
                  fontSize: isMobile ? '1.6rem' : '2rem',
                  fontWeight: 700,
                  color: 'var(--tw-text)',
                  marginTop: '2px',
                  fontFamily: 'var(--font-display)'
                }}
              >
                My Projects & Remixes
              </h1>
              <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Open saved circuits, test your hardware modifications, and compare versions.
              </p>
            </div>

            {/* Search & Backup Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '0 0 auto' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--tw-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '8px 14px 8px 34px',
                    borderRadius: 'var(--tw-radius-pill)',
                    border: '1px solid var(--tw-border)',
                    backgroundColor: '#ffffff',
                    fontSize: '0.86rem',
                    width: isMobile ? '100%' : '210px',
                    fontFamily: 'var(--font-ui)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <TracewiseBubbleButton
                onClick={handleExport}
                title="Export all projects to JSON backup"
                variant="secondary"
                size="sm"
                style={{ minHeight: '36px' }}
              >
                <Download size={14} />
                <span>Export</span>
              </TracewiseBubbleButton>

              <label style={{ display: 'inline-flex', margin: 0 }}>
                <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
                <TracewiseBubbleButton
                  as="span"
                  variant="secondary"
                  size="sm"
                  title="Import Tracewise Backup (.json)"
                  style={{ pointerEvents: 'none', minHeight: '36px' }}
                >
                  <Upload size={14} />
                  <span>Import (.json)</span>
                </TracewiseBubbleButton>
              </label>
            </div>
          </div>
        </TracewiseBubbleArea>

        {/* Quick Creation Cards Cluster - Prominently discoverable for both desktop & mobile */}
        <section aria-label="Creation options">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '14px'
            }}
          >
            {/* Quick Action 1: New Circuit */}
            <div
              onClick={handleCreateNew}
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                  flexShrink: 0
                }}
              >
                <Plus size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                  New Circuit
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>
                  Interactive canvas & C++ simulation
                </div>
              </div>
              <ArrowRight size={16} color="var(--tw-brand)" />
            </div>

            {/* Quick Action 2: Add Existing Project */}
            <div
              onClick={() => navigate('/app/projects/new-existing')}
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0
                }}
              >
                <Layers size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                  Add Existing Project
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>
                  Document built hardware & science fair
                </div>
              </div>
              <ArrowRight size={16} color="#059669" />
            </div>

            {/* Quick Action 3: Reconstruct from Photos */}
            <div
              onClick={() => navigate('/app/reconstruct')}
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                  flexShrink: 0
                }}
              >
                <Camera size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                  Reconstruct from Photos
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', marginTop: '2px' }}>
                  AI vision analysis from photographs
                </div>
              </div>
              <ArrowRight size={16} color="#0284c7" />
            </div>
          </div>
        </section>

        {importError && (
          <div style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '0.86rem' }}>
            {importError}
          </div>
        )}

        {/* Project Grid with Responsive Mobile auto-fit */}
        <TracewiseBubbleArea theme="light">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: '20px'
            }}
          >
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleOpen(proj)}
                className="glass-card"
                style={{
                  padding: '22px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  borderRadius: '20px',
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: proj.project_type === 'documented_physical_project' ? '#0284c7' : 'var(--tw-brand)',
                          backgroundColor: proj.project_type === 'documented_physical_project' ? 'rgba(56, 189, 248, 0.15)' : 'var(--tw-brand-soft)',
                          padding: '3px 8px',
                          borderRadius: '8px'
                        }}
                      >
                        {proj.project_type === 'documented_physical_project'
                          ? (proj.hardwarePlatform || 'Physical Build')
                          : (proj.version?.label || 'v1.0')}
                      </span>
                      {proj.project_type === 'documented_physical_project' && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#16a34a',
                            backgroundColor: 'rgba(34, 197, 94, 0.12)',
                            padding: '3px 7px',
                            borderRadius: '6px'
                          }}
                        >
                          Physical
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <TracewiseBubbleIconButton
                        onClick={(e) => handleFork(e, proj)}
                        size="sm"
                        variant="ghost"
                        title="Fork an independent remix"
                      >
                        <GitFork size={15} />
                      </TracewiseBubbleIconButton>

                      <TracewiseBubbleIconButton
                        onClick={(e) => handleDelete(e, proj.id)}
                        size="sm"
                        variant="danger"
                        title="Delete project"
                      >
                        <Trash2 size={15} />
                      </TracewiseBubbleIconButton>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
                    {proj.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proj.description || (proj.project_type === 'documented_physical_project' ? 'Documented physical electronics build.' : 'Custom Arduino circuit project.')}
                  </p>
                </div>

                {/* Card Footer with real metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--tw-border)', marginTop: '12px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} />
                    <span>
                      {proj.project_type === 'documented_physical_project' ? (
                        `${(proj.componentsList || []).length} parts • ${(proj.mediaAttachments || []).length} photos`
                      ) : (
                        `${(proj.components || []).length} parts • ${(proj.connections || []).length} wires`
                      )}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                      to={`/app/pitch/${proj.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--tw-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--tw-bg)'
                      }}
                      title="Open Project Pitch Lab"
                    >
                      <Mic size={13} color="var(--tw-brand)" />
                      <span>Pitch</span>
                    </Link>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--tw-brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {proj.project_type === 'documented_physical_project' ? 'Overview' : 'Studio'} <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TracewiseBubbleArea>

        {/* Curated Starters Section with Realistic Editorial Thumbnails */}
        <section style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-display)' }}>
                Curated Electronics Starters
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-muted)' }}>
                Tested circuits ready for experimentation, modification, and physical building.
              </p>
            </div>
            <Link to="/projects" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--tw-brand)' }}>
              Explore All Starters →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: '18px'
            }}
          >
            {STARTER_PROJECTS.map((starter) => (
              <div
                key={starter.id}
                onClick={() => handleOpen(starter)}
                className="glass-card"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Starter Editorial Product Image */}
                {starter.thumbnail && (
                  <div style={{ width: '100%', height: '144px', overflow: 'hidden', backgroundColor: '#071831', position: 'relative' }}>
                    <img
                      src={starter.thumbnail}
                      alt={starter.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: 'rgba(7, 24, 49, 0.75)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#38bdf8'
                      }}
                    >
                      {starter.category}
                    </div>
                  </div>
                )}

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--tw-text-muted)' }}>
                      {starter.level}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--tw-brand)', fontWeight: 600 }}>
                      {starter.components.length} parts
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-display)', margin: 0 }}>
                    {starter.title}
                  </h4>

                  <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {starter.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--tw-border)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                      {starter.connections.length} wires
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Launch →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
