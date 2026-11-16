import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_PREP_PREFIX = 'tracewise_pitch_prep_';

export async function getPitchPreparation(projectId, user) {
  if (!projectId) return null;

  // 1. If user is authenticated & permanent, try Supabase first
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
          pitches: data.pitches || {}
        };
      }
    } catch (err) {
      console.warn('Supabase pitch prep load note:', err.message);
    }
  }

  // 2. Local storage fallback (for guests or offline)
  try {
    const raw = localStorage.getItem(`${LOCAL_PREP_PREFIX}${projectId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function savePitchPreparation(projectId, { brief, pitches }, user) {
  if (!projectId) return false;

  const payload = {
    brief: brief || {},
    pitches: pitches || {}
  };

  // 1. If user is authenticated & permanent, save to Supabase
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
        console.warn('Supabase pitch prep save warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase pitch prep save error:', err);
    }
  }

  // 2. Always persist locally for instant availability and guest sessions
  try {
    localStorage.setItem(`${LOCAL_PREP_PREFIX}${projectId}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('Local pitch prep save failed:', e);
  }

  return true;
}
