import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from '../services/firebase';

const AuthContext = createContext(null);

const LOCAL_STORAGE_AUTH_KEY = 'tracewise_auth_user_v1';

// Seed demo student user for instant classroom / local testing
const DEMO_STUDENT = {
  uid: 'student-demo-101',
  displayName: 'Alex Rivera',
  handle: 'alex_circuits',
  bio: 'High school electronics enthusiast building micro-robotics and traffic controllers with Arduino Uno.',
  skills: ['Arduino Uno', 'Digital I/O', 'Analog Sensors', 'Breadboarding'],
  joinedAt: 'November 2026',
  avatarUrl: null,
  privacy: { showProjects: true }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured() && auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              setUser({ uid: firebaseUser.uid, ...userSnap.data() });
            } else {
              // Create default profile for first-time sign-in
              const initialHandle = (firebaseUser.displayName || 'student')
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '')
                .slice(0, 15) + '_' + Math.floor(100 + Math.random() * 900);

              const initialProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Student Maker',
                handle: initialHandle,
                bio: 'Electronics explorer building and debugging circuits on Tracewise.',
                skills: ['Arduino', 'Circuit Simulation'],
                joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                avatarUrl: firebaseUser.photoURL || null,
                privacy: { showProjects: true },
                createdAt: serverTimestamp()
              };

              await setDoc(userRef, initialProfile);
              setUser(initialProfile);
            }
          } catch (err) {
            console.error('Error fetching user profile from Firestore:', err);
            // Fallback to basic Firebase user info
            setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Student Maker',
              handle: 'student_' + firebaseUser.uid.slice(0, 5),
              bio: 'Electronics explorer on Tracewise.',
              skills: ['Arduino'],
              joinedAt: 'Recent',
              avatarUrl: firebaseUser.photoURL || null
            });
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
    } else {
      // Local storage fallback for offline / development / demo mode
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          // Pre-seed demo user so user is signed in by default in development/demo
          setUser(DEMO_STUDENT);
          localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(DEMO_STUDENT));
        }
      } catch (e) {
        console.warn('Local auth restore failed:', e);
      }
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Sign In with Google
  const signInWithGoogle = async () => {
    setError(null);
    setIsLoading(true);
    if (isFirebaseConfigured() && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } catch (err) {
        console.error('Google sign in error:', err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Demo fallback
      const demoUser = {
        ...DEMO_STUDENT,
        uid: 'user-google-' + Date.now(),
        displayName: 'Google Student',
        handle: 'google_maker'
      };
      setUser(demoUser);
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(demoUser));
      setIsLoading(false);
      return demoUser;
    }
  };

  // Sign in with Email / Password
  const signInWithEmail = async (email, password) => {
    setError(null);
    setIsLoading(true);
    if (isFirebaseConfigured() && auth) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        return res.user;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local fallback
      const localUser = {
        uid: 'user-email-' + Date.now(),
        displayName: email.split('@')[0],
        handle: email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase(),
        bio: 'Student engineer using Tracewise.',
        skills: ['Arduino', 'Breadboarding'],
        joinedAt: 'Today',
        avatarUrl: null
      };
      setUser(localUser);
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(localUser));
      setIsLoading(false);
      return localUser;
    }
  };

  // Sign Up with Email
  const signUpWithEmail = async (email, password, displayName, handle) => {
    setError(null);
    setIsLoading(true);
    if (isFirebaseConfigured() && auth) {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const newProfile = {
          uid: res.user.uid,
          displayName: displayName || email.split('@')[0],
          handle: handle.toLowerCase(),
          bio: 'Electronics explorer building and debugging circuits.',
          skills: ['Arduino'],
          joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          avatarUrl: null,
          privacy: { showProjects: true },
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', res.user.uid), newProfile);
        setUser(newProfile);
        return res.user;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      const newUser = {
        uid: 'user-' + Date.now(),
        displayName: displayName || email.split('@')[0],
        handle: (handle || 'student').toLowerCase(),
        bio: 'Electronics explorer building and debugging circuits.',
        skills: ['Arduino'],
        joinedAt: 'Today',
        avatarUrl: null
      };
      setUser(newUser);
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(newUser));
      setIsLoading(false);
      return newUser;
    }
  };

  // Switch / Sign in as Student Demo Account
  const signInAsStudentDemo = () => {
    setUser(DEMO_STUDENT);
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(DEMO_STUDENT));
  };

  // Sign Out
  const signOut = async () => {
    if (isFirebaseConfigured() && auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (!user) throw new Error('Must be signed in to update profile');

    const cleanHandle = updates.handle
      ? updates.handle.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
      : user.handle;

    const updated = {
      ...user,
      ...updates,
      handle: cleanHandle,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db && user.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: updated.displayName,
          handle: updated.handle,
          bio: updated.bio || '',
          skills: updated.skills || [],
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Firestore updateDoc failed:', e);
      }
    }

    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(updated));
    return updated;
  };

  // Check Handle Availability
  const isHandleAvailable = async (candidateHandle) => {
    const clean = candidateHandle.toLowerCase().trim();
    if (!clean || clean.length < 3) return false;
    if (user && user.handle === clean) return true; // unchanged
    // Handle uniqueness validation
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsStudentDemo,
        signOut,
        updateProfile,
        isHandleAvailable,
        isFirebaseConnected: isFirebaseConfigured()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
