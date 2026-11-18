import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FanGallery } from '../fan-gallery';
import { ArrowRight, GitFork, Play } from 'lucide-react';
import { STARTER_PROJECTS } from '../../data/starterProjects';
import { useProject } from '../../store/useProjectStore';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../ui/BubbleActions';

export function TracewiseProjectGallery() {
  const navigate = useNavigate();
  const { forkActive, loadProject } = useProject();
  const [selectedStarter, setSelectedStarter] = useState(STARTER_PROJECTS[0]);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Canonical items mapped 1:1 with STARTER_PROJECTS array
  const items = STARTER_PROJECTS.map((p) => ({
    src: p.thumbnail,
    alt: `${p.title} — ${p.category} (${p.level})`
  }));

  const cardWidth = windowWidth < 480 ? 116 : windowWidth < 768 ? 138 : 162;
  const lift = windowWidth < 480 ? 28 : 42;

  const handleOpenStudio = (starter) => {
    loadProject(starter.id);
    navigate(`/app/studio/${starter.id}`);
  };

  const handleFork = (starter) => {
    loadProject(starter.id);
    const forked = forkActive(`${starter.title} (Remix)`);
    if (forked) {
      navigate(`/app/studio/${forked.id}`);
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Official Fan Gallery with specified exact settings */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 28px', overflow: 'hidden' }}>
        <FanGallery
          items={items}
          cardWidth={cardWidth}
          aspectRatio={0.8}
          spacing={0.69}
          curve={0.14}
          tilt={14.5}
          lift={lift}
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

      {/* Featured Starter Quick Action Card with Bubble UI */}
      <TracewiseBubbleArea theme="light" style={{ maxWidth: '740px', margin: '0 auto' }}>
        <div
          className="glass-card"
          style={{
            padding: windowWidth < 600 ? '18px 16px' : '24px 32px',
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 20px 48px rgba(11, 35, 72, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderRadius: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ flex: '1 1 340px' }}>
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
              <h3 style={{ fontSize: '1.35rem', color: 'var(--tw-text)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {selectedStarter.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                {selectedStarter.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TracewiseBubbleButton
                onClick={() => handleFork(selectedStarter)}
                variant="secondary"
                size="sm"
              >
                <GitFork size={15} />
                <span>Fork Remix</span>
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={() => handleOpenStudio(selectedStarter)}
                variant="primary"
                size="sm"
              >
                <Play size={15} />
                <span>Open in Studio</span>
              </TracewiseBubbleButton>
            </div>
          </div>

          {/* Quick selector dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--tw-border)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', marginRight: '6px' }}>Select Starter:</span>
            {STARTER_PROJECTS.map((p, idx) => (
              <TracewiseBubbleButton
                key={p.id}
                onClick={() => setSelectedStarter(p)}
                size="sm"
                variant={selectedStarter.id === p.id ? 'primary' : 'ghost'}
                active={selectedStarter.id === p.id}
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  minHeight: '1.8rem'
                }}
              >
                {idx + 1}. {p.title.split(' ')[0]} {p.title.split(' ')[1] || ''}
              </TracewiseBubbleButton>
            ))}
          </div>
        </div>
      </TracewiseBubbleArea>
    </div>
  );
}
