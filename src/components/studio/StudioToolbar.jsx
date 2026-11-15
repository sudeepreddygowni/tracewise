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
  Check
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
  const navigate = useNavigate();

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
  };

  const hasErrors = validation?.checks?.some(c => c.status === 'FAILED');

  return (
    <TracewiseBubbleArea theme="light">
      <header
        style={{
          height: '58px',
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
          <TracewiseBubbleButton
            to="/app"
            variant="ghost"
            size="sm"
            style={{
              color: 'var(--tw-text-secondary)',
              fontSize: '0.82rem',
              gap: '4px'
            }}
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </TracewiseBubbleButton>

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
              <h1 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
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
              color: isSaved ? 'var(--tw-success)' : 'var(--tw-warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '8px',
              fontWeight: 500
            }}
          >
            {isSaved ? <Check size={13} /> : null}
            {isSaved ? 'Saved to Browser' : 'Unsaved edits'}
          </span>
        </div>

        {/* Right: Actions (Save, Fork, Compare, Build) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
    </TracewiseBubbleArea>
  );
}
