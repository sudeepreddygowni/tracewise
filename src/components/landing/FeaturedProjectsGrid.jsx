import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { STARTER_PROJECTS } from '../../data/starterProjects';
import { useProject } from '../../store/useProjectStore';
import { Play, GitFork, ArrowRight, Cpu, Layers } from 'lucide-react';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../ui/BubbleActions';

export function FeaturedProjectsGrid() {
  const navigate = useNavigate();
  const { loadProject, forkActive } = useProject();

  // Curate 6 high-impact featured starters
  const featured = STARTER_PROJECTS.slice(0, 6);

  const handleOpenStudio = (starter) => {
    loadProject(starter.id);
    navigate(`/app/studio/${starter.id}`);
  };

  const handleForkRemix = (starter) => {
    loadProject(starter.id);
    const forked = forkActive(`${starter.title} (Remix)`);
    if (forked) {
      navigate(`/app/studio/${forked.id}`);
    } else {
      navigate(`/app/studio/${starter.id}`);
    }
  };

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' };
      case 'intermediate':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
      default:
        return { bg: 'rgba(45, 197, 233, 0.15)', text: '#38bdf8', border: 'rgba(45, 197, 233, 0.3)' };
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <TracewiseBubbleArea theme="dark">
        {/* Responsive Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
        <div
          className="featured-projects-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}
        >
          {featured.map((starter) => {
            const diffStyle = getDifficultyColor(starter.level);
            const compCount = (starter.components || []).length;
            const wireCount = (starter.connections || []).length;

            return (
              <div
                key={starter.id}
                style={{
                  backgroundColor: '#0a1f40',
                  borderRadius: '20px',
                  border: '1px solid rgba(45, 197, 233, 0.2)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(45, 197, 233, 0.5)';
                  e.currentTarget.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(45, 197, 233, 0.2)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.35)';
                }}
              >
                {/* Thumbnail Preview Banner */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '175px',
                    backgroundColor: '#071831',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={starter.thumbnail || '/assets/starters/traffic-light.webp'}
                    alt={starter.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.9,
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      // Fallback visual if webp fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(7, 24, 49, 0.1) 0%, rgba(10, 31, 64, 0.85) 100%)'
                    }}
                  />

                  {/* Level & Category badges */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      display: 'flex',
                      gap: '8px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '12px',
                        backgroundColor: diffStyle.bg,
                        color: diffStyle.text,
                        border: `1px solid ${diffStyle.border}`,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      {starter.level || 'Beginner'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(7, 24, 49, 0.75)',
                        color: 'var(--tw-cyan)',
                        border: '1px solid rgba(45, 197, 233, 0.3)',
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      {starter.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3
                      style={{
                        fontSize: '1.18rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        margin: '0 0 8px',
                        lineHeight: 1.3
                      }}
                    >
                      {starter.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.86rem',
                        color: '#94a3b8',
                        lineHeight: 1.5,
                        margin: '0 0 16px'
                      }}
                    >
                      {starter.description}
                    </p>

                    {/* Circuit Specs Pill */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.76rem',
                        color: '#cbd5e1',
                        paddingBottom: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        marginBottom: '16px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Cpu size={13} color="var(--tw-cyan)" />
                        <span>{compCount} components</span>
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={13} color="var(--tw-cyan)" />
                        <span>{wireCount} wires</span>
                      </span>
                      <span>•</span>
                      <span style={{ color: '#94a3b8' }}>Arduino Uno R3</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <TracewiseBubbleButton
                      onClick={() => handleForkRemix(starter)}
                      variant="ghost"
                      size="sm"
                      style={{
                        flex: 1,
                        color: '#cbd5e1',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <GitFork size={14} />
                      <span>Remix</span>
                    </TracewiseBubbleButton>

                    <TracewiseBubbleButton
                      onClick={() => handleOpenStudio(starter)}
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 }}
                    >
                      <Play size={14} />
                      <span>Open in Studio</span>
                    </TracewiseBubbleButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Projects Link */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--tw-cyan)',
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              padding: '10px 24px',
              borderRadius: '24px',
              backgroundColor: 'rgba(45, 197, 233, 0.1)',
              border: '1px solid rgba(45, 197, 233, 0.25)',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(45, 197, 233, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(45, 197, 233, 0.1)'}
          >
            <span>Explore All Curated Starter Projects</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </TracewiseBubbleArea>
    </div>
  );
}
