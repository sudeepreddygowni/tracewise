import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Edit3,
  Calendar,
  Sparkles,
  Shield,
  MessageSquare,
  FolderKanban,
  ExternalLink,
  ArrowRight,
  Cpu,
  Linkedin,
  Github,
  Globe,
  GraduationCap,
  Send,
  Code2
} from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import { getCommunityPosts, getUserPublishedProjects } from '../services/communityService';
import { useProject } from '../store/useProjectStore';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { AuthModal } from '../components/auth/AuthModal';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';

export function ProfilePage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { remixProject } = useProject();

  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [publishedProjects, setPublishedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isOwnProfile = currentUser && (
    currentUser.handle?.toLowerCase() === handle?.toLowerCase() ||
    (!handle && currentUser)
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const targetHandle = handle || currentUser?.handle;

      try {
        let found = null;

        if (isOwnProfile && currentUser) {
          found = currentUser;
        } else if (isSupabaseConfigured() && supabase && targetHandle) {
          // 1. Query Supabase profiles table
          try {
            const { data: dbProfile, error: dbErr } = await supabase
              .from('profiles')
              .select('*')
              .ilike('handle', targetHandle)
              .single();

            if (dbProfile && !dbErr) {
              found = {
                uid: dbProfile.id,
                displayName: dbProfile.display_name || 'Student Maker',
                handle: dbProfile.handle,
                headline: dbProfile.headline || '',
                about: dbProfile.about || dbProfile.bio || '',
                bio: dbProfile.bio || dbProfile.about || '',
                education: dbProfile.education || '',
                skills: dbProfile.skills || [],
                avatarUrl: dbProfile.avatar_url || null,
                coverUrl: dbProfile.cover_url || null,
                linkedinUrl: dbProfile.linkedin_url || null,
                githubUrl: dbProfile.github_url || null,
                websiteUrl: dbProfile.website_url || null,
                joinedAt: dbProfile.created_at
                  ? new Date(dbProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'Recently',
                isAnonymous: dbProfile.is_anonymous
              };
            }
          } catch (e) {
            console.warn('Supabase profile query note:', e.message);
          }
        }

        // 2. Fallback to curated showcase profiles if matching sample maker
        if (!found) {
          const sampleProfiles = {
            'alex_circuits': {
              displayName: 'Alex Rivera',
              handle: 'alex_circuits',
              headline: 'Student Maker | Arduino Uno | Embedded Systems | Robotics',
              about: 'High school electronics enthusiast building micro-robotics and traffic controllers with Arduino Uno. Currently exploring PWM motor drivers and analog sensor calibration.',
              education: 'High School STEM Club • Electronics Team Lead',
              skills: ['Arduino Uno', 'Digital I/O', 'Analog Sensors', 'Breadboarding', 'C++'],
              linkedinUrl: 'https://www.linkedin.com/in/alex-rivera-circuits',
              githubUrl: 'https://github.com/alexrivera',
              websiteUrl: 'https://alexcircuits.dev',
              joinedAt: 'November 2026',
              avatarUrl: null,
              coverUrl: null,
              uid: 'preview-student-1'
            },
            'maya_robotics': {
              displayName: 'Maya Patel',
              handle: 'maya_robotics',
              headline: 'Robotics Club Lead | PWM Controllers | LED Engineering',
              about: 'STEM club robotics lead. Exploring PWM motor controllers and LED power efficiency. Passionate about autonomous navigation and circuit debugging.',
              education: 'Engineering Undergraduate • Robotics Society',
              skills: ['Robotics', 'PWM Control', 'Circuit Math', 'Breadboarding', 'ESP32'],
              linkedinUrl: 'https://www.linkedin.com/in/maya-patel-robotics',
              githubUrl: 'https://github.com/mayapatel',
              websiteUrl: null,
              joinedAt: 'October 2026',
              avatarUrl: null,
              coverUrl: null,
              uid: 'preview-student-2'
            },
            'devon_maker': {
              displayName: 'Devon Lee',
              handle: 'devon_maker',
              headline: 'Hardware Hacker | Sensor Arrays | Rover Prototyping',
              about: 'Experimenting with ultrasonic rangefinders and autonomous rovers. Love optimizing breadboard wire routing and debugging timing issues in C++ sketches.',
              education: 'Self-Taught Hardware Maker',
              skills: ['Sensors', 'Ultrasonic', 'C++', 'Hardware Debugging', 'Breadboarding'],
              linkedinUrl: null,
              githubUrl: 'https://github.com/devonlee-maker',
              websiteUrl: null,
              joinedAt: 'September 2026',
              avatarUrl: null,
              coverUrl: null,
              uid: 'preview-student-3'
            }
          };

          found = sampleProfiles[targetHandle?.toLowerCase()] || {
            displayName: targetHandle ? targetHandle.replace(/_/g, ' ') : 'Student Maker',
            handle: targetHandle || 'student',
            headline: 'Student Maker | Electronics & Circuit Engineering',
            about: 'Electronics explorer building and debugging circuits on Tracewise.',
            education: '',
            skills: ['Arduino Uno', 'Circuit Design'],
            linkedinUrl: null,
            githubUrl: null,
            websiteUrl: null,
            joinedAt: 'Recently',
            avatarUrl: null,
            coverUrl: null,
            uid: 'student-' + targetHandle
          };
        }

        setProfileData(found);

        // 3. Load published projects (NEVER unpublished private projects)
        try {
          const userProjects = await getUserPublishedProjects(found.uid, found.handle);
          setPublishedProjects(userProjects);
        } catch (e) {
          console.warn('Failed to load published projects:', e);
          setPublishedProjects([]);
        }

        // 4. Load community posts
        try {
          const posts = await getCommunityPosts({ authorUid: found.uid });
          setUserPosts(posts);
        } catch (e) {
          setUserPosts([]);
        }

      } catch (err) {
        console.warn('Profile loadData error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [handle, currentUser, isOwnProfile]);

  const handleRemixPublishedProject = (proj) => {
    const remixTitle = `${proj.title} (Remix)`;
    const projectToLoad = proj.projectData || proj;
    const cloned = remixProject ? remixProject(projectToLoad, remixTitle) : null;
    if (cloned) {
      navigate(`/app/studio/${cloned.id}`);
    } else {
      navigate('/app/studio');
    }
  };

  const handleMessageUser = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    navigate(`/messages?user=${profileData?.handle}`);
  };

  if (loading || !profileData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--tw-text-muted)', fontSize: '0.94rem' }}>Loading student portfolio...</div>
      </div>
    );
  }

  const initials = profileData?.displayName
    ? profileData.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'TW';

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '110px 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* =========================================================
              LINKEDIN-INSPIRED PROFILE HEADER CARD
          ========================================================= */}
          <div
            className="glass-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(7, 24, 49, 0.06)',
              position: 'relative'
            }}
          >
            {/* Wide Cover Banner */}
            <div
              style={{
                width: '100%',
                height: '210px',
                backgroundColor: '#071831',
                backgroundImage: profileData.coverUrl
                  ? `url(${profileData.coverUrl})`
                  : 'radial-gradient(ellipse at 20% 0%, #1e3fd8 0%, #071831 75%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              {/* Subtle circuitry trace pattern overlay for brand identity */}
              {!profileData.coverUrl && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.2,
                    backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.4) 0%, transparent 40%)'
                  }}
                />
              )}
            </div>

            {/* Profile Info Area with Overlapping Avatar */}
            <div style={{ padding: '0 32px 32px', position: 'relative' }}>
              
              {/* Top Row: Overlapping Avatar and Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '16px'
                }}
              >
                {/* Circular Profile Picture Overlapping Banner */}
                <div
                  style={{
                    position: 'relative',
                    marginTop: '-60px',
                    width: '114px',
                    height: '114px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--tw-brand)',
                    color: '#ffffff',
                    border: '4px solid #ffffff',
                    boxShadow: '0 8px 24px rgba(7, 24, 49, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {profileData.avatarUrl ? (
                    <img
                      src={profileData.avatarUrl}
                      alt={profileData.displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Top Action Buttons (Edit Profile / Message) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {isOwnProfile ? (
                    <TracewiseBubbleButton
                      to="/profile/edit"
                      variant="secondary"
                      size="sm"
                      style={{ gap: '6px' }}
                    >
                      <Edit3 size={15} />
                      <span>Edit Profile</span>
                    </TracewiseBubbleButton>
                  ) : (
                    <TracewiseBubbleButton
                      onClick={handleMessageUser}
                      variant="primary"
                      size="sm"
                      style={{ gap: '6px' }}
                    >
                      <Send size={15} />
                      <span>Message</span>
                    </TracewiseBubbleButton>
                  )}
                </div>
              </div>

              {/* Identity & Professional Headline */}
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    {profileData.displayName || 'Student Maker'}
                  </h1>
                  <span style={{ fontSize: '0.95rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
                    @{profileData.handle}
                  </span>
                </div>

                {/* Professional Headline */}
                {profileData.headline ? (
                  <p style={{ fontSize: '1.02rem', fontWeight: 600, color: '#334155', margin: '6px 0 0', lineHeight: 1.4 }}>
                    {profileData.headline}
                  </p>
                ) : (
                  <p style={{ fontSize: '0.95rem', color: 'var(--tw-text-muted)', margin: '6px 0 0' }}>
                    Student Maker exploring interactive circuits on Tracewise
                  </p>
                )}

                {/* Metadata Badges (Joined, Verification, Education) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '12px', fontSize: '0.84rem', color: 'var(--tw-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />
                    Joined {profileData.joinedAt}
                  </span>

                  {profileData.isAnonymous ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--tw-brand)', fontWeight: 600 }}>
                      <Sparkles size={14} />
                      Guest Visitor
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--tw-success)', fontWeight: 600 }}>
                      <Shield size={14} />
                      Verified Student Profile
                    </span>
                  )}

                  {profileData.education && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--tw-text)' }}>
                      <GraduationCap size={15} color="var(--tw-brand)" />
                      {profileData.education}
                    </span>
                  )}
                </div>

                {/* External Portfolios & Links */}
                {(profileData.linkedinUrl || profileData.githubUrl || profileData.websiteUrl) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--tw-border)' }}>
                    {profileData.linkedinUrl && profileData.linkedinUrl.startsWith('https://') && (
                      <a
                        href={profileData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: 'var(--tw-radius-pill)',
                          backgroundColor: '#0a66c2',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(10, 102, 194, 0.25)',
                          transition: 'opacity 0.15s ease'
                        }}
                      >
                        <Linkedin size={14} />
                        <span>LinkedIn</span>
                        <ExternalLink size={11} style={{ opacity: 0.8 }} />
                      </a>
                    )}

                    {profileData.githubUrl && (
                      <a
                        href={profileData.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: 'var(--tw-radius-pill)',
                          backgroundColor: '#24292f',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
                          transition: 'opacity 0.15s ease'
                        }}
                      >
                        <Github size={14} />
                        <span>GitHub</span>
                        <ExternalLink size={11} style={{ opacity: 0.8 }} />
                      </a>
                    )}

                    {profileData.websiteUrl && (
                      <a
                        href={profileData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: 'var(--tw-radius-pill)',
                          backgroundColor: 'var(--tw-bg)',
                          border: '1px solid var(--tw-border)',
                          color: 'var(--tw-text)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <Globe size={14} color="var(--tw-brand)" />
                        <span>Portfolio Website</span>
                        <ExternalLink size={11} style={{ opacity: 0.8 }} />
                      </a>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* =========================================================
              SECTION 1: ABOUT (ENGINEERING JOURNEY)
          ========================================================= */}
          <div
            className="glass-card"
            style={{
              padding: '28px 32px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(7, 24, 49, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              About
            </h3>
            <p style={{ fontSize: '0.94rem', color: '#475569', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line' }}>
              {profileData.about || profileData.bio || 'Electronics maker building and debugging circuits on Tracewise.'}
            </p>
          </div>

          {/* =========================================================
              SECTION 2: SKILLS & FOCUS AREAS
          ========================================================= */}
          {profileData.skills && profileData.skills.length > 0 && (
            <div
              className="glass-card"
              style={{
                padding: '28px 32px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(7, 24, 49, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Skills & Focus Areas
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profileData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      padding: '6px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--tw-brand-soft)',
                      color: 'var(--tw-brand)',
                      border: '1px solid rgba(30, 63, 216, 0.12)'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 3: FEATURED PUBLISHED PROJECTS
          ========================================================= */}
          <div
            className="glass-card"
            style={{
              padding: '28px 32px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(7, 24, 49, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  Featured Projects
                </h3>
                <span style={{ fontSize: '0.78rem', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  {publishedProjects.length}
                </span>
              </div>
            </div>

            {publishedProjects.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                {publishedProjects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--tw-bg)',
                      border: '1px solid var(--tw-border)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
                          {p.category || 'Circuit Project'}
                        </span>
                        {p.remixCount > 0 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Code2 size={12} />
                            {p.remixCount} remixes
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', margin: '0 0 6px 0' }}>
                        {p.title}
                      </h4>

                      <p style={{ fontSize: '0.85rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {p.description || 'Interactive Arduino and breadboard electronic circuit.'}
                      </p>

                      {p.tags && p.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
                          {p.tags.slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)', backgroundColor: '#ffffff', padding: '2px 7px', borderRadius: '6px', border: '1px solid var(--tw-border)' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--tw-border)', paddingTop: '12px' }}>
                      <TracewiseBubbleButton
                        onClick={() => handleRemixPublishedProject(p)}
                        variant="primary"
                        size="sm"
                        style={{ padding: '6px 14px' }}
                      >
                        <span>Remix in Studio</span>
                        <ArrowRight size={13} />
                      </TracewiseBubbleButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: 'var(--tw-bg)', borderRadius: '16px', border: '1px dashed var(--tw-border)' }}>
                <Shield size={28} color="var(--tw-brand)" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tw-text)', margin: '0 0 4px 0' }}>
                  Student Projects Are Private by Default
                </h4>
                <p style={{ color: 'var(--tw-text-secondary)', fontSize: '0.86rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
                  Stored circuits and Arduino sketches stay securely on local storage. Projects only appear on public maker portfolios when explicitly published to the Community.
                </p>
              </div>
            )}
          </div>

          {/* =========================================================
              SECTION 4: ACTIVITY (COMMUNITY DISCUSSIONS)
          ========================================================= */}
          <div
            className="glass-card"
            style={{
              padding: '28px 32px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(7, 24, 49, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Activity & Community Discussions
              </h3>
              <span style={{ fontSize: '0.78rem', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                {userPosts.length}
              </span>
            </div>

            {userPosts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: '18px 22px',
                      backgroundColor: 'var(--tw-bg)',
                      borderRadius: '14px',
                      border: '1px solid var(--tw-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: '8px',
                          backgroundColor: post.category === 'Question' ? '#eff6ff' : post.category === 'Debugging Help' ? '#fef3c7' : '#f0fdf4',
                          color: post.category === 'Question' ? 'var(--tw-brand)' : post.category === 'Debugging Help' ? '#b45309' : 'var(--tw-success)'
                        }}
                      >
                        {post.category}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link
                      to={`/community/post/${post.id}`}
                      style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tw-text)')}
                    >
                      {post.title}
                    </Link>

                    <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {post.body?.slice(0, 160)}...
                    </p>

                    {post.projectRef && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--tw-brand)', backgroundColor: '#ffffff', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--tw-border)', alignSelf: 'flex-start' }}>
                        <Cpu size={13} />
                        <span>Attached Circuit: {post.projectRef.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--tw-text-muted)', fontSize: '0.88rem' }}>
                No public community posts or discussions published yet.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Auth Modal for Visitors who click Message */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </TracewiseBubbleArea>
  );
}
