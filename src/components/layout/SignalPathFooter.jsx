import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Github, Linkedin, Cpu, Activity, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { CREATOR_CONFIG } from '../../config/creatorConfig';

export function SignalPathFooter() {
  const [activeSignal, setActiveSignal] = useState(null);

  return (
    <footer
      role="contentinfo"
      aria-label="Tracewise Signal Path Footer"
      style={{
        position: 'relative',
        backgroundColor: '#071831',
        borderTop: '1px solid rgba(56, 189, 248, 0.2)',
        color: '#94a3b8',
        padding: '64px 0 36px',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Background Circuit Trace SVG Canvas */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          opacity: 0.45,
          zIndex: 1
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="traceGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="traceGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="1" />
            </linearGradient>
            <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Primary Signal Path Traces */}
          <path
            d="M 0 80 H 320 L 380 140 H 860 L 920 80 H 1440"
            stroke={activeSignal === 'studio' ? 'url(#traceGradActive)' : 'url(#traceGrad1)'}
            strokeWidth={activeSignal === 'studio' ? 2.5 : 1.5}
            style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
          />
          <path
            d="M 120 0 V 180 L 180 240 H 720 L 780 300 H 1440"
            stroke={activeSignal === 'community' ? 'url(#traceGradActive)' : '#1e3a5f'}
            strokeWidth={activeSignal === 'community' ? 2.5 : 1}
            strokeDasharray="4 6"
            style={{ transition: 'all 0.3s ease' }}
          />
          <path
            d="M 0 380 H 420 L 480 320 H 1080 L 1140 380 H 1440"
            stroke={activeSignal === 'pitch' ? 'url(#traceGradActive)' : 'url(#traceGrad1)'}
            strokeWidth={activeSignal === 'pitch' ? 2.5 : 1.5}
            style={{ transition: 'all 0.3s ease' }}
          />

          {/* Integrated Circuit Solder Nodes */}
          <circle cx="320" cy="80" r="4.5" fill="#38bdf8" filter="url(#nodeGlow)" />
          <circle cx="380" cy="140" r="3.5" fill="#2563eb" />
          <circle cx="860" cy="140" r="4.5" fill="#38bdf8" filter="url(#nodeGlow)" />
          <circle cx="920" cy="80" r="3.5" fill="#2563eb" />
          <circle cx="480" cy="320" r="4" fill="#38bdf8" />
          <circle cx="1080" cy="320" r="4.5" fill="#38bdf8" filter="url(#nodeGlow)" />
        </svg>
      </div>

      <div
        className="container-tw"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '48px'
        }}
      >
        {/* Top Hero Expression: "Build it. Change it. Understand it." */}
        <div
          style={{
            borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
            paddingBottom: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Engineering Status Ticker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.74rem',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              color: '#38bdf8',
              textTransform: 'uppercase'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 10px #10b981'
              }}
            />
            <span>SIGNAL_PATH // 16.000 MHz // ATmega328P // STATUS: NOMINAL</span>
          </div>

          {/* Oversized Brand Line */}
          <h2
            style={{
              fontSize: 'clamp(1.9rem, 4.2vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: 0,
              color: '#f8fafc',
              backgroundImage: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Build it. Change it. Understand it.
          </h2>

          <p style={{ fontSize: '0.94rem', color: '#94a3b8', margin: 0, maxWidth: '640px', lineHeight: 1.6 }}>
            Every circuit trace connects hands-on curiosity to engineering mastery. Prototype freely, verify behavior, and present with scientific confidence.
          </p>
        </div>

        {/* Main Content Grid: Brand, Platform, Creator & Contact */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '40px',
            alignItems: 'flex-start'
          }}
        >
          {/* Column 1: Brand & Philosophy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                width: 'fit-content'
              }}
              aria-label="Tracewise Home"
            >
              <img
                src="/assets/brand/tracewise-logo-light.png"
                alt="Tracewise Logo"
                style={{ height: '32px', width: 'auto', display: 'block' }}
              />
            </Link>

            <p style={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              AI-assisted electronics, physical prototyping, and Arduino C++ simulation for students, educators, and science-fair innovators.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                fontSize: '0.74rem',
                color: '#38bdf8',
                fontWeight: 600,
                width: 'fit-content'
              }}
            >
              <Cpu size={14} />
              <span>Interactive Hardware Studio</span>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#f8fafc',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Engineering Platform
            </div>

            <nav aria-label="Footer Platform Links" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/app"
                onMouseEnter={() => setActiveSignal('studio')}
                onMouseLeave={() => setActiveSignal(null)}
                onFocus={() => setActiveSignal('studio')}
                onBlur={() => setActiveSignal(null)}
                style={{
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease'
                }}
              >
                <span>Circuit Studio & Simulator</span>
                <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
              </Link>

              <Link
                to="/projects"
                onMouseEnter={() => setActiveSignal('projects')}
                onMouseLeave={() => setActiveSignal(null)}
                onFocus={() => setActiveSignal('projects')}
                onBlur={() => setActiveSignal(null)}
                style={{
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease'
                }}
              >
                <span>Student Projects Gallery</span>
                <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
              </Link>

              <Link
                to="/community"
                onMouseEnter={() => setActiveSignal('community')}
                onMouseLeave={() => setActiveSignal(null)}
                onFocus={() => setActiveSignal('community')}
                onBlur={() => setActiveSignal(null)}
                style={{
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease'
                }}
              >
                <span>Maker Community & Groups</span>
                <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
              </Link>

              <Link
                to="/app/pitch"
                onMouseEnter={() => setActiveSignal('pitch')}
                onMouseLeave={() => setActiveSignal(null)}
                onFocus={() => setActiveSignal('pitch')}
                onBlur={() => setActiveSignal(null)}
                style={{
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease'
                }}
              >
                <span>Pitch Lab & Defense Prep</span>
                <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
              </Link>

              <Link
                to="/messages"
                style={{
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease'
                }}
              >
                <span>Direct Messages (E2EE)</span>
                <ShieldCheck size={13} color="#10b981" />
              </Link>
            </nav>
          </div>

          {/* Column 3: Creator & Verified Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#f8fafc',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Creator & Authorship
            </div>

            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff' }}>
              Created by {CREATOR_CONFIG.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Email Contact Link */}
              <a
                href={`mailto:${CREATOR_CONFIG.email}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
              >
                <Mail size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span>{CREATOR_CONFIG.email}</span>
              </a>

              {/* Social Channels Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <a
                  href={CREATOR_CONFIG.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    color: '#60a5fa',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.22)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.12)')}
                  aria-label="Sudeep Reddy LinkedIn profile"
                >
                  <Linkedin size={13} style={{ flexShrink: 0 }} />
                  <span>LinkedIn</span>
                </a>

                <a
                  href={CREATOR_CONFIG.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#f8fafc',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                  aria-label="Sudeep Reddy GitHub profile"
                >
                  <Github size={13} style={{ flexShrink: 0 }} />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Cryptographic Verification Note */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.76rem',
            color: '#64748b'
          }}
        >
          <div>
            © 2026 {CREATOR_CONFIG.name}. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={12} color="#10b981" />
            <span>Web Crypto AES-256-GCM Direct Messaging • avr8js Hardware Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
