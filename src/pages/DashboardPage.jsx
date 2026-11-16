import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { STARTER_PROJECTS } from '../data/starterProjects';
import { exportProjectsJson, importProjectsJson } from '../services/projectStorage';
import {
  Plus,
  Search,
  FolderOpen,
  GitFork,
  Trash2,
  Download,
  Upload,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
  Mic
} from 'lucide-react';
import {
  TracewiseBubbleArea,
  TracewiseBubbleButton,
  TracewiseBubbleIconButton
} from '../components/ui/BubbleActions';

export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, createNewProject, forkActive, deleteProject, loadProject } = useProject();
  const [search, setSearch] = useState('');
  const [importError, setImportError] = useState('');

  const filteredProjects = (projects || []).filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = () => {
    const newProj = createNewProject('Untitled Circuit');
    navigate(`/app/studio/${newProj.id}`);
  };

  const handleOpen = (proj) => {
    loadProject(proj.id);
    navigate(`/app/studio/${proj.id}`);
  };

  const handleFork = (e, proj) => {
    e.stopPropagation();
    loadProject(proj.id);
    const forked = forkActive(`${proj.title} (Remix)`);
    if (forked) {
      navigate(`/app/studio/${forked.id}`);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportProjectsJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tracewise_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importProjectsJson(event.target.result);
        window.location.reload();
      } catch (err) {
        setImportError('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Header */}
      <header
        style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--tw-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/assets/brand/tracewise-logo.png" alt="Tracewise" style={{ height: '30px' }} />
        </Link>

        {/* Global Navigation in Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/app" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--tw-brand)' }}>
            My Projects
          </Link>
          <Link to="/projects" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tw-text-secondary)' }}>
            Explore Starters
          </Link>
          <Link to="/learn" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tw-text-secondary)' }}>
            Practice Lab
          </Link>
          <Link to="/settings" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tw-text-secondary)' }}>
            Settings
          </Link>
        </div>

        {/* Create Project Button with Soap Bubble UI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TracewiseBubbleArea theme="light">
            <TracewiseBubbleButton
              onClick={handleCreateNew}
              variant="primary"
              size="sm"
            >
              <Plus size={15} />
              <span>New Project</span>
            </TracewiseBubbleButton>
          </TracewiseBubbleArea>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', padding: '36px 24px 60px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Title & Action Cluster */}
        <TracewiseBubbleArea theme="light">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Engineering Studio
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--tw-text)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                My Projects & Remixes
              </h1>
              <p style={{ fontSize: '0.96rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
                Open your saved circuits, test your modifications, and compare versions.
              </p>
            </div>

            {/* Search & Import/Export with Bubble UI */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--tw-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '8px 14px 8px 34px',
                    borderRadius: 'var(--tw-radius-pill)',
                    border: '1px solid var(--tw-border)',
                    backgroundColor: '#ffffff',
                    fontSize: '0.86rem',
                    width: '210px',
                    fontFamily: 'var(--font-ui)'
                  }}
                />
              </div>

              <TracewiseBubbleButton
                onClick={handleExport}
                title="Export all projects to JSON"
                variant="secondary"
                size="sm"
              >
                <Download size={14} />
                <span>Export</span>
              </TracewiseBubbleButton>

              <label style={{ display: 'inline-flex' }}>
                <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
                <TracewiseBubbleButton
                  as="span"
                  variant="secondary"
                  size="sm"
                  title="Import projects from JSON"
                  style={{ pointerEvents: 'none' }}
                >
                  <Upload size={14} />
                  <span>Import</span>
                </TracewiseBubbleButton>
              </label>
            </div>
          </div>
        </TracewiseBubbleArea>

        {importError && (
          <div style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '0.86rem' }}>
            {importError}
          </div>
        )}

        {/* Project Grid with Bubble UI buttons */}
        <TracewiseBubbleArea theme="light">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleOpen(proj)}
                className="glass-card"
                style={{
                  padding: '22px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  borderRadius: '20px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--tw-brand)',
                        backgroundColor: 'var(--tw-brand-soft)',
                        padding: '3px 8px',
                        borderRadius: '8px'
                      }}
                    >
                      {proj.version?.label || 'v1.0'}
                    </span>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <TracewiseBubbleIconButton
                        onClick={(e) => handleFork(e, proj)}
                        size="sm"
                        variant="ghost"
                        title="Fork an independent remix"
                      >
                        <GitFork size={15} />
                      </TracewiseBubbleIconButton>

                      <TracewiseBubbleIconButton
                        onClick={(e) => handleDelete(e, proj.id)}
                        size="sm"
                        variant="danger"
                        title="Delete project"
                        style={{ marginLeft: '2px' }}
                      >
                        <Trash2 size={15} />
                      </TracewiseBubbleIconButton>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
                    {proj.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proj.description || 'Custom Arduino circuit project.'}
                  </p>
                </div>

                {/* Card Footer with real metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--tw-border)', marginTop: '12px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} />
                    <span>
                      {(proj.components || []).length} parts • {(proj.connections || []).length} wires
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Link
                      to={`/app/pitch/${proj.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--tw-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--tw-bg)'
                      }}
                      title="Open Project Pitch Lab"
                    >
                      <Mic size={13} color="var(--tw-brand)" />
                      <span>Pitch Lab</span>
                    </Link>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--tw-brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Open Studio <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TracewiseBubbleArea>

        {/* Curated Starters Section */}
        <section style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-display)' }}>
                Curated Electronics Starters
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-muted)' }}>
                Tested circuits ready for experimentation, modification, and physical building.
              </p>
            </div>
            <Link to="/projects" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--tw-brand)' }}>
              Explore All Starters →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {STARTER_PROJECTS.map((starter) => (
              <div
                key={starter.id}
                onClick={() => handleOpen(starter)}
                className="glass-card"
                style={{
                  padding: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  borderRadius: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tw-brand)' }}>
                    {starter.category}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                    {starter.level}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-display)' }}>
                  {starter.title}
                </h4>

                <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45 }}>
                  {starter.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--tw-border)' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                    {starter.components.length} parts
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-brand)' }}>
                    Launch →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
