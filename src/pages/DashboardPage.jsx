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
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TracewiseBubbleArea, SoapBubbleButton } from '../components/ui/BubbleActions';

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
          <Link to="/app" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--tw-brand)' }}>
            My Projects
          </Link>
          <Link to="/projects" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--tw-text-secondary)' }}>
            Explore Starters
          </Link>
          <Link to="/learn" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--tw-text-secondary)' }}>
            Practice Lab
          </Link>
          <Link to="/settings" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--tw-text-secondary)' }}>
            Settings
          </Link>
        </div>

        {/* Create Project Button with Soap Bubble UI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TracewiseBubbleArea theme="light">
            <SoapBubbleButton onClick={handleCreateNew} style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
              + New Project
            </SoapBubbleButton>
          </TracewiseBubbleArea>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Title & Action Cluster */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Engineering Workspace
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '2px' }}>
              My Projects & Remixes
            </h1>
            <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
              Open your circuits, inspect version forks, and test modifications.
            </p>
          </div>

          {/* Search & Import/Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--tw-text-muted)' }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: 'var(--tw-radius-pill)',
                  border: '1px solid var(--tw-border)',
                  backgroundColor: '#ffffff',
                  fontSize: '0.84rem',
                  width: '200px'
                }}
              />
            </div>

            <button
              onClick={handleExport}
              title="Export all projects to JSON"
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <label
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem', cursor: 'pointer' }}
              title="Import projects from JSON"
            >
              <Upload size={14} />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {importError && (
          <div style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem' }}>
            {importError}
          </div>
        )}

        {/* Project Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => handleOpen(proj)}
              className="glass-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '190px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--tw-brand)',
                      backgroundColor: 'var(--tw-brand-soft)',
                      padding: '3px 8px',
                      borderRadius: '8px'
                    }}
                  >
                    {proj.version?.label || 'v1.0'}
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => handleFork(e, proj)}
                      title="Fork an independent copy"
                      style={{ padding: '5px', borderRadius: '6px', color: 'var(--tw-text-muted)' }}
                    >
                      <GitFork size={15} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, proj.id)}
                      title="Delete project"
                      style={{ padding: '5px', borderRadius: '6px', color: '#dc2626' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                  {proj.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {proj.description || 'Custom Arduino circuit project.'}
                </p>
              </div>

              {/* Card Footer with real metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--tw-border)', marginTop: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} />
                  <span>
                    {(proj.components || []).length} parts • {(proj.connections || []).length} wires
                  </span>
                </div>

                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Open Studio <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Curated Official Starters Section */}
        <section style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                Curated Electronics Starters
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--tw-text-muted)' }}>
                Pre-configured verified circuits ready for modification and experimentation.
              </p>
            </div>
            <Link to="/projects" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--tw-brand)' }}>
              View in Fan Gallery →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {STARTER_PROJECTS.map((starter) => (
              <div
                key={starter.id}
                onClick={() => handleOpen(starter)}
                className="glass-card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tw-brand)' }}>
                    {starter.category}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)' }}>
                    {starter.level}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                  {starter.title}
                </h4>

                <p style={{ fontSize: '0.78rem', color: 'var(--tw-text-secondary)', lineHeight: 1.4 }}>
                  {starter.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>
                    {starter.components.length} parts
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-brand)' }}>
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
