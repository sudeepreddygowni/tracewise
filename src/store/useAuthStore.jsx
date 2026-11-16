import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

const LOCAL_GUEST_STORAGE_KEY = 'tracewise_guest_session_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Listen for Supabase session changes
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const profile = await buildUserProfile(session.user);
            setUser(profile);
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
        console.error('Supabase anonymous sign in error:', err);
        setError(err.message);
        throw err;
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
            redirectTo: window.location.origin
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
          email,
          password,
          options: {
            data: {
              display_name: displayName || 'Student Maker',
              handle: cleanHandle
            }
          }
        });
        if (signUpErr) throw signUpErr;

        if (data?.user) {
          // If session is returned immediately (email confirmation disabled or auto-confirmed)
          const profile = await buildUserProfile(data.user);
          setUser(profile);
          return profile;
        }
        return data;
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

  // 5. Upgrade Guest to Permanent Account (Identity Linking / Upgrade)
  const upgradeGuestAccount = async ({ email, password, displayName, handle, provider = 'email' }) => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        if (provider === 'google') {
          // Link Google identity to existing anonymous session
          const { data, error: linkErr } = await supabase.auth.linkIdentity({
            provider: 'google'
          });
          if (linkErr) throw linkErr;
          return data;
        } else {
          // Convert anonymous user to permanent email account
          const { data, error: updateErr } = await supabase.auth.updateUser({
            email,
            password,
            data: {
              display_name: displayName,
              handle: handle?.toLowerCase()
            }
          });
          if (updateErr) throw updateErr;
          const profile = await buildUserProfile(data.user);
          setUser(profile);
          return profile;
        }
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
      return upgraded;
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
        avatarUrl: updatedFields.avatarUrl ?? user.avatarUrl
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
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
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
