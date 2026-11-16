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
  Linkedin
} from 'lucide-react';
import { useAuth } from '../store/useAuthStore';
import { getCommunityPosts } from '../services/communityService';
import { useProject } from '../store/useProjectStore';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';

export function ProfilePage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { projects } = useProject();

  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'projects'
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser && (
    currentUser.handle?.toLowerCase() === handle?.toLowerCase() ||
    (!handle && currentUser)
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const targetHandle = handle || currentUser?.handle;

      try {
        if (isOwnProfile && currentUser) {
          setProfileData(currentUser);
          try {
            const posts = await getCommunityPosts({ authorUid: currentUser.uid });
            setUserPosts(posts);
          } catch (e) {
            setUserPosts([]);
          }
        } else {
          let found = null;

          // 1. Try querying real profile from Supabase PostgreSQL
          if (isSupabaseConfigured() && supabase && targetHandle) {
            try {
              const { data: dbProfile, error: dbErr } = await supabase
                .from('profiles')
                .select('*')
                .ilike('handle', targetHandle)
                .single();

              if (dbProfile && !dbErr) {
                found = {
                  displayName: dbProfile.display_name,
                  handle: dbProfile.handle,
                  bio: dbProfile.bio || '',
                  skills: dbProfile.skills || [],
                  linkedinUrl: dbProfile.linkedin_url || null,
                  joinedAt: dbProfile.created_at ? new Date(dbProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
                  avatarUrl: dbProfile.avatar_url,
                  uid: dbProfile.id,
                  isAnonymous: dbProfile.is_anonymous
                };
              }
            } catch (e) {
              console.warn('Supabase profile query note:', e.message);
            }
          }

          // 2. Fallback to curated student showcases or dynamic handle
          if (!found) {
            const sampleProfiles = {
              'alex_circuits': {
                displayName: 'Alex Rivera',
                handle: 'alex_circuits',
                bio: 'High school electronics enthusiast building micro-robotics and traffic controllers with Arduino Uno.',
                skills: ['Arduino Uno', 'Digital I/O', 'Analog Sensors', 'Breadboarding'],
                linkedinUrl: 'https://www.linkedin.com/in/alex-rivera-circuits',
                joinedAt: 'November 2026',
                avatarUrl: null,
                uid: 'preview-student-1'
              },
              'maya_robotics': {
                displayName: 'Maya Patel',
                handle: 'maya_robotics',
                bio: 'STEM club robotics lead. Exploring PWM motor controllers and LED power efficiency.',
                skills: ['Robotics', 'PWM Control', 'Circuit Math', 'Breadboarding'],
                linkedinUrl: null,
                joinedAt: 'October 2026',
                avatarUrl: null,
                uid: 'preview-student-2'
              },
              'devon_maker': {
                displayName: 'Devon Lee',
                handle: 'devon_maker',
                bio: 'Experimenting with ultrasonic rangefinders and autonomous rovers.',
                skills: ['Sensors', 'Ultrasonic', 'C++', 'Hardware Debugging'],
                linkedinUrl: null,
                joinedAt: 'September 2026',
                avatarUrl: null,
                uid: 'preview-student-3'
              }
            };

            found = sampleProfiles[targetHandle?.toLowerCase()] || {
              displayName: targetHandle ? targetHandle.replace(/_/g, ' ') : 'Student Maker',
              handle: targetHandle || 'student',
              bio: 'Electronics explorer building and debugging circuits on Tracewise.',
              skills: ['Arduino Uno', 'Circuit Design'],
              linkedinUrl: null,
              joinedAt: 'Recently',
              avatarUrl: null,
              uid: 'student-' + targetHandle
            };
          }

          setProfileData(found);
          try {
            const posts = await getCommunityPosts({ authorUid: found.uid });
            setUserPosts(posts);
          } catch (e) {
            setUserPosts([]);
          }
        }
      } catch (err) {
        console.warn('Profile loadData error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [handle, currentUser, isOwnProfile]);

  if (loading || !profileData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--tw-text-muted)', fontSize: '0.94rem' }}>Loading student profile...</div>
      </div>
    );
  }

  const initials = profileData?.displayName
    ? profileData.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'TW';

  // Shared projects for own profile
  const sharedProjectsList = isOwnProfile ? projects : [];

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Profile Card Header */}
          <div
            className="glass-card"
            style={{
              padding: '36px 32px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 12px 36px rgba(7, 24, 49, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {/* Avatar / Initials */}
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    backgroundColor: 'var(--tw-brand)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(30, 63, 216, 0.25)'
                  }}
                >
                  {initials}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tw-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                      {profileData?.displayName || 'Student Maker'}
                    </h1>
                    <span style={{ fontSize: '0.92rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
                      @{profileData?.handle || 'student'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--tw-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} />
                      Joined {profileData?.joinedAt || 'Recently'}
                    </span>
                    {profileData?.isAnonymous ? (
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
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {profileData?.linkedinUrl && profileData.linkedinUrl.startsWith('https://') && (
                  <a
                    href={profileData.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '7px 16px',
                      borderRadius: 'var(--tw-radius-pill)',
                      backgroundColor: '#0a66c2',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      boxShadow: '0 2px 10px rgba(10, 102, 194, 0.28)',
                      transition: 'transform 0.15s ease, opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Linkedin size={15} />
                    <span>LinkedIn Profile</span>
                    <ExternalLink size={12} style={{ opacity: 0.8 }} />
                  </a>
                )}

                {isOwnProfile && (
                  <TracewiseBubbleButton
                    to="/profile/edit"
                    variant="secondary"
                    size="sm"
                    style={{ gap: '6px' }}
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </TracewiseBubbleButton>
                )}
              </div>
            </div>

            {/* Bio */}
            {profileData?.bio && (
              <p style={{ fontSize: '0.98rem', color: 'var(--tw-text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '720px' }}>
                {profileData.bio}
              </p>
            )}

            {/* Skills & Focus Areas */}
            {profileData?.skills && profileData.skills.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--tw-border)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-muted)' }}>Skills & Focus:</span>
                {profileData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--tw-brand-soft)',
                      color: 'var(--tw-brand)'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--tw-border)', paddingBottom: '2px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              style={{
                padding: '10px 18px',
                fontSize: '0.92rem',
                fontWeight: 700,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'posts' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
                borderBottom: activeTab === 'posts' ? '2px solid var(--tw-brand)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={16} />
              <span>Community Posts ({userPosts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              style={{
                padding: '10px 18px',
                fontSize: '0.92rem',
                fontWeight: 700,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'projects' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
                borderBottom: activeTab === 'projects' ? '2px solid var(--tw-brand)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <FolderKanban size={16} />
              <span>{isOwnProfile ? `My Projects (${sharedProjectsList.length})` : 'Shared Projects'}</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'posts' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="glass-card"
                    style={{
                      padding: '24px 28px',
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '10px',
                          backgroundColor: post.category === 'Question' ? '#eff6ff' : post.category === 'Debugging Help' ? '#fef3c7' : '#f0fdf4',
                          color: post.category === 'Question' ? 'var(--tw-brand)' : post.category === 'Debugging Help' ? '#b45309' : 'var(--tw-success)'
                        }}
                      >
                        {post.category}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link
                      to={`/community/post/${post.id}`}
                      style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tw-brand)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tw-text)')}
                    >
                      {post.title}
                    </Link>

                    <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {post.body.slice(0, 180)}...
                    </p>

                    {post.projectRef && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--tw-brand)', backgroundColor: 'var(--tw-brand-soft)', padding: '4px 10px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                        <Cpu size={14} />
                        <span>Attached: {post.projectRef.title}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '18px' }}>
                  <p style={{ color: 'var(--tw-text-muted)', fontSize: '0.94rem', margin: 0 }}>
                    No community posts published yet.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isOwnProfile && sharedProjectsList.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  {sharedProjectsList.map((p) => (
                    <div
                      key={p.id}
                      className="glass-card"
                      style={{
                        padding: '20px',
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
                            {p.category || 'Circuit Project'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', padding: '2px 8px', borderRadius: '8px', backgroundColor: 'var(--tw-bg)' }}>
                            {p.version?.label || 'v1.0'}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', margin: '0 0 6px 0' }}>
                          {p.title}
                        </h4>
                        <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                          {p.description || 'Custom interactive breadboard and Arduino Uno circuit.'}
                        </p>
                      </div>

                      <TracewiseBubbleButton
                        to={`/app/studio/${p.id}`}
                        variant="primary"
                        size="sm"
                        style={{ alignSelf: 'flex-start', padding: '6px 14px' }}
                      >
                        <span>Open Studio</span>
                        <ArrowRight size={13} />
                      </TracewiseBubbleButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '18px' }}>
                  <Shield size={28} color="var(--tw-brand)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--tw-text)', margin: '0 0 6px 0' }}>
                    Student Projects Are Private by Default
                  </h4>
                  <p style={{ color: 'var(--tw-text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
                    Your stored circuits and Arduino C++ code remain securely on your device. Projects are only shared with the community when you explicitly attach them to a community post.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
