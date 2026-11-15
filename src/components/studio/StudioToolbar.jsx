import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Save,
  GitFork,
  Undo2,
  Redo2,
  GitCompare,
  Wrench,
  Download,
  Check,
  ChevronLeft,
  Sparkles,
  Share2
} from 'lucide-react';

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
  const navigate = useNavigate();

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
  };

  const hasErrors = validation?.checks?.some(c => c.status === 'FAILED');

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--tw-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 50,
        gap: '12px'
      }}
    >
      {/* Left: Back & Project Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          to="/app"
          title="Back to Dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--tw-text-muted)',
            fontSize: '0.82rem',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'var(--tw-bg)'
          }}
        >
          <ChevronLeft size={16} />
          <span>Dashboard</span>
        </Link>

        {/* Project Title */}
        {editingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--tw-brand)',
              color: 'var(--tw-text)'
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
            <h1 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--tw-text)' }}>
              {project?.title || 'Untitled Project'}
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            color: canUndo ? 'var(--tw-text)' : 'var(--tw-border)',
            cursor: canUndo ? 'pointer' : 'default'
          }}
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            color: canRedo ? 'var(--tw-text)' : 'var(--tw-border)',
            cursor: canRedo ? 'pointer' : 'default'
          }}
        >
          <Redo2 size={16} />
        </button>

        {/* Saved Status Indicator */}
        <span
          style={{
            fontSize: '0.75rem',
            color: isSaved ? 'var(--tw-success)' : 'var(--tw-warning)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '8px'
          }}
        >
          {isSaved ? <Check size={13} /> : null}
          {isSaved ? 'Saved to Browser' : 'Unsaved edits'}
        </span>
      </div>

      {/* Right: Actions (Save, Fork, Compare, Build) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onSave}
          title="Save Project"
          className="btn-secondary"
          style={{ padding: '7px 14px', fontSize: '0.82rem' }}
        >
          <Save size={14} />
          <span>Save</span>
        </button>

        <button
          onClick={onFork}
          title="Fork independent copy"
          className="btn-secondary"
          style={{ padding: '7px 14px', fontSize: '0.82rem' }}
        >
          <GitFork size={14} />
          <span>Fork Remix</span>
        </button>

        <Link
          to={`/app/compare/${project?.id}`}
          title="Compare versions & debug"
          className="btn-secondary"
          style={{
            padding: '7px 14px',
            fontSize: '0.82rem',
            borderColor: hasErrors ? 'var(--tw-error)' : 'var(--tw-border)',
            color: hasErrors ? 'var(--tw-error)' : 'var(--tw-text)'
          }}
        >
          <GitCompare size={14} />
          <span>Compare & Debug</span>
        </Link>

        <Link
          to={`/app/build/${project?.id}`}
          title="Physical Assembly Checklist & BOM"
          className="btn-primary"
          style={{ padding: '7px 16px', fontSize: '0.82rem' }}
        >
          <Wrench size={14} />
          <span>Build Guide</span>
        </Link>
      </div>
    </header>
  );
}
