import { supabase, isSupabaseConfigured } from './supabase';

const LEGACY_PREP_PREFIX = 'tracewise_pitch_prep_';

function getStorageScope(user) {
  if (!user) return 'anon';
  if (user.isAnonymous) return `guest_${user.uid || 'anon'}`;
  return `user_${user.uid}`;
}

function getScopedKey(prefix, projectId, user) {
  const scope = getStorageScope(user);
  return `${prefix}${scope}_${projectId}`;
}

// -----------------------------------------------------------------------------
// PITCH PREPARATION (Briefs + 30s/60s/120s Pitches)
// -----------------------------------------------------------------------------

export async function getPitchPreparation(projectId, user) {
  if (!projectId) return null;

  // 1. If permanent account & Supabase active, load from cloud
  if (user && !user.isAnonymous && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('pitch_preparations')
        .select('*')
        .eq('user_id', user.uid)
        .eq('project_id', projectId)
        .single();

      if (!error && data) {
        return {
          brief: data.brief || {},
          pitches: data.pitches || {},
          slides: data.brief?._presentationSlides || [],
          source: 'supabase'
        };
      }
    } catch (err) {
      console.warn('Supabase pitch prep load note:', err.message);
    }
  }

  // 2. Scoped local storage (with fallback to legacy key)
  try {
    const scopedKey = getScopedKey('tw_prep_', projectId, user);
    let raw = localStorage.getItem(scopedKey);
    if (!raw) {
      raw = localStorage.getItem(`${LEGACY_PREP_PREFIX}${projectId}`);
    }
    return raw ? { ...JSON.parse(raw), source: 'local' } : null;
  } catch (e) {
    return null;
  }
}

export async function savePitchPreparation(projectId, { brief, pitches, slides }, user) {
  if (!projectId) return { success: false, status: 'error', message: 'Missing project ID' };

  const enrichedBrief = {
    ...(brief || {}),
    ...(slides ? { _presentationSlides: slides } : {})
  };

  const payload = {
    brief: enrichedBrief,
    pitches: pitches || {},
    slides: slides || []
  };

  let cloudSuccess = false;
  let cloudError = null;

  // 1. Permanent account -> Sync to Supabase
  if (user && !user.isAnonymous && isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('pitch_preparations')
        .upsert(
          {
            user_id: user.uid,
            project_id: projectId,
            brief: payload.brief,
            pitches: payload.pitches,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,project_id' }
        );

      if (error) {
        cloudError = error.message;
        console.warn('Supabase pitch prep sync error:', error.message);
      } else {
        cloudSuccess = true;
      }
    } catch (err) {
      cloudError = err.message;
      console.warn('Supabase pitch prep sync exception:', err);
    }
  }

  // 2. Always persist locally in scoped storage to prevent work loss
  try {
    const scopedKey = getScopedKey('tw_prep_', projectId, user);
    localStorage.setItem(scopedKey, JSON.stringify(payload));
  } catch (e) {
    console.warn('Local pitch prep save failed:', e);
  }

  if (cloudSuccess) {
    return { success: true, status: 'synced', message: 'Synced to Supabase' };
  } else if (cloudError) {
    return { success: true, status: 'sync_failed', message: `Sync failed (${cloudError}); saved locally` };
  } else {
    return { success: true, status: 'local_only', message: 'Saved locally in browser' };
  }
}

// -----------------------------------------------------------------------------
// PITCH QUESTIONS (Saved Custom/Refined Judge Questions)
// -----------------------------------------------------------------------------

export async function getPitchQuestions(projectId, user) {
  if (!projectId) return [];

  if (user && !user.isAnonymous && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('pitch_questions')
        .select('*')
        .eq('user_id', user.uid)
        .eq('project_id', projectId)
        .single();

      if (!error && data?.questions) {
        return data.questions;
      }
    } catch (err) {
      console.warn('Supabase pitch questions load note:', err.message);
    }
  }

  try {
    const scopedKey = getScopedKey('tw_questions_', projectId, user);
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function savePitchQuestions(projectId, questions, user) {
  if (!projectId) return false;

  if (user && !user.isAnonymous && isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('pitch_questions')
        .upsert(
          {
            user_id: user.uid,
            project_id: projectId,
            questions: questions || [],
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,project_id' }
        );
    } catch (err) {
      console.warn('Supabase pitch questions save note:', err);
    }
  }

  try {
    const scopedKey = getScopedKey('tw_questions_', projectId, user);
    localStorage.setItem(scopedKey, JSON.stringify(questions || []));
  } catch (e) {}

  return true;
}

// -----------------------------------------------------------------------------
// PITCH ATTEMPTS (Quizzes & Mock Interview Practice)
// -----------------------------------------------------------------------------

export async function recordPitchAttempt(projectId, { attemptType, score, data }, user) {
  if (!projectId) return false;

  const attemptRecord = {
    projectId,
    attemptType,
    score: score ?? null,
    data: data || {},
    createdAt: new Date().toISOString()
  };

  if (user && !user.isAnonymous && isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('pitch_attempts')
        .insert({
          user_id: user.uid,
          project_id: projectId,
          attempt_type: attemptType,
          score: score ?? null,
          data: data || {}
        });
    } catch (err) {
      console.warn('Supabase pitch attempt save note:', err);
    }
  }

  try {
    const scopedKey = getScopedKey('tw_attempts_', projectId, user);
    const raw = localStorage.getItem(scopedKey);
    const attempts = raw ? JSON.parse(raw) : [];
    attempts.unshift(attemptRecord);
    localStorage.setItem(scopedKey, JSON.stringify(attempts.slice(0, 50)));
  } catch (e) {}

  return true;
}

export async function getPitchAttempts(projectId, user) {
  if (!projectId) return [];

  if (user && !user.isAnonymous && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('pitch_attempts')
        .select('*')
        .eq('user_id', user.uid)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(row => ({
          id: row.id,
          projectId: row.project_id,
          attemptType: row.attempt_type,
          score: row.score,
          data: row.data,
          createdAt: row.created_at
        }));
      }
    } catch (err) {
      console.warn('Supabase pitch attempts load note:', err);
    }
  }

  try {
    const scopedKey = getScopedKey('tw_attempts_', projectId, user);
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
