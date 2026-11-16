import React, { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus, Shield, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/useAuthStore';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsStudentDemo, error: authError } = useAuth();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setFormError(null);
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      if (tab === 'signin') {
        await signInWithEmail(email, password);
      } else {
        if (!handle || handle.length < 3) {
          setFormError('Handle must be at least 3 characters.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName, handle);
      }
      onClose();
    } catch (err) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    signInAsStudentDemo();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(7, 24, 49, 0.72)',
        backdropFilter: 'blur(8px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(7, 24, 49, 0.45)',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TracewiseBubbleArea theme="light">
          {/* Header */}
          <div style={{ padding: '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--tw-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--tw-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-brand)' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                  {tab === 'signin' ? 'Welcome Back' : 'Create Student Profile'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', margin: 0 }}>
                  Tracewise Engineering Community
                </p>
              </div>
            </div>

            <TracewiseBubbleIconButton
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </TracewiseBubbleIconButton>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px' }}>
            {/* Tab switch */}
            <div style={{ display: 'flex', background: 'var(--tw-bg)', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setTab('signin')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: tab === 'signin' ? '#ffffff' : 'transparent',
                  color: tab === 'signin' ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                  boxShadow: tab === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: tab === 'signup' ? '#ffffff' : 'transparent',
                  color: tab === 'signup' ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                  boxShadow: tab === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error banner */}
            {(formError || authError) && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{formError || authError}</span>
              </div>
            )}

            {/* One-click Student Demo Pass */}
            <button
              type="button"
              onClick={handleDemoSignIn}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px dashed var(--tw-brand)',
                backgroundColor: 'rgba(30, 63, 216, 0.05)',
                color: 'var(--tw-brand)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 63, 216, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 63, 216, 0.05)')}
            >
              <Sparkles size={16} />
              <span>One-Click Student Demo (Alex Rivera)</span>
            </button>

            {/* Google Sign In */}
            <TracewiseBubbleButton
              onClick={handleGoogleSignIn}
              variant="secondary"
              style={{
                width: '100%',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px',
                backgroundColor: '#ffffff'
              }}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </TracewiseBubbleButton>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0', color: 'var(--tw-text-muted)', fontSize: '0.78rem' }}>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--tw-border)' }} />
              <span>or email</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--tw-border)' }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tab === 'signup' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--tw-border)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Unique Handle
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', color: 'var(--tw-text-muted)', fontSize: '0.9rem' }}>@</span>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="alex_circuits"
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 26px',
                          borderRadius: '10px',
                          border: '1px solid var(--tw-border)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@school.edu"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <TracewiseBubbleButton
                type="submit"
                variant="primary"
                style={{ width: '100%', marginTop: '6px' }}
                disabled={loading}
              >
                <span>{tab === 'signin' ? 'Sign In' : 'Create Profile'}</span>
              </TracewiseBubbleButton>
            </form>

            {/* Privacy note */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--tw-border)', display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--tw-text-muted)', fontSize: '0.74rem', lineHeight: 1.45 }}>
              <Shield size={14} color="var(--tw-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <b>Student Privacy Safeguard:</b> Tracewise does not display personal emails, precise locations, or require real names. Community posts remain content-focused.
              </span>
            </div>
          </div>
        </TracewiseBubbleArea>
      </div>
    </div>
  );
}
