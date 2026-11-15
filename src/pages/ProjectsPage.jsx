import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { TracewiseProjectGallery } from '../components/landing/TracewiseProjectGallery';
import { STARTER_PROJECTS } from '../data/starterProjects';
import { useProject } from '../store/useProjectStore';
import { ArrowRight, GitFork, Play, Cpu, ShieldCheck } from 'lucide-react';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { loadProject, forkActive } = useProject();
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'State Machine', 'Input/Output', 'GPIO Basics', 'Analog & PWM'];

  const filtered = STARTER_PROJECTS.filter(p => filter === 'All' || p.category === filter);

  const handleOpen = (starter) => {
    loadProject(starter.id);
    navigate(`/app/studio/${starter.id}`);
  };

  const handleFork = (starter) => {
    loadProject(starter.id);
    const forked = forkActive(`${starter.title} (My Remix)`);
    if (forked) navigate(`/app/studio/${forked.id}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero Showcase with Green Valley Landscape */}
      <section
        style={{
          position: 'relative',
          paddingTop: '120px',
          paddingBottom: '60px',
          backgroundImage: `
            linear-gradient(180deg, rgba(7, 24, 49, 0.45) 0%, rgba(245, 249, 253, 0.95) 100%),
            url('/assets/backgrounds/green-valley.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden'
        }}
      >
        <div className="container-tw" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#ffffff',
              background: 'rgba(7, 24, 49, 0.55)',
              padding: '6px 16px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              display: 'inline-block',
              marginBottom: '12px'
            }}
          >
            Curated Project Showcase
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
              color: '#ffffff',
              fontWeight: 800,
              textShadow: '0 4px 18px rgba(7, 24, 49, 0.4)'
            }}
          >
            Explore ideas. Make them yours.
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#f1f5f9',
              maxWidth: '620px',
              margin: '8px auto 0',
              textShadow: '0 2px 10px rgba(7, 24, 49, 0.5)'
            }}
          >
            Interactive electronics starters built with Arduino Uno, real breadboards, and verified pin endpoints.
          </p>
        </div>

        {/* Fan Gallery */}
        <div className="container-tw">
          <TracewiseProjectGallery />
        </div>
      </section>

      {/* Filterable Catalog Section */}
      <section style={{ padding: '60px 0', flex: 1 }}>
        <div className="container-tw" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Category Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                All Starter Circuits
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-muted)' }}>
                Select any circuit to load its wiring graph and Arduino C++ code directly into the studio.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--tw-radius-pill)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    backgroundColor: filter === cat ? 'var(--tw-brand)' : 'var(--tw-surface)',
                    color: filter === cat ? '#ffffff' : 'var(--tw-text-secondary)',
                    border: '1px solid var(--tw-border)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {filtered.map((starter) => (
              <div
                key={starter.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--tw-brand)',
                        background: 'var(--tw-brand-soft)',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}
                    >
                      {starter.category}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                      Level: <b>{starter.level}</b>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                    {starter.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5 }}>
                    {starter.description}
                  </p>
                </div>

                {/* Technical specs pill */}
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.76rem', color: 'var(--tw-text-muted)', paddingTop: '10px', borderTop: '1px solid var(--tw-border)' }}>
                  <span>{(starter.components || []).length} Components</span>
                  <span>•</span>
                  <span>{(starter.connections || []).length} Wires</span>
                  <span>•</span>
                  <span>Arduino Uno R3</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleFork(starter)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px 14px', fontSize: '0.84rem' }}
                  >
                    <GitFork size={14} />
                    <span>Fork Remix</span>
                  </button>
                  <button
                    onClick={() => handleOpen(starter)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px 14px', fontSize: '0.84rem' }}
                  >
                    <Play size={14} />
                    <span>Open Circuit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
