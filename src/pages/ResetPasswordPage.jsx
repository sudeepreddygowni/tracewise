import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check if recovery link hash contains error
    const hash = window.location.hash || '';
    if (hash.includes('error=') || hash.includes('invalid') || hash.includes('expired')) {
      setIsExpired(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/app');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Your reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TracewiseBubbleArea theme="light">
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--tw-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '36px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 48px rgba(7, 24, 49, 0.08)',
            textAlign: 'center'
          }}
        >
          {isExpired ? (
            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
                Reset Link Expired
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                This password recovery link is no longer valid or has already been used. Please request a new recovery link.
              </p>
              <TracewiseBubbleButton to="/" variant="primary" style={{ width: '100%' }}>
                <span>Return to Home</span>
              </TracewiseBubbleButton>
            </div>
          ) : success ? (
            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  color: 'var(--tw-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
                Password Updated!
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                Your account password has been updated successfully. Redirecting you to the studio...
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'var(--tw-brand-soft)',
                  color: 'var(--tw-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <KeyRound size={26} />
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                Create New Password
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', margin: '0 0 24px' }}>
                Enter your new password below to secure your Tracewise account.
              </p>

              {errorMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <TracewiseBubbleButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
                </TracewiseBubbleButton>
              </form>

              <div style={{ marginTop: '20px' }}>
                <Link
                  to="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    color: 'var(--tw-text-muted)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Cancel and return to home</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
