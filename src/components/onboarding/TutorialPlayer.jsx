/**
 * Reusable TutorialPlayer using ReactDrops ShowcasePointer
 *
 * Implements:
 * 1. Curved minimum-jerk cursor movements and labels.
 * 2. Visual-only onCursorPress handling (isolated preview state).
 * 3. onCycle state resets.
 * 4. Full playback controls (Play, Pause, Replay, Next, Prev, Accessible Text mode).
 * 5. Reduced motion support and graceful fallback.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShowcasePointer } from '../showcase-pointer';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Sparkles,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import {
  DashboardLessonPreview,
  ComponentsLessonPreview,
  WiringLessonPreview,
  FirmwareLessonPreview,
  SimulationLessonPreview,
  CompareLessonPreview,
  PitchLessonPreview,
  CommunityLessonPreview
} from './TutorialPreviews';
import { markLessonCompleted } from '../../services/tutorialProgressService';
import { Analytics } from '../../services/analyticsService';

const INITIAL_PREVIEWS = {
  dashboard: { showCreateDialog: false, projectTitle: '', created: false },
  components: { isLibraryOpen: false, componentsAdded: [] },
  wiring: { wire1: false, wire2: false, wire3: false },
  firmware: { validated: false, highlightSetup: false, highlightLoop: false },
  simulation: { isRunning: false, ledOn: false },
  compare: { fixed: false },
  pitch: { generated: false },
  community: { isPublic: false, published: false }
};

export function TutorialPlayer({
  lesson,
  onClose,
  onSelectLesson,
  totalLessons = 8,
  onLaunchPractice
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAccessibleText, setShowAccessibleText] = useState(false);
  const [previewState, setPreviewState] = useState(() => ({
    ...INITIAL_PREVIEWS[lesson.id]
  }));

  const pointerRef = useRef(null);

  // Reset preview state when lesson changes
  useEffect(() => {
    setPreviewState({ ...INITIAL_PREVIEWS[lesson.id] });
    setIsPlaying(true);
    Analytics.trackEvent?.('tutorial_started', { lessonId: lesson.id });
  }, [lesson.id]);

  // Handle visual cursor presses safely
  const handleCursorPress = useCallback(({ target }) => {
    if (!target) return;

    setPreviewState(prev => {
      const next = { ...prev };
      // Lesson 1: Dashboard
      if (target.closest('[data-tour-target="new-project-btn"]')) {
        next.showCreateDialog = true;
      } else if (target.closest('[data-tour-target="project-title-input"]')) {
        next.projectTitle = 'My First LED Circuit';
      } else if (target.closest('[data-tour-target="confirm-create-btn"]')) {
        next.created = true;
        markLessonCompleted(lesson.id);
      }
      // Lesson 2: Components
      else if (target.closest('[data-tour-target="open-components-btn"]')) {
        next.isLibraryOpen = true;
      } else if (target.closest('[data-tour-target="part-arduino-uno"]')) {
        next.componentsAdded = [...new Set([...(prev.componentsAdded || []), 'arduino'])];
      } else if (target.closest('[data-tour-target="part-led-red"]')) {
        next.componentsAdded = [...new Set([...(prev.componentsAdded || []), 'led'])];
      } else if (target.closest('[data-tour-target="part-resistor-220"]')) {
        next.componentsAdded = [...new Set([...(prev.componentsAdded || []), 'resistor'])];
      } else if (target.closest('[data-tour-target="close-components-btn"]')) {
        next.isLibraryOpen = false;
        markLessonCompleted(lesson.id);
      }
      // Lesson 3: Wiring
      else if (target.closest('[data-tour-target="pin-resistor-t1"]')) {
        next.wire1 = true;
      } else if (target.closest('[data-tour-target="pin-led-anode"]')) {
        next.wire2 = true;
      } else if (target.closest('[data-tour-target="pin-arduino-gnd"]')) {
        next.wire3 = true;
        markLessonCompleted(lesson.id);
      }
      // Lesson 4: Firmware
      else if (target.closest('[data-tour-target="editor-validate-btn"]')) {
        next.validated = true;
        markLessonCompleted(lesson.id);
      }
      // Lesson 5: Simulation
      else if (target.closest('[data-tour-target="start-simulation-btn"]')) {
        next.isRunning = true;
        next.ledOn = true;
      } else if (target.closest('[data-tour-target="stop-simulation-btn"]')) {
        next.isRunning = false;
        next.ledOn = false;
        markLessonCompleted(lesson.id);
      }
      // Lesson 6: Compare & Debug
      else if (target.closest('[data-tour-target="align-pin-action"]')) {
        next.fixed = true;
        markLessonCompleted(lesson.id);
      }
      // Lesson 7: Pitch Lab
      else if (target.closest('[data-tour-target="generate-slides-btn"]')) {
        next.generated = true;
        markLessonCompleted(lesson.id);
      }
      // Lesson 8: Community
      else if (target.closest('[data-tour-target="visibility-public-toggle"]')) {
        next.isPublic = true;
      } else if (target.closest('[data-tour-target="confirm-publish-btn"]')) {
        next.published = true;
        markLessonCompleted(lesson.id);
      }
      return next;
    });
  }, [lesson.id]);

  // Reset on loop cycle
  const handleCycle = useCallback(() => {
    setPreviewState({ ...INITIAL_PREVIEWS[lesson.id] });
  }, [lesson.id]);

  const handleRestart = () => {
    setPreviewState({ ...INITIAL_PREVIEWS[lesson.id] });
    pointerRef.current?.restart();
    Analytics.trackEvent?.('tutorial_replayed', { lessonId: lesson.id });
  };

  const renderPreview = () => {
    switch (lesson.id) {
      case 'dashboard':
        return <DashboardLessonPreview state={previewState} />;
      case 'components':
        return <ComponentsLessonPreview state={previewState} />;
      case 'wiring':
        return <WiringLessonPreview state={previewState} />;
      case 'firmware':
        return <FirmwareLessonPreview state={previewState} />;
      case 'simulation':
        return <SimulationLessonPreview state={previewState} />;
      case 'compare':
        return <CompareLessonPreview state={previewState} />;
      case 'pitch':
        return <PitchLessonPreview state={previewState} />;
      case 'community':
        return <CommunityLessonPreview state={previewState} />;
      default:
        return <DashboardLessonPreview state={previewState} />;
    }
  };

  return (
    <div
      className="tutorial-player-container"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 20px 48px -12px rgba(15, 23, 42, 0.16)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: '#1e3fd8',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '9999px'
            }}
          >
            LESSON {lesson.order} OF {totalLessons}
          </span>
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
            {lesson.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setShowAccessibleText(!showAccessibleText)}
            title="Toggle written step guide"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: showAccessibleText ? '#eff6ff' : 'transparent',
              color: showAccessibleText ? '#1e3fd8' : '#64748b',
              border: '1px solid #cbd5e1',
              fontSize: '0.76rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <FileText size={13} />
            <span>{showAccessibleText ? 'Hide Text' : 'Text Guide'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Tutorial"
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div style={{ position: 'relative', width: '100%', minHeight: '360px', height: '420px', backgroundColor: '#0f172a' }}>
        <ShowcasePointer
          ref={pointerRef}
          height="100%"
          playing={isPlaying}
          loop={true}
          loopDelay={1600}
          speed={1}
          clickEffect={true}
          cursors={lesson.cursors}
          onCursorPress={handleCursorPress}
          onCycle={handleCycle}
          style={{ width: '100%', height: '100%' }}
        >
          {renderPreview()}
        </ShowcasePointer>
      </div>

      {/* Accessible Written Steps (Collapsible) */}
      {showAccessibleText && (
        <div style={{ padding: '16px 20px', backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Written Step-by-Step Instructions:
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
            {lesson.accessibleSteps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Bottom Playback Controls */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Left: Play / Pause / Replay */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            title="Replay from start"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>Replay</span>
          </button>
        </div>

        {/* Center: Practice Mode Option */}
        {onLaunchPractice && (
          <button
            type="button"
            onClick={onLaunchPractice}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              border: '1px solid #86efac',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={13} color="#16a34a" />
            <span>Practice Yourself</span>
          </button>
        )}

        {/* Right: Previous / Next Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onSelectLesson && lesson.order > 1 && (
            <button
              type="button"
              onClick={() => onSelectLesson(lesson.order - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
          )}

          {onSelectLesson && lesson.order < totalLessons && (
            <button
              type="button"
              onClick={() => onSelectLesson(lesson.order + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#1e3fd8',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>Next Lesson</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
