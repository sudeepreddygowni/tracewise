import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Shield, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [handle, setHandle] = useState(user?.handle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkillText, setNewSkillText] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tw-bg)', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
            Sign In Required
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', marginBottom: '24px' }}>
            You need to be signed in to edit your student profile.
          </p>
          <TracewiseBubbleButton to="/" variant="primary">
            <span>Return to Home</span>
          </TracewiseBubbleButton>
        </div>
      </div>
    );
  }

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const clean = newSkillText.trim();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
      setNewSkillText('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSavedSuccess(false);

    if (!displayName.trim() || displayName.length < 2) {
      setErrorMessage('Display name must be at least 2 characters.');
      return;
    }
    if (!handle.trim() || handle.length < 3) {
      setErrorMessage('Handle must be at least 3 characters.');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        displayName: displayName.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        skills
      });
      setSavedSuccess(true);
      setTimeout(() => {
        navigate(`/profile/${handle}`);
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Back link */}
          <Link
            to={`/profile/${user.handle}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--tw-text-muted)', textDecoration: 'none', fontWeight: 600 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Profile</span>
          </Link>

          {/* Form Card */}
          <div
            className="glass-card"
            style={{
              padding: '36px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 12px 36px rgba(7, 24, 49, 0.06)'
            }}
          >
            <div style={{ marginBottom: '28px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Profile Settings
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
                Edit Student Profile
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
                Update how your name, handle, and circuit skills appear across Tracewise discussions.
              </p>
            </div>

            {/* Success notification */}
            {savedSuccess && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: 'var(--tw-success)', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Check size={18} />
                <span>Profile updated successfully! Redirecting...</span>
              </div>
            )}

            {/* Error notification */}
            {errorMessage && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Unique Handle
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', color: 'var(--tw-text-muted)', fontSize: '0.95rem' }}>@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="alex_circuits"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 30px',
                      borderRadius: '12px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)', marginTop: '4px', display: 'block' }}>
                  Used in community mentions and your public profile URL: tracewise.app/profile/{handle || 'username'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Bio (max 280 characters)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 280))}
                  placeholder="Tell other students what you enjoy building with electronics..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', textAlign: 'right', display: 'block', marginTop: '2px' }}>
                  {bio.length} / 280
                </span>
              </div>

              {/* Skills Tags Manager */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  Skills & Focus Areas
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="e.g. Servo Motors, I2C, ATmega328P"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <TracewiseBubbleButton
                    type="button"
                    onClick={handleAddSkill}
                    variant="secondary"
                    size="sm"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </TracewiseBubbleButton>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--tw-brand-soft)',
                        color: 'var(--tw-brand)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {skill}
                      <X
                        size={13}
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Privacy Safeguards info */}
              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--tw-bg)', border: '1px solid var(--tw-border)', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5 }}>
                <Shield size={16} color="var(--tw-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <b>Student Privacy Guarantee:</b> Your profile does not expose your email address, phone, school, or location. Circuit projects remain private until explicitly shared.
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <TracewiseBubbleButton
                  to={`/profile/${user.handle}`}
                  variant="ghost"
                  size="md"
                >
                  <span>Cancel</span>
                </TracewiseBubbleButton>

                <TracewiseBubbleButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={saving}
                  style={{ gap: '8px', minWidth: '140px' }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </TracewiseBubbleButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
