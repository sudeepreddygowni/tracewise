/**
 * Tracewise Learning Centre
 *
 * Hub for the 8 approved interactive Showcase Pointer lessons and practice mode.
 * Accessible from Learn page, Welcome modal, Studio toolbar, and Tracewise Mini.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import { TUTORIAL_LESSONS, getLessonById } from '../../tutorials/tutorialData';
import { TutorialPlayer } from './TutorialPlayer';
import { getTutorialProgress } from '../../services/tutorialProgressService';
import { Analytics } from '../../services/analyticsService';

export function LearningCentre({
  initialLessonId = null,
  onClose,
  onLaunchPractice,
  isModal = false
}) {
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);
  const [progress, setProgress] = useState(getTutorialProgress());

  useEffect(() => {
    function handleUpdate(e) {
      if (e.detail) {
        setProgress(e.detail);
      }
    }
    window.addEventListener('tracewise:tutorial_progress_updated', handleUpdate);
    return () => window.removeEventListener('tracewise:tutorial_progress_updated', handleUpdate);
  }, []);

  const completedCount = progress.completedLessons?.length || 0;
  const progressPercent = Math.round((completedCount / TUTORIAL_LESSONS.length) * 100);

  const handleStartLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    Analytics.trackEvent?.('tutorial_started', { lessonId });
  };

  const activeLesson = activeLessonId ? getLessonById(activeLessonId) : null;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isModal ? '900px' : '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Active Lesson Modal / Viewer */}
      {activeLesson && (
        <div style={{ marginBottom: '8px' }}>
          <TutorialPlayer
            lesson={activeLesson}
            totalLessons={TUTORIAL_LESSONS.length}
            onClose={() => setActiveLessonId(null)}
            onSelectLesson={(order) => {
              const next = TUTORIAL_LESSONS.find(l => l.order === order);
              if (next) setActiveLessonId(next.id);
            }}
            onLaunchPractice={onLaunchPractice}
          />
        </div>
      )}

      {/* Overview & Progress Header */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e3fd8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Interactive Onboarding
              </span>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#eff6ff', color: '#1e3fd8', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                {completedCount} of {TUTORIAL_LESSONS.length} Completed
              </span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0', fontFamily: 'var(--font-heading)' }}>
              Learn Tracewise
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#64748b', margin: '4px 0 0' }}>
              Master circuit building, virtual Arduino firmware execution, and presentation design with interactive tutorials.
            </p>
          </div>

          {onLaunchPractice && (
            <button
              type="button"
              onClick={onLaunchPractice}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: 'linear-gradient(135deg, #1e3fd8 0%, #0284c7 100%)',
                background: '#1e3fd8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(30, 63, 216, 0.28)'
              }}
            >
              <Sparkles size={15} />
              <span>Build Your First Circuit (Practice)</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#1e3fd8',
              borderRadius: '9999px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Grid of 8 Tutorial Lessons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {TUTORIAL_LESSONS.map((lesson) => {
          const isDone = progress.completedLessons?.includes(lesson.id);
          const isActive = activeLessonId === lesson.id;

          return (
            <div
              key={lesson.id}
              style={{
                padding: '20px',
                backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                borderRadius: '16px',
                border: isActive ? '2px solid #1e3fd8' : (isDone ? '1px solid #bbf7d0' : '1px solid rgba(226, 232, 240, 0.95)'),
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'all 0.18s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                    LESSON {lesson.order}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        backgroundColor: lesson.difficulty === 'Beginner' ? '#f0fdf4' : '#eff6ff',
                        color: lesson.difficulty === 'Beginner' ? '#166534' : '#1e40af',
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}
                    >
                      {lesson.difficulty}
                    </span>
                    {isDone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                        <CheckCircle2 size={13} />
                        Done
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                  {lesson.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  {lesson.shortDescription}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {lesson.duration}
                </span>

                <button
                  type="button"
                  onClick={() => handleStartLesson(lesson.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: isDone ? '#f1f5f9' : '#1e3fd8',
                    color: isDone ? '#1e293b' : '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {isDone ? <RotateCcw size={12} /> : <Play size={12} />}
                  <span>{isDone ? 'Replay' : (isActive ? 'Playing...' : 'Watch Tutorial')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
