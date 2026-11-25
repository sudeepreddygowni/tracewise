/**
 * Tracewise Lightweight & Privacy-Conscious Telemetry Service
 *
 * Implements non-blocking, privacy-preserving event recording for student engineering
 * metrics (circuit creations, simulation success/failures, AI queries, Pitch Lab use).
 *
 * Privacy Guarantees:
 * 1. Zero PII: No passwords, student names, emails, or personal identification stored.
 * 2. Anonymous Session: Uses an ephemeral session token stored in sessionStorage.
 * 3. Non-blocking: Silently absorbs any network or database failures without interrupting users.
 */

import { supabase } from './supabase';

// Ephemeral browser session identifier
let cachedSessionId = null;

function getSessionId() {
  if (cachedSessionId) return cachedSessionId;
  try {
    let sid = sessionStorage.getItem('tw_analytics_session_id');
    if (!sid) {
      sid = 'ses_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem('tw_analytics_session_id', sid);
    }
    cachedSessionId = sid;
    return sid;
  } catch (err) {
    return 'ses_ephemeral_' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Tracks an analytics event to Supabase public.analytics_events
 * @param {string} eventName - e.g. 'app_opened', 'project_saved', 'simulation_started'
 * @param {object} metadata - Structured contextual details (component count, duration, etc.)
 */
export async function trackEvent(eventName, metadata = {}) {
  try {
    const sessionId = getSessionId();

    // Sanitize metadata to avoid unbounded payloads or secret leaks
    const cleanMeta = {};
    if (metadata && typeof metadata === 'object') {
      for (const [k, v] of Object.entries(metadata)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          cleanMeta[k] = v;
        } else if (Array.isArray(v)) {
          cleanMeta[k] = v.length;
        } else if (v && typeof v === 'object') {
          cleanMeta[k] = Object.keys(v).length;
        }
      }
    }

    // Get current auth state if any (non-blocking)
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id) {
        userId = user.id;
      }
    } catch {
      // Unauthenticated / guest session
    }

    // Insert event
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      user_id: userId,
      session_id: sessionId,
      metadata: cleanMeta
    });
  } catch (err) {
    // Non-blocking telemetry: never throw errors into user space
    if (import.meta.env?.DEV) {
      console.debug('[Analytics non-blocking failure]', err?.message);
    }
  }
}

// Convenient helper functions
export const Analytics = {
  appOpened: () => trackEvent('app_opened'),
  projectCreated: (projectId, title) => trackEvent('project_created', { projectId, title }),
  projectSaved: (projectId, componentCount, wireCount) => trackEvent('project_saved', { projectId, componentCount, wireCount }),
  componentAdded: (componentType) => trackEvent('component_added', { componentType }),
  wireAdded: (color) => trackEvent('wire_added', { color }),
  simulationStarted: (firmwareLength) => trackEvent('simulation_started', { firmwareLength }),
  simulationSucceeded: (durationMs) => trackEvent('simulation_succeeded', { durationMs }),
  simulationFailed: (reason) => trackEvent('simulation_failed', { reason: String(reason).slice(0, 80) }),
  assistantQueried: (task) => trackEvent('assistant_queried', { task }),
  pitchLabOpened: (projectId) => trackEvent('pitch_lab_opened', { projectId }),
  presentationGenerated: (gradeLevel) => trackEvent('presentation_generated', { gradeLevel })
};
