import React, { useState } from 'react';
import { X, Sparkles, User, Shield, AlertCircle, ArrowRight, Compass, Mail, CheckCircle2, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../../store/useAuthStore';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function AuthModal({ isOpen, onClose }) {
  const {
    isGuest,
    continueAsGuest,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    upgradeGuestAccount,
    error: authError
  } = useAuth();

  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const resetFormState = () => {
    setFormError(null);
    setConfirmationPending(false);
    setResetSent(false);
  };

  const handleGuestAccess = async () => {
    try {
      setLoading(true);
      resetFormState();
      await continueAsGuest();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Guest sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // 1. FORGOT PASSWORD FLOW
    if (tab === 'forgot') {
      try {
        setLoading(true);
        await resetPassword(cleanEmail);
        setResetSent(true);
      } catch (err) {
        setFormError(err.message || 'Unable to send reset email. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. PASSWORD VALIDATION FOR SIGNIN / SIGNUP / UPGRADE
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      // 3. GUEST UPGRADE FLOW
      if (isGuest) {
        const cleanHandle = (handle || cleanEmail.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        if (cleanHandle.length < 3) {
          setFormError('Handle must be at least 3 characters.');
          setLoading(false);
          return;
        }

        const res = await upgradeGuestAccount({
          email: cleanEmail,
          password,
          displayName: displayName.trim() || 'Student Maker',
          handle: cleanHandle
        });

        if (res?.confirmationPending) {
          setConfirmationPending(true);
        } else {
          onClose();
        }
        return;
      }

      // 4. SIGN IN FLOW
      if (tab === 'signin') {
        await signInWithEmail(cleanEmail, password);
        onClose();
        return;
      }

      // 5. SIGN UP FLOW
      if (tab === 'signup') {
        const cleanHandle = (handle || cleanEmail.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        if (cleanHandle.length < 3) {
          setFormError('Handle must be at least 3 characters (letters, numbers, underscore).');
          setLoading(false);
          return;
        }

        const res = await signUpWithEmail(cleanEmail, password, displayName.trim(), cleanHandle);
        if (res?.confirmationPending) {
          setConfirmationPending(true);
        } else {
          onClose();
        }
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
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
          maxWidth: '460px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(7, 24, 49, 0.45)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TracewiseBubbleArea theme="light">
          {/* Header */}
          <div style={{ padding: '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--tw-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: 'var(--tw-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-brand)' }}>
                {isGuest ? <Sparkles size={20} /> : <User size={20} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  {isGuest
                    ? 'Save Your Account'
                    : tab === 'forgot'
                    ? 'Reset Password'
                    : tab === 'signin'
                    ? 'Sign In with Email'
                    : 'Create Account with Email'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', margin: 0 }}>
                  {isGuest
                    ? 'Upgrade to a permanent student profile'
                    : tab === 'forgot'
                    ? 'We will send a recovery link to your inbox'
                    : 'Student electronics engineering platform'}
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
            {/* Confirmation Pending Screen */}
            {confirmationPending ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(30, 63, 216, 0.08)', color: 'var(--tw-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Mail size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
                  Check your email to verify your account
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55, margin: '0 0 20px' }}>
                  We sent a confirmation link to <b>{email}</b>. Click the link in your inbox to complete verification and activate your permanent student profile.
                </p>
                <div style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: 'var(--tw-bg)', fontSize: '0.78rem', color: 'var(--tw-text-muted)', marginBottom: '20px' }}>
                  Didn't receive an email? Check your spam or promotions folder.
                </div>
                <TracewiseBubbleButton
                  onClick={() => {
                    setConfirmationPending(false);
                    setTab('signin');
                  }}
                  variant="primary"
                  style={{ width: '100%' }}
                >
                  <span>Return to Sign In</span>
                </TracewiseBubbleButton>
              </div>
            ) : resetSent ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f0fdf4', color: 'var(--tw-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
                  Recovery Link Sent
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55, margin: '0 0 20px' }}>
                  If an account exists for <b>{email}</b>, you will receive password reset instructions shortly.
                </p>
                <TracewiseBubbleButton
                  onClick={() => {
                    setResetSent(false);
                    setTab('signin');
                  }}
                  variant="primary"
                  style={{ width: '100%' }}
                >
                  <span>Back to Sign In</span>
                </TracewiseBubbleButton>
              </div>
            ) : (
              <>
                {/* Error banner */}
                {(formError || authError) && (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError || authError}</span>
                  </div>
                )}

                {/* 1-Click Guest Exploration Option (Shown when not already a guest and not in forgot mode) */}
                {!isGuest && tab !== 'forgot' && (
                  <div style={{ marginBottom: '18px' }}>
                    <button
                      type="button"
                      onClick={handleGuestAccess}
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: '1.5px dashed var(--tw-brand)',
                        backgroundColor: 'rgba(30, 63, 216, 0.04)',
                        color: 'var(--tw-brand)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 63, 216, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 63, 216, 0.04)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Compass size={18} color="var(--tw-brand)" />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Continue as Guest</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', fontWeight: 500 }}>
                            Explore Studio, circuit simulations & Pitch Lab without signing in
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* Tab switch (only if not guest upgrading and not in forgot tab) */}
                {!isGuest && tab !== 'forgot' && (
                  <div style={{ display: 'flex', background: 'var(--tw-bg)', padding: '4px', borderRadius: '12px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setTab('signin');
                      }}
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
                      Sign In with Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setTab('signup');
                      }}
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
                )}

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(tab === 'signup' || isGuest) && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px' }}>
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Alex Rivera"
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
                            placeholder="maker_42"
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
                      Email Address
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

                  {tab !== 'forgot' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)' }}>
                          Password
                        </label>
                        {tab === 'signin' && (
                          <button
                            type="button"
                            onClick={() => {
                              resetFormState();
                              setTab('forgot');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--tw-brand)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
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
                  )}

                  <TracewiseBubbleButton
                    type="submit"
                    variant="primary"
                    style={{ width: '100%', marginTop: '6px' }}
                    disabled={loading}
                  >
                    <span>
                      {loading
                        ? 'Processing...'
                        : isGuest
                        ? 'Upgrade and Save Account'
                        : tab === 'forgot'
                        ? 'Send Password Reset Link'
                        : tab === 'signin'
                        ? 'Sign In with Email'
                        : 'Create Account with Email'}
                    </span>
                  </TracewiseBubbleButton>

                  {tab === 'forgot' && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setTab('signin');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--tw-text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '4px',
                        textAlign: 'center'
                      }}
                    >
                      Return to Sign In
                    </button>
                  )}
                </form>

                {/* Privacy note */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--tw-border)', display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--tw-text-muted)', fontSize: '0.74rem', lineHeight: 1.45 }}>
                  <Shield size={14} color="var(--tw-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <b>Student Privacy Safeguard:</b> Tracewise does not display personal emails or require real names. Community discussions remain strictly content-focused.
                  </span>
                </div>
              </>
            )}
          </div>
        </TracewiseBubbleArea>
      </div>
    </div>
  );
}
