/**
 * Tracewise First-Time Welcome Experience
 *
 * Implements:
 * 1. Non-blocking, elegant welcome banner/modal.
 * 2. Experience level selection (Beginner, Intermediate, Advanced).
 * 3. Guided tour / Explore / Ask Mini actions.
 * 4. Persistent dismissal state so returning users are never interrupted.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, HelpCircle, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import {
  getTutorialProgress,
  dismissWelcome,
  setExperienceLevel,
  EXPERIENCE_LEVELS
} from '../../services/tutorialProgressService';
import { Analytics } from '../../services/analyticsService';

export function WelcomeExperience({ onOpenTour, onOpenMini }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);

  useEffect(() => {
    const progress = getTutorialProgress();
    if (!progress.welcomeDismissed) {
      setIsOpen(true);
      Analytics.trackEvent?.('onboarding_started');
    }
  }, []);

  const handleDismiss = () => {
    dismissWelcome();
    setIsOpen(false);
    Analytics.trackEvent?.('onboarding_skipped');
  };

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    setExperienceLevel(level);
  };

  const handleStartTour = () => {
    dismissWelcome();
    setIsOpen(false);
    if (onOpenTour) {
      onOpenTour();
    }
  };

  const handleStartMini = () => {
    dismissWelcome();
    setIsOpen(false);
    if (onOpenMini) {
      onOpenMini();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Tracewise"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        right: '24px',
        maxWidth: '520px',
        margin: '0 auto',
        zIndex: 90,
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.22), 0 4px 16px rgba(30, 63, 216, 0.08)',
        padding: '24px',
        animation: 'welcomeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @keyframes welcomeSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss welcome"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%'
        }}
      >
        <X size={18} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color="#1e3fd8" />
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3fd8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Welcome to Tracewise
        </span>
      </div>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
        Build circuits, experiment, and learn.
      </h2>
      <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
        Bring your electronics ideas to life. What describes your experience level best?
      </p>

      {/* Experience Selection Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => handleSelectLevel(EXPERIENCE_LEVELS.BEGINNER)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            border: selectedLevel === EXPERIENCE_LEVELS.BEGINNER ? '2px solid #1e3fd8' : '1px solid #e2e8f0',
            backgroundColor: selectedLevel === EXPERIENCE_LEVELS.BEGINNER ? '#eff6ff' : '#f8fafc',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>🌱 I am new to electronics</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>We'll start with fundamental concepts and step-by-step guidance.</div>
          </div>
          {selectedLevel === EXPERIENCE_LEVELS.BEGINNER && <CheckCircle2 size={16} color="#1e3fd8" />}
        </button>

        <button
          type="button"
          onClick={() => handleSelectLevel(EXPERIENCE_LEVELS.INTERMEDIATE)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            border: selectedLevel === EXPERIENCE_LEVELS.INTERMEDIATE ? '2px solid #1e3fd8' : '1px solid #e2e8f0',
            backgroundColor: selectedLevel === EXPERIENCE_LEVELS.INTERMEDIATE ? '#eff6ff' : '#f8fafc',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>⚡ I know some electronics basics</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Explore interactive simulation, custom parts, and Compare & Debug.</div>
          </div>
          {selectedLevel === EXPERIENCE_LEVELS.INTERMEDIATE && <CheckCircle2 size={16} color="#1e3fd8" />}
        </button>

        <button
          type="button"
          onClick={() => handleSelectLevel(EXPERIENCE_LEVELS.ADVANCED)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            border: selectedLevel === EXPERIENCE_LEVELS.ADVANCED ? '2px solid #1e3fd8' : '1px solid #e2e8f0',
            backgroundColor: selectedLevel === EXPERIENCE_LEVELS.ADVANCED ? '#eff6ff' : '#f8fafc',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>🚀 I already build Arduino projects</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Jump directly into C++ firmware editing, science fair Pitch Lab, and sharing.</div>
          </div>
          {selectedLevel === EXPERIENCE_LEVELS.ADVANCED && <CheckCircle2 size={16} color="#1e3fd8" />}
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '6px' }}>
        <button
          type="button"
          onClick={handleStartTour}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 18px',
            backgroundColor: '#1e3fd8',
            color: '#ffffff',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 63, 216, 0.3)'
          }}
        >
          <span>Take the guided tour</span>
          <ArrowRight size={15} />
        </button>

        <button
          type="button"
          onClick={handleStartMini}
          style={{
            padding: '10px 14px',
            backgroundColor: '#f1f5f9',
            color: '#1e293b',
            borderRadius: '9999px',
            border: '1px solid #cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <HelpCircle size={14} color="#0284c7" />
          <span>Ask Mini</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            padding: '10px 12px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Explore on my own
        </button>
      </div>
    </div>
  );
}
