import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

const LOCAL_GUEST_STORAGE_KEY = 'tracewise_guest_session_v1';

/**
 * Ensures email redirects in production strictly use the live canonical domain
 * instead of accidentally falling back to localhost or unpermitted origins.
 */
export const getCanonicalRedirectUrl = (path = '/app') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // In production or on Vercel preview environments, always use canonical production origin
    if (origin.includes('tracewise') || origin.includes('vercel.app')) {
      return `https://tracewise-nine.vercel.app${cleanPath}`;
    }
    // Only in explicit local development on localhost, use localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return `${origin}${cleanPath}`;
    }
    return `https://tracewise-nine.vercel.app${cleanPath}`;
  }
  return `https://tracewise-nine.vercel.app${cleanPath}`;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authNotification, setAuthNotification] = useState(null);

  const clearAuthNotification = () => setAuthNotification(null);

  // Helper to normalize Supabase auth user + profile into app user shape
  const buildUserProfile = async (supabaseUser) => {
    if (!supabaseUser) return null;

    const isAnonymous = Boolean(supabaseUser.is_anonymous);

    if (isAnonymous) {
      return {
        uid: supabaseUser.id,
        displayName: 'Guest',
        handle: 'guest_' + supabaseUser.id.substring(0, 6),
        bio: 'Exploring circuits and projects on Tracewise as a guest visitor.',
        skills: [],
        avatarUrl: null,
        isAnonymous: true,
        joinedAt: 'Today',
        privacy: { showProjects: true }
      };
    }

    // Attempt to load profile from PostgreSQL `profiles` table
    try {
      if (supabase) {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (profile && !profileErr) {
          return {
            uid: supabaseUser.id,
            email: supabaseUser.email,
            displayName: profile.display_name || supabaseUser.user_metadata?.display_name || 'Student Maker',
            handle: profile.handle || 'student_' + supabaseUser.id.substring(0, 6),
            bio: profile.bio || '',
            skills: profile.skills || [],
            avatarUrl: profile.avatar_url || supabaseUser.user_metadata?.avatar_url || null,
            linkedinUrl: profile.linkedin_url || null,
            isAnonymous: false,
            joinedAt: profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent',
            privacy: profile.privacy || { showProjects: true }
          };
        }
      }
    } catch (err) {
      console.warn('Profile fetch from Supabase failed, falling back to metadata:', err);
    }

    // Fallback to auth metadata
    const meta = supabaseUser.user_metadata || {};
    return {
      uid: supabaseUser.id,
      email: supabaseUser.email,
      displayName: meta.display_name || meta.full_name || 'Student Maker',
      handle: meta.handle || 'student_' + supabaseUser.id.substring(0, 6),
      bio: 'Electronics explorer building and debugging circuits on Tracewise.',
      skills: ['Arduino', 'Circuit Design'],
      avatarUrl: meta.avatar_url || null,
      isAnonymous: false,
      joinedAt: 'Recent',
      privacy: { showProjects: true }
    };
  };

  useEffect(() => {
    let authListener = null;

    async function initAuth() {
      setIsLoading(true);

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw sessionErr;

          if (session?.user) {
            const profile = await buildUserProfile(session.user);
            setUser(profile);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.warn('Supabase session initialization note:', err.message);
          setUser(null);
        }

        // Check for auth callback parameters in hash or search query
        try {
          const hash = window.location.hash || '';
          const search = window.location.search || '';
          const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : '');
          const searchParams = new URLSearchParams(search.startsWith('?') ? search.substring(1) : '');

          const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
          const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
          const authType = hashParams.get('type') || searchParams.get('type');

          if (errorDesc || errorCode) {
            const decoded = decodeURIComponent(errorDesc || 'Email confirmation link has expired or is invalid.');
            setError(decoded);
            setAuthNotification({
              type: 'error',
              message: decoded
            });
          } else if (authType === 'signup') {
            setAuthNotification({
              type: 'success',
              message: 'Your email address has been confirmed successfully! Welcome to Tracewise.'
            });
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } catch (e) {
          console.warn('Auth callback parameter check note:', e);
        }

        // Listen for Supabase session changes
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const profile = await buildUserProfile(session.user);
            setUser(profile);
            if (event === 'SIGNED_IN') {
              // Ensure error state is cleared upon successful sign in
              setError(null);
            }
          } else {
            setUser(null);
          }
          setIsLoading(false);
        });
        authListener = data.subscription;
      } else {
        // Fallback for unconfigured/offline environment: check if explicit guest session exists
        try {
          const localGuest = localStorage.getItem(LOCAL_GUEST_STORAGE_KEY);
          if (localGuest) {
            setUser(JSON.parse(localGuest));
          } else {
            // Visitors start signed-out by default (no automatic fake persona)
            setUser(null);
          }
        } catch (e) {
          console.warn('Local guest check failed:', e);
          setUser(null);
        }
      }

      setIsLoading(false);
    }

    initAuth();

    return () => {
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  // 1. One-click Continue as Guest
  const continueAsGuest = async () => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;
        const profile = await buildUserProfile(data.user);
        setUser(profile);
        return profile;
      } catch (err) {
        console.warn('Supabase anonymous sign in note (falling back to local guest session):', err.message);
        // If Anonymous sign-in provider is disabled in Supabase dashboard, fall back to seamless local guest session
        const guestUser = {
          uid: 'guest_' + Math.random().toString(36).substring(2, 10),
          displayName: 'Guest',
          handle: 'guest_' + Math.random().toString(36).substring(2, 6),
          bio: 'Exploring circuits and projects on Tracewise as a guest visitor.',
          skills: [],
          avatarUrl: null,
          isAnonymous: true,
          joinedAt: 'Today',
          privacy: { showProjects: true }
        };
        setUser(guestUser);
        try {
          localStorage.setItem(LOCAL_GUEST_STORAGE_KEY, JSON.stringify(guestUser));
        } catch (e) {}
        return guestUser;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local guest session when backend is in preview/unconfigured mode
      const guestUser = {
        uid: 'guest_' + Math.random().toString(36).substring(2, 10),
        displayName: 'Guest',
        handle: 'guest_' + Math.random().toString(36).substring(2, 6),
        bio: 'Exploring circuits and projects on Tracewise as a guest visitor.',
        skills: [],
        avatarUrl: null,
        isAnonymous: true,
        joinedAt: 'Today',
        privacy: { showProjects: true }
      };
      setUser(guestUser);
      try {
        localStorage.setItem(LOCAL_GUEST_STORAGE_KEY, JSON.stringify(guestUser));
      } catch (e) {
        console.warn('Storage save failed:', e);
      }
      setIsLoading(false);
      return guestUser;
    }
  };

  // Backwards compatibility alias for components calling signInAsStudentDemo
  const signInAsStudentDemo = continueAsGuest;

  // 2. Sign In with Google
  const signInWithGoogle = async () => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getCanonicalRedirectUrl('/app')
          }
        });
        if (oauthErr) throw oauthErr;
        return data;
      } catch (err) {
        console.error('Google sign in error:', err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      setIsLoading(false);
      throw new Error('Supabase is not configured. Please connect your Supabase project.');
    }
  };

  // 3. Sign In with Email
  const signInWithEmail = async (email, password) => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInErr) throw signInErr;
        const profile = await buildUserProfile(data.user);
        setUser(profile);
        return profile;
      } catch (err) {
        console.error('Email sign in error:', err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Supabase is not configured yet.');
      setIsLoading(false);
      throw new Error('Supabase is not configured.');
    }
  };

  // 4. Sign Up with Email
  const signUpWithEmail = async (email, password, displayName, handle) => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        // Enforce lowercase handle
        const cleanHandle = (handle || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName || 'Student Maker',
              handle: cleanHandle
            },
            emailRedirectTo: getCanonicalRedirectUrl('/app')
          }
        });
        if (signUpErr) throw signUpErr;

        if (data?.session && data?.user) {
          // If session is returned immediately (email confirmation disabled or auto-confirmed)
          const profile = await buildUserProfile(data.user);
          setUser(profile);
          return { user: profile, session: data.session, confirmationPending: false };
        } else if (data?.user) {
          // Email verification is required before permanent sign in
          setUser(null);
          return { user: data.user, session: null, confirmationPending: true };
        }
        return { user: null, session: null, confirmationPending: false };
      } catch (err) {
        console.error('Sign up error:', err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Supabase is not configured yet.');
      setIsLoading(false);
      throw new Error('Supabase is not configured.');
    }
  };

  // 5. Upgrade Guest to Permanent Account (Email & Password)
  const upgradeGuestAccount = async ({ email, password, displayName, handle }) => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const cleanHandle = (handle || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        // If active session is an anonymous Supabase user, update user credentials
        if (supabase.auth.getUser) {
          const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
          if (currentAuthUser?.is_anonymous) {
            const { data, error: updateErr } = await supabase.auth.updateUser({
              email: email.trim(),
              password,
              data: {
                display_name: displayName || 'Student Maker',
                handle: cleanHandle
              }
            });
            if (updateErr) throw updateErr;
            if (data?.user) {
              const profile = await buildUserProfile(data.user);
              setUser(profile);
              return { user: profile, confirmationPending: !data.session };
            }
          }
        }

        // Otherwise (local guest session), register as permanent email account
        return await signUpWithEmail(email, password, displayName, cleanHandle);
      } catch (err) {
        console.error('Account upgrade error:', err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      // In offline mode, upgrade local guest to named account
      const upgraded = {
        uid: 'user_' + Math.random().toString(36).substring(2, 9),
        displayName: displayName || 'Student Maker',
        handle: handle || 'student_' + Math.floor(100 + Math.random() * 900),
        bio: 'Electronics explorer building and debugging circuits on Tracewise.',
        skills: ['Arduino Uno', 'Circuit Simulation'],
        isAnonymous: false,
        joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        privacy: { showProjects: true }
      };
      setUser(upgraded);
      try {
        localStorage.removeItem(LOCAL_GUEST_STORAGE_KEY);
      } catch (e) {}
      setIsLoading(false);
      return { user: upgraded, confirmationPending: false };
    }
  };

  // 6. Reset Password via Email
  const resetPassword = async (email) => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getCanonicalRedirectUrl('/reset-password')
        });
        if (resetErr) throw resetErr;
        return { success: true };
      } catch (err) {
        console.error('Password reset request error:', err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Supabase is not configured.');
      setIsLoading(false);
      throw new Error('Supabase is not configured.');
    }
  };

  // 7. Update Password (from Recovery Session)
  const updatePassword = async (newPassword) => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error: updateErr } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (updateErr) throw updateErr;
        return data;
      } catch (err) {
        console.error('Update password error:', err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Supabase is not configured.');
      setIsLoading(false);
      throw new Error('Supabase is not configured.');
    }
  };

  // 6. Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_GUEST_STORAGE_KEY);
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  // 7. Update Profile
  const updateProfile = async (updatedFields) => {
    if (!user) return null;

    try {
      const cleanHandle = updatedFields.handle
        ? updatedFields.handle.toLowerCase().trim().replace(/[^a-z0-9_]/g, '')
        : user.handle;

      if (isSupabaseConfigured() && supabase && !user.isAnonymous) {
        const updatePayload = {
          display_name: updatedFields.displayName || user.displayName,
          handle: cleanHandle,
          bio: updatedFields.bio ?? user.bio,
          skills: updatedFields.skills || user.skills,
          avatar_url: updatedFields.avatarUrl ?? user.avatarUrl,
          linkedin_url: updatedFields.linkedinUrl !== undefined ? (updatedFields.linkedinUrl ? updatedFields.linkedinUrl.trim() : null) : (user.linkedinUrl || null),
          updated_at: new Date().toISOString()
        };

        const { error: updateErr } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.uid);

        if (updateErr) {
          if (updateErr.code === '23505') {
            throw new Error(`The handle "@${cleanHandle}" is already taken by another maker.`);
          }
          throw updateErr;
        }
      }

      const updatedUser = {
        ...user,
        displayName: updatedFields.displayName || user.displayName,
        handle: cleanHandle,
        bio: updatedFields.bio ?? user.bio,
        skills: updatedFields.skills || user.skills,
        avatarUrl: updatedFields.avatarUrl ?? user.avatarUrl,
        linkedinUrl: updatedFields.linkedinUrl !== undefined ? (updatedFields.linkedinUrl ? updatedFields.linkedinUrl.trim() : null) : user.linkedinUrl
      };

      setUser(updatedUser);
      if (user.isAnonymous) {
        try {
          localStorage.setItem(LOCAL_GUEST_STORAGE_KEY, JSON.stringify(updatedUser));
        } catch (e) {}
      }
      return updatedUser;
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isGuest: Boolean(user?.isAnonymous),
    isLoading,
    error,
    authNotification,
    clearAuthNotification,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
    continueAsGuest,
    signInAsStudentDemo,
    upgradeGuestAccount,
    signOut,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
