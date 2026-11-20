import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  GitFork,
  Undo2,
  Redo2,
  GitCompare,
  Wrench,
  ChevronLeft,
  Check,
  AlertCircle,
  FolderKanban,
  Mic,
  MoreVertical,
  X,
  Globe,
  Layers
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function StudioToolbar({
  project,
  isSaved,
  canUndo,
  canRedo,
  onSave,
  onFork,
  onPublish,
  onUndo,
  onRedo,
  onUpdateTitle,
  validation,
  isComponentLibraryOpen = true,
  onToggleComponentLibrary = null
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project?.title || '');
  const [pendingNavUrl, setPendingNavUrl] = useState(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const overflowRef = useRef(null);
  const navigate = useNavigate();

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target)) {
        setShowOverflowMenu(false);
      }
    };
    if (showOverflowMenu) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showOverflowMenu]);

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
  };

  const handleNav = (url) => {
    if (!isSaved) {
      setPendingNavUrl(url);
    } else {
      navigate(url);
    }
  };

  const hasErrors = validation?.checks?.some(c => c.status === 'FAILED');

  return (
    <TracewiseBubbleArea theme="light">
      <header
        className="studio-toolbar-header"
        style={{
          minHeight: '56px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--tw-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          zIndex: 50,
          gap: '8px',
          position: 'relative'
        }}
      >
        {/* Left Section: Back & Project Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
          <TracewiseBubbleButton
            onClick={() => handleNav('/app')}
            variant="ghost"
            size="sm"
            title="Return to Dashboard"
            style={{
              color: 'var(--tw-text-secondary)',
              fontSize: '0.82rem',
              padding: '6px 10px',
              gap: '4px',
              minHeight: '38px',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={16} />
            <span className="hide-on-compact-mobile">Dashboard</span>
          </TracewiseBubbleButton>

          <span className="hide-on-compact-mobile" style={{ color: 'var(--tw-border)', fontWeight: 300, flexShrink: 0 }}>/</span>

          {/* Project Title with Truncation on Small Screens */}
          {editingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--tw-brand)',
                color: 'var(--tw-text)',
                fontFamily: 'var(--font-heading)',
                maxWidth: '180px'
              }}
            />
          ) : (
            <div
              onClick={() => {
                setTitleInput(project?.title || '');
                setEditingTitle(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                minWidth: 0,
                overflow: 'hidden'
              }}
              title="Click to rename"
            >
              <h1
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--tw-text)',
                  fontFamily: 'var(--font-heading)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px'
                }}
              >
                {project?.title || 'Untitled Project'}
              </h1>
              <span
                className="hide-on-compact-mobile"
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--tw-brand)',
                  backgroundColor: 'var(--tw-brand-soft)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {project?.version?.label || 'v1.0'}
              </span>
            </div>
          )}

          {/* Component Library Toggle Button */}
          {onToggleComponentLibrary && (
            <TracewiseBubbleButton
              onClick={onToggleComponentLibrary}
              variant={isComponentLibraryOpen ? 'secondary' : 'primary'}
              size="sm"
              title={isComponentLibraryOpen ? "Hide Component Library (expand workspace)" : "Open Component Library (33 parts)"}
              style={{
                fontSize: '0.78rem',
                gap: '6px',
                padding: '6px 10px',
                minHeight: '34px',
                fontWeight: 600,
                flexShrink: 0,
                backgroundColor: isComponentLibraryOpen ? '#f1f5f9' : 'var(--tw-brand)',
                color: isComponentLibraryOpen ? 'var(--tw-text)' : '#ffffff',
                border: isComponentLibraryOpen ? '1px solid var(--tw-border)' : 'none',
                boxShadow: isComponentLibraryOpen ? 'none' : '0 2px 8px rgba(30, 63, 216, 0.25)'
              }}
            >
              <Layers size={14} color={isComponentLibraryOpen ? 'var(--tw-brand)' : '#ffffff'} />
              <span className="hide-on-compact-mobile">
                {isComponentLibraryOpen ? 'Hide Parts' : 'Show Parts'}
              </span>
            </TracewiseBubbleButton>
          )}
        </div>

        {/* Center Section: Undo / Redo & Save status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <TracewiseBubbleIconButton
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            variant="ghost"
            size="sm"
            style={{ opacity: canUndo ? 1 : 0.4, width: 38, height: 38, minWidth: 38, minHeight: 38 }}
          >
            <Undo2 size={16} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            variant="ghost"
            size="sm"
            style={{ opacity: canRedo ? 1 : 0.4, width: 38, height: 38, minWidth: 38, minHeight: 38 }}
          >
            <Redo2 size={16} />
          </TracewiseBubbleIconButton>

          {/* Saved Status Indicator */}
          <span
            style={{
              fontSize: '0.72rem',
              color: isSaved ? 'var(--tw-success)' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '4px',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {isSaved ? <Check size={12} /> : null}
            <span className="hide-on-compact-mobile">{isSaved ? 'Saved' : 'Unsaved'}</span>
          </span>
        </div>

        {/* Right Section: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Always Visible Save Button */}
          <TracewiseBubbleButton
            onClick={onSave}
            title="Save Project"
            variant="secondary"
            size="sm"
            style={{
              fontSize: '0.8rem',
              gap: '4px',
              padding: '6px 12px',
              minHeight: '38px',
              minWidth: '60px'
            }}
          >
            <Save size={14} />
            <span>Save</span>
          </TracewiseBubbleButton>

          {/* Desktop-only secondary actions */}
          <div className="desktop-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TracewiseBubbleButton
              onClick={onFork}
              title="Fork independent copy"
              variant="secondary"
              size="sm"
              style={{ fontSize: '0.8rem', gap: '4px', padding: '6px 12px', minHeight: '38px' }}
            >
              <GitFork size={14} />
              <span>Fork Remix</span>
            </TracewiseBubbleButton>

            <TracewiseBubbleButton
              to={`/app/compare/${project?.id}`}
              title="Compare versions & debug"
              variant={hasErrors ? 'danger' : 'secondary'}
              size="sm"
              style={{
                fontSize: '0.8rem',
                gap: '4px',
                padding: '6px 12px',
                minHeight: '38px'
              }}
            >
              <GitCompare size={14} />
              <span>Compare & Debug</span>
            </TracewiseBubbleButton>

            <TracewiseBubbleButton
              to={`/app/build/${project?.id}`}
              title="Physical Assembly Checklist & BOM"
              variant="primary"
              size="sm"
              style={{ fontSize: '0.8rem', gap: '4px', padding: '6px 12px', minHeight: '38px' }}
            >
              <Wrench size={14} />
              <span>Build Guide</span>
            </TracewiseBubbleButton>

            <TracewiseBubbleButton
              to={`/app/pitch/${project?.id}`}
              title="Project Pitch Lab — Presentation & Judge Prep"
              variant="secondary"
              size="sm"
              style={{ fontSize: '0.8rem', gap: '4px', padding: '6px 12px', minHeight: '38px' }}
            >
              <Mic size={14} color="var(--tw-brand)" />
              <span>Pitch Lab</span>
            </TracewiseBubbleButton>

            {onPublish && (
              <TracewiseBubbleButton
                onClick={onPublish}
                title="Publish circuit to Community Projects"
                variant="secondary"
                size="sm"
                style={{ fontSize: '0.8rem', gap: '4px', padding: '6px 12px', minHeight: '38px', color: 'var(--tw-brand)' }}
              >
                <Globe size={14} />
                <span>Publish</span>
              </TracewiseBubbleButton>
            )}
          </div>

          {/* Mobile/Tablet Overflow Menu Button */}
          <div className="mobile-overflow-container" ref={overflowRef} style={{ position: 'relative' }}>
            <TracewiseBubbleIconButton
              onClick={() => setShowOverflowMenu(prev => !prev)}
              variant="ghost"
              size="sm"
              title="More Actions"
              style={{
                width: 38,
                height: 38,
                minWidth: 38,
                minHeight: 38,
                backgroundColor: showOverflowMenu ? 'rgba(30, 63, 216, 0.08)' : 'transparent'
              }}
            >
              <MoreVertical size={18} />
            </TracewiseBubbleIconButton>

            {/* Overflow Dropdown Menu */}
            {showOverflowMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '210px',
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  boxShadow: '0 12px 32px rgba(7, 24, 49, 0.18)',
                  border: '1px solid var(--tw-border)',
                  padding: '6px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <button
                  onClick={() => {
                    setShowOverflowMenu(false);
                    onFork();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--tw-text)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--tw-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <GitFork size={15} color="var(--tw-brand)" />
                  <span>Fork Remix</span>
                </button>

                <button
                  onClick={() => {
                    setShowOverflowMenu(false);
                    navigate(`/app/compare/${project?.id}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: hasErrors ? 'var(--tw-error)' : 'var(--tw-text)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--tw-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <GitCompare size={15} color={hasErrors ? 'var(--tw-error)' : 'var(--tw-brand)'} />
                  <span>Compare & Debug</span>
                </button>

                <button
                  onClick={() => {
                    setShowOverflowMenu(false);
                    navigate(`/app/build/${project?.id}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--tw-text)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--tw-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Wrench size={15} color="var(--tw-brand)" />
                  <span>Build Guide</span>
                </button>

                <button
                  onClick={() => {
                    setShowOverflowMenu(false);
                    navigate(`/app/pitch/${project?.id}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--tw-text)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--tw-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Mic size={15} color="var(--tw-brand)" />
                  <span>Pitch Lab</span>
                </button>

                {onPublish && (
                  <button
                    onClick={() => {
                      setShowOverflowMenu(false);
                      onPublish();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--tw-brand)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--tw-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Globe size={15} color="var(--tw-brand)" />
                    <span>Publish to Community</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Unsaved Edits Confirmation Dialog */}
      {pendingNavUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 24, 49, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid var(--tw-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertCircle size={22} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
                  Unsaved Changes
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)', margin: '2px 0 0' }}>
                  Project: {project?.title || 'Current Project'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              You have unsaved changes in your circuit or code. Would you like to save your work before navigating away?
            </p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px', flexWrap: 'wrap' }}>
              <TracewiseBubbleButton
                onClick={() => setPendingNavUrl(null)}
                variant="ghost"
                size="sm"
                style={{ minHeight: '36px' }}
              >
                Keep Editing
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={() => {
                  const target = pendingNavUrl;
                  setPendingNavUrl(null);
                  navigate(target);
                }}
                variant="secondary"
                size="sm"
                style={{ color: 'var(--tw-error)', minHeight: '36px' }}
              >
                Discard
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={() => {
                  const target = pendingNavUrl;
                  onSave();
                  setPendingNavUrl(null);
                  navigate(target);
                }}
                variant="primary"
                size="sm"
                style={{ minHeight: '36px' }}
              >
                Save & Exit
              </TracewiseBubbleButton>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-actions-group {
            display: none !important;
          }
          .mobile-overflow-container {
            display: block !important;
          }
        }
        @media (min-width: 901px) {
          .desktop-actions-group {
            display: flex !important;
          }
          .mobile-overflow-container {
            display: none !important;
          }
        }
        @media (max-width: 520px) {
          .hide-on-compact-mobile {
            display: none !important;
          }
        }
      `}</style>
    </TracewiseBubbleArea>
  );
}