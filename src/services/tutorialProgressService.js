/**
 * Tracewise Tutorial & Onboarding Progress Service
 *
 * Lightweight, client-first persistence for onboarding preferences,
 * lesson completion states, and active practice steps.
 *
 * Storage Strategy:
 * - Guests & default: localStorage key 'tw_tutorial_progress_v1'
 * - Reactive updates via custom window events
 * - Zero security-sensitive data stored
 */

const STORAGE_KEY = 'tw_tutorial_progress_v1';

export const EXPERIENCE_LEVELS = {
  BEGINNER: 'new_to_electronics',
  INTERMEDIATE: 'know_basics',
  ADVANCED: 'build_arduino'
};

const DEFAULT_STATE = {
  welcomeDismissed: false,
  experienceLevel: null,
  completedLessons: [],
  lastOpenedLesson: 'dashboard',
  practiceCompleted: false,
  practiceStep: 1,
  savedAt: null
};

export function getTutorialProgress(userId = null) {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : []
    };
  } catch (err) {
    console.warn('[TutorialProgress] Read failed, returning default:', err?.message);
    return { ...DEFAULT_STATE };
  }
}

export function saveTutorialProgress(updates, userId = null) {
  try {
    const current = getTutorialProgress(userId);
    const updated = {
      ...current,
      ...updates,
      savedAt: new Date().toISOString()
    };
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(updated));

    // Also update generic key if user is logged in so guest state stays synced
    if (userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tracewise:tutorial_progress_updated', {
        detail: updated
      }));
    }
    return updated;
  } catch (err) {
    console.warn('[TutorialProgress] Save failed:', err?.message);
    return null;
  }
}

export function markLessonCompleted(lessonId, userId = null) {
  if (!lessonId) return;
  const current = getTutorialProgress(userId);
  if (!current.completedLessons.includes(lessonId)) {
    const nextCompleted = [...current.completedLessons, lessonId];
    return saveTutorialProgress({ completedLessons: nextCompleted, lastOpenedLesson: lessonId }, userId);
  }
  return current;
}

export function setExperienceLevel(level, userId = null) {
  return saveTutorialProgress({ experienceLevel: level }, userId);
}

export function dismissWelcome(userId = null) {
  return saveTutorialProgress({ welcomeDismissed: true }, userId);
}

export function resetTutorialProgress(userId = null) {
  const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  try {
    localStorage.removeItem(key);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tracewise:tutorial_progress_updated', {
        detail: DEFAULT_STATE
      }));
    }
  } catch {}
  return DEFAULT_STATE;
}

export function markPracticeStepCompleted(stepId, userId = null) {
  if (!stepId) return;
  const current = getTutorialProgress(userId);
  const practiceSteps = { ...(current.practiceSteps || {}), [stepId]: true };
  return saveTutorialProgress({ practiceSteps }, userId);
}

export function markPracticeCompleted(userId = null) {
  return saveTutorialProgress({ practiceCompleted: true }, userId);
}

export const tutorialProgressService = {
  getProgress: getTutorialProgress,
  getTutorialProgress,
  saveProgress: saveTutorialProgress,
  saveTutorialProgress,
  markLessonCompleted,
  setExperienceLevel,
  dismissWelcome,
  isWelcomeDismissed: () => getTutorialProgress().welcomeDismissed,
  resetProgress: resetTutorialProgress,
  markPracticeStepCompleted,
  markPracticeCompleted
};
