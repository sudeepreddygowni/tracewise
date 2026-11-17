import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TracewiseProjectGallery } from '../components/landing/TracewiseProjectGallery';
import { STARTER_PROJECTS } from '../data/starterProjects';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import { ArrowRight, GitFork, Play, Cpu, ShieldCheck, Globe } from 'lucide-react';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';
import { PublishProjectModal } from '../components/studio/PublishProjectModal';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { loadProject, forkActive, projects } = useProject();
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [publishModalProject, setPublishModalProject] = useState(null);

  const categories = ['All', 'State Machine', 'Input/Output', 'GPIO Basics', 'Analog & PWM'];

  const filtered = STARTER_PROJECTS.filter(p => filter === 'All' || p.category === filter);

  const handleOpen = (starter) => {
    loadProject(starter.id);
    navigate(`/app/studio/${starter.id}`);
  };

  const handleFork = (starter) => {
    loadProject(starter.id);
    const forked = forkActive(`${starter.title} (Remix)`);
    if (forked) navigate(`/app/studio/${forked.id}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Showcase with Modern Technical Gradient */}
      <section
        style={{
          position: 'relative',
          paddingTop: '120px',
          paddingBottom: '80px',
          background: 'linear-gradient(180deg, #071831 0%, #0b2348 45%, #1e3fd8 80%, var(--tw-bg) 100%)',
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
              background: 'rgba(7, 24, 49, 0.65)',
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
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              textShadow: '0 4px 18px rgba(7, 24, 49, 0.4)'
            }}
          >
            Good projects are meant to be explored.
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
            Open available starter circuits, test how they behave, and create independent remixes to learn by doing.
          </p>
        </div>

        {/* Fan Gallery */}
        <div className="container-tw">
          <TracewiseProjectGallery />
        </div>
      </section>

      {/* Filterable Catalog Section */}
      <section style={{ padding: '60px 0 100px', flex: 1, backgroundColor: 'var(--tw-bg)' }}>
        <div className="container-tw" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <TracewiseBubbleArea theme="light">
            {/* Category Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-display)' }}>
                  All Starter Circuits
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-muted)' }}>
                  Select any project to inspect its wiring graph and Arduino code inside the studio.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px' }}>
                {categories.map((cat) => (
                  <TracewiseBubbleButton
                    key={cat}
                    onClick={() => setFilter(cat)}
                    size="sm"
                    variant={filter === cat ? 'primary' : 'secondary'}
                    active={filter === cat}
                    style={{ minHeight: '2rem' }}
                  >
                    {cat}
                  </TracewiseBubbleButton>
                ))}
              </div>
            </div>

            {/* Detailed Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', marginTop: '24px' }}>
              {filtered.map((starter) => (
                <div
                  key={starter.id}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderRadius: '20px'
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

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                      {starter.title}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5 }}>
                      {starter.description}
                    </p>
                  </div>

                  {/* Technical specs pill */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: 'var(--tw-text-muted)', paddingTop: '10px', borderTop: '1px solid var(--tw-border)' }}>
                    <span>{(starter.components || []).length} Components</span>
                    <span>•</span>
                    <span>{(starter.connections || []).length} Wires</span>
                    <span>•</span>
                    <span>Arduino Uno R3</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <TracewiseBubbleButton
                      onClick={() => handleFork(starter)}
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1 }}
                    >
                      <GitFork size={14} />
                      <span>Fork Remix</span>
                    </TracewiseBubbleButton>
                    <TracewiseBubbleButton
                      onClick={() => handleOpen(starter)}
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 }}
                    >
                      <Play size={14} />
                      <span>Open Circuit</span>
                    </TracewiseBubbleButton>
                    <TracewiseBubbleButton
                      onClick={() => setPublishModalProject(starter)}
                      variant="ghost"
                      size="sm"
                      title="Publish this starter to Community"
                      style={{ padding: '6px 10px', minHeight: '36px' }}
                    >
                      <Globe size={15} color="var(--tw-brand)" />
                    </TracewiseBubbleButton>
                  </div>
                </div>
              ))}
            </div>
          </TracewiseBubbleArea>
        </div>
      </section>

      {/* Publish Project Modal */}
      {publishModalProject && (
        <PublishProjectModal
          isOpen={!!publishModalProject}
          onClose={() => setPublishModalProject(null)}
          project={publishModalProject}
          user={user}
          onProjectPublished={() => {
            alert('Project successfully published to Community!');
          }}
        />
      )}
    </div>
  );
}
