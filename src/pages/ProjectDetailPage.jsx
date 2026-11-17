import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  Cpu,
  Layers,
  Edit3,
  Trash2,
  Share2,
  Copy,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Code as CodeIcon,
  Camera,
  ExternalLink,
  Plus,
  Clock,
  Shield,
  Upload
} from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import { TracewiseBubbleButton, TracewiseBubbleIconButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';
import { generateScienceFairChecklist, extractProjectContext } from '../domain/pitch/pitchEngine';
import { uploadMediaAttachment, validateMediaFile } from '../services/mediaStorageService';
import { hasEditableCircuit } from '../domain/projectSchema';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, activeProject, loadProject, updateActiveProject, deleteProject, saveCurrent, convertToEditable } = useProject();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'components' | 'evidence' | 'code' | 'gallery'
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Load target project
  useEffect(() => {
    let p = projects.find(item => item.id === projectId);
    if (!p && activeProject?.id === projectId) {
      p = activeProject;
    }
    if (!p) {
      p = loadProject(projectId);
    }
    if (p) {
      setProject(p);
      setEditForm(JSON.parse(JSON.stringify(p)));
    }
  }, [projectId, projects, activeProject]);

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#071831', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center', backgroundColor: '#0a1f40', padding: '36px', borderRadius: '16px', border: '1px solid rgba(45, 197, 233, 0.25)' }}>
          <AlertCircle size={40} color="#38bdf8" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Project Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            We could not find the physical project with ID <code>{projectId}</code>.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              to="/app"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.86rem'
              }}
            >
              Return to My Projects
            </Link>
            <Link
              to="/app/projects/new-existing"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#2dc5e9',
                color: '#071831',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.86rem'
              }}
            >
              Add Existing Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const checklist = generateScienceFairChecklist(extractProjectContext(project));
  const completedChecklistCount = checklist.filter(c => c.completed).length;

  const handleSaveEdit = () => {
    if (!editForm.title.trim()) {
      alert('Project title cannot be empty.');
      return;
    }

    updateActiveProject(prev => {
      const updated = {
        ...prev,
        ...editForm,
        updatedAt: new Date().toISOString()
      };
      setProject(updated);
      return updated;
    });

    saveCurrent();
    setIsEditing(false);
    setSaveMessage('Project details saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleDeleteProject = () => {
    if (window.confirm(`Permanently delete "${project.title}"? This action cannot be undone.`)) {
      deleteProject(project.id);
      navigate('/app');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Add component in edit modal
  const handleAddComponent = () => {
    setEditForm(prev => ({
      ...prev,
      componentsList: [
        ...(prev.componentsList || []),
        { id: 'c_' + Date.now(), name: '', quantity: 1, purpose: '' }
      ]
    }));
  };

  const handleRemoveComponent = (id) => {
    setEditForm(prev => ({
      ...prev,
      componentsList: (prev.componentsList || []).filter(c => c.id !== id)
    }));
  };

  const handleUpdateComponent = (id, field, val) => {
    setEditForm(prev => ({
      ...prev,
      componentsList: (prev.componentsList || []).map(c =>
        c.id === id ? { ...c, [field]: val } : c
      )
    }));
  };

  // Upload photo directly to project
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    setUploadError('');

    for (const file of files) {
      const check = validateMediaFile(file);
      if (!check.valid) {
        setUploadError(check.error);
        setIsUploading(false);
        return;
      }
      try {
        const uploaded = await uploadMediaAttachment(file, user?.uid);
        const newMedia = {
          id: uploaded.id || 'att_' + Date.now(),
          name: uploaded.name || file.name,
          url: uploaded.url,
          type: 'image',
          size: file.size
        };

        const updated = {
          ...project,
          mediaAttachments: [...(project.mediaAttachments || []), newMedia],
          updatedAt: new Date().toISOString()
        };
        setProject(updated);
        updateActiveProject(updated);
        saveCurrent();
      } catch (err) {
        setUploadError(err.message || 'Upload error');
      }
    }
    setIsUploading(false);
  };

  const coverPhoto = project.mediaAttachments?.[0]?.url;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#071831', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          height: '64px',
          backgroundColor: '#0a1f40',
          borderBottom: '1px solid rgba(45, 197, 233, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/app"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#94a3b8',
              fontSize: '0.86rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)'
            }}
          >
            <ArrowLeft size={15} />
            <span>My Projects</span>
          </Link>
          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Project Overview</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Print or export summary"
          >
            <Printer size={14} />
            <span>Export / Print</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Edit3 size={14} />
            <span>Edit Project</span>
          </button>

          <TracewiseBubbleButton
            to={`/app/reconstruct?projectId=${project.id}`}
            variant="secondary"
            size="sm"
            title="Reconstruct editable circuit from photographs"
            style={{ gap: '6px' }}
          >
            <Camera size={14} color="#38bdf8" />
            <span>Reconstruct Photos</span>
          </TracewiseBubbleButton>

          {hasEditableCircuit(project) ? (
            <TracewiseBubbleButton
              to={`/app/studio/${project.id}`}
              variant="accent"
              size="sm"
              style={{ gap: '6px' }}
            >
              <Cpu size={14} />
              <span>Open in Studio →</span>
            </TracewiseBubbleButton>
          ) : (
            <button
              type="button"
              onClick={() => {
                const converted = convertToEditable(project.id);
                if (converted) {
                  navigate(`/app/studio/${converted.id}`);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Attach an editable circuit & code workspace"
            >
              <Cpu size={14} />
              <span>Convert to Editable</span>
            </button>
          )}

          <TracewiseBubbleButton
            to={`/app/pitch/${project.id}`}
            variant="primary"
            size="sm"
          >
            <Mic size={14} />
            <span>Open Pitch Lab →</span>
          </TracewiseBubbleButton>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '32px 20px 80px' }}>
        
        {saveMessage && (
          <div style={{ marginBottom: '20px', padding: '12px 18px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Project Header Banner */}
        <div
          style={{
            backgroundColor: '#0a1f40',
            border: '1px solid rgba(45, 197, 233, 0.25)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(45, 197, 233, 0.2)',
                    color: '#38bdf8',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700
                  }}
                >
                  {project.hardwarePlatform || 'Physical Build'}
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 600
                  }}
                >
                  {project.projectStatus === 'working_prototype' ? 'Working Prototype' : project.projectStatus || 'Documented'}
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                >
                  {project.category || 'General'}
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {project.title}
              </h1>

              <p style={{ fontSize: '0.96rem', color: '#cbd5e1', lineHeight: 1.6, maxWidth: '780px' }}>
                {project.description || 'No description provided.'}
              </p>
            </div>

            {/* Quick Readiness Score Widget */}
            <div
              style={{
                backgroundColor: '#071831',
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(45, 197, 233, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '220px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Science Fair Readiness</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8' }}>
                  {completedChecklistCount}/{checklist.length}
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round((completedChecklistCount / checklist.length) * 100)}%`,
                    backgroundColor: '#2dc5e9',
                    borderRadius: '3px'
                  }}
                />
              </div>
              <Link
                to={`/app/pitch/${project.id}`}
                style={{
                  fontSize: '0.76rem',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px'
                }}
              >
                <Sparkles size={12} />
                <span>Practice Pitch & Judge Q&A →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'overview', label: 'Overview & Principle' },
            { id: 'components', label: `Components BOM (${(project.componentsList || []).length})` },
            { id: 'evidence', label: 'Testing & Challenges' },
            { id: 'gallery', label: `Photos & Media (${(project.mediaAttachments || []).length})` },
            { id: 'code', label: `Source Code (${(project.sourceFiles || []).length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.88rem',
                borderBottom: activeTab === tab.id ? '2px solid #2dc5e9' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & PRINCIPLE */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Left Column: Problem, Solution, Working Principle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  Problem Being Solved
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {project.problemSolved || 'No specific problem recorded yet. Click Edit Project to add one.'}
                </p>
              </div>

              <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  Target Audience
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {project.targetAudience || 'General community and users.'}
                </p>
              </div>

              <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  Working Principle
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {project.workingPrinciple || 'The microcontroller evaluates sensor telemetry and triggers outputs in real time.'}
                </p>
              </div>

              <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  Live Demonstration Plan
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {project.demonstrationPlan || 'Demonstrate the physical build to science fair judges using a sample input sequence.'}
                </p>
              </div>
            </div>

            {/* Right Column: Readiness Checklist & Pitch Lab Quick Start */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
                  Science Fair Checklist
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {checklist.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.86rem' }}>
                      <CheckCircle2 size={16} color={item.completed ? '#4ade80' : '#64748b'} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: item.completed ? '#ffffff' : '#94a3b8' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pitch Lab Direct Action Card */}
              <div style={{ backgroundColor: 'linear-gradient(180deg, #0e2954 0%, #071831 100%)', border: '1px solid rgba(45, 197, 233, 0.4)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                <Mic size={32} color="#38bdf8" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                  Prepare Your Presentation
                </h4>
                <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
                  Generate your 30s elevator pitch, 2-minute science fair presentation, practice answering judge questions, and rehearse with cue cards.
                </p>
                <TracewiseBubbleButton
                  to={`/app/pitch/${project.id}`}
                  variant="primary"
                  size="md"
                  style={{ width: '100%' }}
                >
                  <Sparkles size={14} />
                  <span>Launch Pitch Lab →</span>
                </TracewiseBubbleButton>
              </div>

              {/* Danger Zone: Delete Project */}
              <div style={{ padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f87171' }}>Delete Project</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Permanently remove this documentation.</div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPONENTS BOM */}
        {activeTab === 'components' && (
          <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Bill of Materials (BOM)</h3>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                  Every hardware component, sensor, and actuator used in this physical build.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(45, 197, 233, 0.15)',
                  border: '1px solid rgba(45, 197, 233, 0.35)',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Edit / Add Parts
              </button>
            </div>

            {(project.componentsList || []).length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                No components listed yet. Click "+ Edit / Add Parts" to list your components.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(project.componentsList || []).map((comp, idx) => (
                  <div
                    key={comp.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#071831',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', width: '24px' }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
                          {comp.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {comp.purpose || 'General hardware element'}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}
                    >
                      Qty: {comp.quantity || 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TESTING EVIDENCE & CHALLENGES */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Actual Bench Trials & Testing Results
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                {project.testingEvidence || 'No testing measurements recorded yet. Add quantitative observations from your bench trials.'}
              </p>
            </div>

            <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Challenges Faced & Debugging Solutions
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                {project.challengesFaced || 'No specific debugging challenges documented yet. Explaining how you solved unexpected hardware hurdles impresses science fair judges.'}
              </p>
            </div>

            <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Future Engineering Roadmap
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                {project.futureImprovements || 'Custom PCB shield, enclosure prototyping, and telemetry upgrades.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: GALLERY & MEDIA */}
        {activeTab === 'gallery' && (
          <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Project Photographs & Diagrams</h3>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                  Visual evidence of your assembled physical prototype.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  id="tab-photo-upload"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="tab-photo-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#2dc5e9',
                    color: '#071831',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={14} />
                  <span>{isUploading ? 'Uploading...' : 'Add Photos'}</span>
                </label>
              </div>
            </div>

            {uploadError && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '12px' }}>{uploadError}</p>
            )}

            {(project.mediaAttachments || []).length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                No photographs attached yet. Click "Add Photos" to attach bench photos of your build.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {(project.mediaAttachments || []).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(45, 197, 233, 0.25)',
                      backgroundColor: '#071831',
                      height: '180px'
                    }}
                  >
                    <img
                      src={m.url}
                      alt={m.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SOURCE CODE */}
        {activeTab === 'code' && (
          <div style={{ backgroundColor: '#0a1f40', border: '1px solid rgba(45, 197, 233, 0.22)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              Microcontroller Source Code
            </h3>

            {(project.sourceFiles || []).length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                No firmware uploaded yet. Click "Edit Project" to attach your .ino or .cpp sketch.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(project.sourceFiles || []).map((sf, idx) => (
                  <div key={idx} style={{ backgroundColor: '#071831', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ padding: '10px 16px', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#38bdf8' }}>{sf.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sf.code || '');
                          alert('Source code copied to clipboard!');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Copy size={12} />
                        <span>Copy Code</span>
                      </button>
                    </div>
                    <pre
                      style={{
                        padding: '16px',
                        margin: 0,
                        fontSize: '0.82rem',
                        fontFamily: 'var(--font-code)',
                        color: '#cbd5e1',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        lineHeight: 1.5
                      }}
                    >
                      {sf.code}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* NON-DESTRUCTIVE EDIT MODAL */}
      {isEditing && editForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0a1f40',
              border: '1px solid rgba(45, 197, 233, 0.35)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Edit Project Details</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                Title
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071831', border: '1px solid rgba(45, 197, 233, 0.3)', borderRadius: '8px', color: '#ffffff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                Short Description
              </label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071831', border: '1px solid rgba(45, 197, 233, 0.3)', borderRadius: '8px', color: '#ffffff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  Hardware Platform
                </label>
                <select
                  value={editForm.hardwarePlatform}
                  onChange={(e) => setEditForm(prev => ({ ...prev, hardwarePlatform: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071831', border: '1px solid rgba(45, 197, 233, 0.3)', borderRadius: '8px', color: '#ffffff' }}
                >
                  <option value="ESP32">ESP32 (Wi-Fi / BT)</option>
                  <option value="Arduino Uno">Arduino Uno</option>
                  <option value="Arduino Nano">Arduino Nano</option>
                  <option value="Raspberry Pi">Raspberry Pi</option>
                  <option value="Custom Hardware">Custom Hardware</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={editForm.projectStatus}
                  onChange={(e) => setEditForm(prev => ({ ...prev, projectStatus: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071831', border: '1px solid rgba(45, 197, 233, 0.3)', borderRadius: '8px', color: '#ffffff' }}
                >
                  <option value="working_prototype">Working Prototype</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="needs_improvement">Needs Improvement</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                Working Principle
              </label>
              <textarea
                rows={3}
                value={editForm.workingPrinciple || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, workingPrinciple: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071831', border: '1px solid rgba(45, 197, 233, 0.3)', borderRadius: '8px', color: '#ffffff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                Testing Evidence
              </label>
              <textarea
                rows={3}
                value={editForm.testingEvidence || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, testingEvidence: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071831', border: '1px solid rgba(45, 197, 233, 0.3)', borderRadius: '8px', color: '#ffffff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                Challenges Faced & Solutions
              </label>
              <textarea
                rows={2}
                value={editForm.challengesFaced || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, challengesFaced: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071831', border: '1px solid rgba(45, 197, 233, 0.3)', borderRadius: '8px', color: '#ffffff' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#2dc5e9', border: 'none', color: '#071831', cursor: 'pointer', fontWeight: 700 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
