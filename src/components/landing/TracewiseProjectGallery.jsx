import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FanGallery } from '../fan-gallery';
import { ArrowRight, Sparkles, GitFork, Play } from 'lucide-react';
import { STARTER_PROJECTS } from '../../data/starterProjects';
import { useProject } from '../../store/useProjectStore';

export function TracewiseProjectGallery() {
  const navigate = useNavigate();
  const { forkActive, loadProject } = useProject();
  const [selectedStarter, setSelectedStarter] = useState(STARTER_PROJECTS[0]);

  const items = [
    {
      src: '/assets/starters/traffic-light.webp',
      alt: 'Arduino traffic light project'
    },
    {
      src: '/assets/starters/button-led.webp',
      alt: 'Arduino LED and push button project'
    },
    {
      src: '/assets/starters/led-blink.webp',
      alt: 'Arduino LED blinking project'
    },
    {
      src: '/assets/starters/circuit-code.webp',
      alt: 'Arduino circuit and code project'
    },
    {
      src: '/assets/starters/project-remix.webp',
      alt: 'Electronics project remix and comparison'
    }
  ];

  const handleOpenStudio = (starter) => {
    loadProject(starter.id);
    navigate(`/app/studio/${starter.id}`);
  };

  const handleFork = (starter) => {
    loadProject(starter.id);
    const forked = forkActive(`${starter.title} (My Remix)`);
    if (forked) {
      navigate(`/app/studio/${forked.id}`);
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Official Fan Gallery with specified exact settings */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 30px' }}>
        <FanGallery
          items={items}
          cardWidth={162}
          aspectRatio={0.8}
          spacing={0.69}
          curve={0.14}
          tilt={14.5}
          lift={42}
          spread={0.2}
          stackFrom="left"
          speed={0.7}
          stagger={0.09}
          bounce={0.35}
          hoverSpeed={0.28}
          radius={18}
          entrance="stack"
          trigger="scroll"
          viewportStart={75}
          once={true}
          showTitle={false}
          onSelect={(index) => {
            if (STARTER_PROJECTS[index]) {
              setSelectedStarter(STARTER_PROJECTS[index]);
            }
          }}
        />
      </div>

      {/* Featured Starter Quick Action Card */}
      <div
        className="glass-card"
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '24px 32px',
          background: 'rgba(255, 255, 255, 0.88)',
          boxShadow: '0 20px 48px rgba(11, 35, 72, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--tw-brand)',
                  background: 'var(--tw-brand-soft)',
                  padding: '4px 10px',
                  borderRadius: '12px'
                }}
              >
                {selectedStarter.category} • {selectedStarter.level}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)' }}>
                {selectedStarter.components.length} components • {selectedStarter.connections.length} wires
              </span>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--tw-text)', fontWeight: 700 }}>
              {selectedStarter.title}
            </h3>
            <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
              {selectedStarter.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => handleFork(selectedStarter)}
              className="btn-secondary"
              style={{ padding: '9px 18px', fontSize: '0.88rem' }}
            >
              <GitFork size={15} />
              <span>Fork Remix</span>
            </button>
            <button
              onClick={() => handleOpenStudio(selectedStarter)}
              className="btn-primary"
              style={{ padding: '9px 20px', fontSize: '0.88rem' }}
            >
              <Play size={15} />
              <span>Open in Studio</span>
            </button>
          </div>
        </div>

        {/* Quick selector dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', marginRight: '6px' }}>Select Starter:</span>
          {STARTER_PROJECTS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedStarter(p)}
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '12px',
                background: selectedStarter.id === p.id ? 'var(--tw-brand)' : 'rgba(213, 228, 240, 0.45)',
                color: selectedStarter.id === p.id ? '#ffffff' : 'var(--tw-text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {idx + 1}. {p.title.split(' ')[0]} {p.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
