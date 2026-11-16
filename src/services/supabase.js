import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env?.VITE_SUPABASE_URL || '';
const supabaseKey = env?.VITE_SUPABASE_PUBLISHABLE_KEY || env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('https://')
  );
};

let clientInstance = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'tracewise_supabase_auth'
      }
    });
  } catch (err) {
    console.warn('Supabase client initialization failed:', err);
  }
}

export const supabase = clientInstance;
