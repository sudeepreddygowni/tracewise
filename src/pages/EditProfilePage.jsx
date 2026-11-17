import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Shield,
  Check,
  AlertCircle,
  Linkedin,
  Github,
  Globe,
  Camera,
  Trash2,
  Image as ImageIcon,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import { uploadProfileAvatar, uploadCoverPhoto, validateImageFile } from '../services/mediaStorageService';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile } = useAuth();

  // Basic Information
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [handle, setHandle] = useState(user?.handle || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [about, setAbout] = useState(user?.about || user?.bio || '');
  const [education, setEducation] = useState(user?.education || '');

  // Media
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);

  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(user?.coverUrl || null);

  // Skills
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkillText, setNewSkillText] = useState('');

  // External Links
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.websiteUrl || '');

  // State
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Validation helpers
  const isValidLinkedInUrl = (url) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://')) return false;
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      const isLinkedInHost = host === 'linkedin.com' || host.endsWith('.linkedin.com');
      if (!isLinkedInHost) return false;
      const validPathRegex = /^\/(in|company|school|pub)\/[a-zA-Z0-9_\-\.\%\/]+/i;
      return validPathRegex.test(parsed.pathname);
    } catch {
      return false;
    }
  };

  const isValidGithubUrl = (url) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://')) return false;
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      return host === 'github.com' || host.endsWith('.github.com');
    } catch {
      return false;
    }
  };

  const isValidWebsiteUrl = (url) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tw-bg)', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
            Sign In Required
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', marginBottom: '24px' }}>
            You need to be signed in to edit your maker profile.
          </p>
          <TracewiseBubbleButton to="/" variant="primary">
            <span>Return to Home</span>
          </TracewiseBubbleButton>
        </div>
      </div>
    );
  }

  // Handle Avatar file selection
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateImageFile(file, 5);
    if (!check.valid) {
      setErrorMessage(check.error);
      return;
    }

    setAvatarFile(file);
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setErrorMessage(null);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // Handle Cover file selection
  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateImageFile(file, 5);
    if (!check.valid) {
      setErrorMessage(check.error);
      return;
    }

    setCoverFile(file);
    const localUrl = URL.createObjectURL(file);
    setCoverPreview(localUrl);
    setErrorMessage(null);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

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

    if (linkedinUrl.trim() && !isValidLinkedInUrl(linkedinUrl)) {
      setErrorMessage('Please enter a valid HTTPS LinkedIn profile URL (e.g. https://www.linkedin.com/in/username).');
      return;
    }

    if (githubUrl.trim() && !isValidGithubUrl(githubUrl)) {
      setErrorMessage('Please enter a valid HTTPS GitHub profile URL (e.g. https://github.com/username).');
      return;
    }

    if (websiteUrl.trim() && !isValidWebsiteUrl(websiteUrl)) {
      setErrorMessage('Please enter a valid website URL starting with https:// or http://.');
      return;
    }

    try {
      setSaving(true);

      let finalAvatarUrl = avatarUrl;
      let finalCoverUrl = coverUrl;

      // 1. Upload avatar if changed
      if (avatarFile) {
        const uploadRes = await uploadProfileAvatar(avatarFile, user.uid);
        if (uploadRes?.url) {
          finalAvatarUrl = uploadRes.url;
        }
      }

      // 2. Upload cover if changed
      if (coverFile) {
        const coverRes = await uploadCoverPhoto(coverFile, user.uid);
        if (coverRes?.url) {
          finalCoverUrl = coverRes.url;
        }
      }

      // 3. Save profile update
      await updateProfile({
        displayName: displayName.trim(),
        handle: handle.trim(),
        headline: headline.trim(),
        about: about.trim(),
        bio: about.trim(),
        education: education.trim(),
        avatarUrl: finalAvatarUrl,
        coverUrl: finalCoverUrl,
        skills,
        linkedinUrl: linkedinUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        websiteUrl: websiteUrl.trim() || null
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

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'TW';

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '110px 24px 80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
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
                Engineering Portfolio
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
                Edit Professional Profile
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
                Showcase your electronics projects, headline, verified skills, and engineering journey.
              </p>
            </div>

            {/* Success notification */}
            {savedSuccess && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: 'var(--tw-success)', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Check size={18} />
                <span>Profile updated successfully! Redirecting to your portfolio...</span>
              </div>
            )}

            {/* Error notification */}
            {errorMessage && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* =========================================================
                  COVER PHOTO & AVATAR UPLOAD SECTION
              ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                  Cover Banner & Profile Photo
                </label>

                {/* Banner Preview Area */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '170px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#071831',
                    backgroundImage: coverPreview
                      ? `url(${coverPreview})`
                      : 'radial-gradient(ellipse at top left, #1e3fd8 0%, #071831 70%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--tw-border)'
                  }}
                >
                  {/* Cover Action Buttons */}
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '8px', zIndex: 2 }}>
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--tw-radius-pill)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: 'var(--tw-text)',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <ImageIcon size={14} />
                      <span>{coverPreview ? 'Change Banner' : 'Upload Banner'}</span>
                    </button>

                    {coverPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 'var(--tw-radius-pill)',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                        title="Reset to default banner"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                  />

                  {/* Overlapping Profile Photo */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 20,
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid #ffffff',
                        backgroundColor: 'var(--tw-brand)',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: 800 }}>
                          {initials}
                        </span>
                      )}

                      {/* Camera Overlay Icon */}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                        title="Upload profile photo"
                      >
                        <Camera size={22} />
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          color: 'var(--tw-text)',
                          border: '1px solid var(--tw-border)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </button>

                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '8px',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                  Accepts JPEG, PNG, or WebP up to 5MB. Covers crop responsively to wide banner ratios.
                </span>
              </div>

              {/* =========================================================
                  PRIMARY IDENTITY FIELDS
              ========================================================= */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
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
                </div>
              </div>

              {/* =========================================================
                  PROFESSIONAL HEADLINE
              ========================================================= */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                    Professional Headline
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                    {headline.length} / 120
                  </span>
                </div>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value.slice(0, 120))}
                  placeholder="e.g. Student Maker | Arduino | Embedded Systems | Robotics"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '4px', display: 'block' }}>
                  A concise professional tagline shown directly below your name in your profile and cards.
                </span>
              </div>

              {/* =========================================================
                  ABOUT / BIO
              ========================================================= */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                    About (Engineering Journey & Maker Interests)
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                    {about.length} / 1000
                  </span>
                </div>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value.slice(0, 1000))}
                  placeholder="Describe your background, what electronic circuits and microcontrollers you build, what you are looking to learn, and projects you're passionate about..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.55
                  }}
                />
              </div>

              {/* =========================================================
                  SKILLS TAGS MANAGER
              ========================================================= */}
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
                    placeholder="e.g. Arduino, C++, ESP32, Circuit Design, PWM"
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
                        padding: '5px 12px',
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

              {/* =========================================================
                  EDUCATION & LEARNING (OPTIONAL)
              ========================================================= */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  <GraduationCap size={16} color="var(--tw-brand)" />
                  <span>Education & Learning Interests</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--tw-text-muted)' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value.slice(0, 150))}
                  placeholder="e.g. B.Tech in Electronics & Communication, High School Robotics Club, or Self-Taught Maker"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', marginTop: '4px', display: 'block' }}>
                  Students are never required to disclose school, age, location, or private contacts.
                </span>
              </div>

              {/* =========================================================
                  EXTERNAL LINKS (LINKEDIN, GITHUB, WEBSITE)
              ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--tw-border)', paddingTop: '20px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                  External Portfolios & Social Links (Optional)
                </span>

                {/* LinkedIn */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Linkedin size={15} color="#0a66c2" />
                      <span>LinkedIn Profile</span>
                    </label>
                    {linkedinUrl && (
                      <button
                        type="button"
                        onClick={() => setLinkedinUrl('')}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: linkedinUrl.trim() && !isValidLinkedInUrl(linkedinUrl) ? '1px solid #ef4444' : '1px solid var(--tw-border)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* GitHub */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Github size={15} color="#172033" />
                      <span>GitHub Profile</span>
                    </label>
                    {githubUrl && (
                      <button
                        type="button"
                        onClick={() => setGithubUrl('')}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: githubUrl.trim() && !isValidGithubUrl(githubUrl) ? '1px solid #ef4444' : '1px solid var(--tw-border)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Personal Website */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={15} color="var(--tw-brand)" />
                      <span>Personal Portfolio / Website</span>
                    </label>
                    {websiteUrl && (
                      <button
                        type="button"
                        onClick={() => setWebsiteUrl('')}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://myportfolio.dev"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: websiteUrl.trim() && !isValidWebsiteUrl(websiteUrl) ? '1px solid #ef4444' : '1px solid var(--tw-border)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Privacy Safeguards info */}
              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--tw-bg)', border: '1px solid var(--tw-border)', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5 }}>
                <Shield size={16} color="var(--tw-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <b>Student Privacy Guarantee:</b> Your profile does not expose your email address, phone, school, or location. Circuit projects remain private on your device until explicitly published.
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
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
                  style={{ gap: '8px', minWidth: '150px' }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Portfolio'}</span>
                </TracewiseBubbleButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
