import React, { useState } from 'react';
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
  FolderKanban
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
  onUndo,
  onRedo,
  onUpdateTitle,
  validation
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project?.title || '');
  const [pendingNavUrl, setPendingNavUrl] = useState(null);
  const navigate = useNavigate();

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
        style={{
          minHeight: '58px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--tw-border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          zIndex: 50,
          gap: '12px'
        }}
      >
        {/* Left: Prominent Breadcrumb Navigation (← Dashboard / Projects / Title) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <TracewiseBubbleButton
            onClick={() => handleNav('/app')}
            variant="ghost"
            size="sm"
            title="Return to Dashboard"
            style={{
              color: 'var(--tw-text-secondary)',
              fontSize: '0.82rem',
              padding: '4px 10px',
              gap: '4px'
            }}
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </TracewiseBubbleButton>

          <span style={{ color: 'var(--tw-border)', fontWeight: 300 }}>/</span>

          <TracewiseBubbleButton
            onClick={() => handleNav('/projects')}
            variant="ghost"
            size="sm"
            title="Browse Projects Catalog"
            style={{
              color: 'var(--tw-text-secondary)',
              fontSize: '0.82rem',
              padding: '4px 10px',
              gap: '4px'
            }}
          >
            <FolderKanban size={14} />
            <span>Projects</span>
          </TracewiseBubbleButton>

          <span style={{ color: 'var(--tw-border)', fontWeight: 300 }}>/</span>

          {/* Project Title & Version */}
          {editingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--tw-brand)',
                color: 'var(--tw-text)',
                fontFamily: 'var(--font-heading)'
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
                gap: '8px',
                cursor: 'pointer'
              }}
              title="Click to rename"
            >
              <h1 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                {project?.title || 'Untitled Project'}
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--tw-brand)',
                  backgroundColor: 'var(--tw-brand-soft)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                {project?.version?.label || 'v1.0 Baseline'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Undo / Redo & Save status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TracewiseBubbleIconButton
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            variant="ghost"
            size="sm"
            style={{ opacity: canUndo ? 1 : 0.4 }}
          >
            <Undo2 size={16} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            variant="ghost"
            size="sm"
            style={{ opacity: canRedo ? 1 : 0.4 }}
          >
            <Redo2 size={16} />
          </TracewiseBubbleIconButton>

          {/* Saved Status Indicator */}
          <span
            style={{
              fontSize: '0.75rem',
              color: isSaved ? 'var(--tw-success)' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '6px',
              fontWeight: 500
            }}
          >
            {isSaved ? <Check size={13} /> : null}
            {isSaved ? 'Saved to Browser' : 'Unsaved edits'}
          </span>
        </div>

        {/* Right: Actions (Save, Fork, Compare, Build) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <TracewiseBubbleButton
            onClick={onSave}
            title="Save Project"
            variant="secondary"
            size="sm"
            style={{ fontSize: '0.82rem', gap: '6px' }}
          >
            <Save size={14} />
            <span>Save</span>
          </TracewiseBubbleButton>

          <TracewiseBubbleButton
            onClick={onFork}
            title="Fork independent copy"
            variant="secondary"
            size="sm"
            style={{ fontSize: '0.82rem', gap: '6px' }}
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
              fontSize: '0.82rem',
              gap: '6px'
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
            style={{ fontSize: '0.82rem', gap: '6px' }}
          >
            <Wrench size={14} />
            <span>Build Guide</span>
          </TracewiseBubbleButton>
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
              padding: '28px',
              maxWidth: '460px',
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
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertCircle size={24} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, margin: 0, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
                  Unsaved Changes
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-muted)', margin: '2px 0 0' }}>
                  Project: {project?.title || 'Current Project'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              You have unsaved changes in your circuit or code. Would you like to save your work before navigating away?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <TracewiseBubbleButton
                onClick={() => setPendingNavUrl(null)}
                variant="ghost"
                size="sm"
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
                style={{ color: 'var(--tw-error)' }}
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
              >
                Save & Exit
              </TracewiseBubbleButton>
            </div>
          </div>
        </div>
      )}
    </TracewiseBubbleArea>
  );
}
