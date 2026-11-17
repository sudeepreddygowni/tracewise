import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Camera,
  Upload,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Cpu,
  Trash2,
  Edit2,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sliders,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import {
  analyzeProjectPhoto,
  createEditableProjectFromReconstruction,
  CERTAINTY_LEVELS,
  RECONSTRUCTION_STATUS,
  validateReconstructionImage
} from '../services/aiVisionReconstruction';
import { TracewiseBubbleButton, TracewiseBubbleIconButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';
import { saveProject } from '../services/projectStorage';

// High-fidelity demo photo options for students without immediate camera access
const DEMO_PHOTOS = [
  {
    id: 'demo-car',
    name: 'Obstacle-Avoiding Robot Car (ESP32 / TT Motors)',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    hardwarePlatform: 'ESP32',
    category: 'robotics'
  },
  {
    id: 'demo-breadboard',
    name: 'Arduino Uno Breadboard Circuit',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    hardwarePlatform: 'Arduino Uno',
    category: 'electronics'
  }
];

export function PhotoReconstructionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const { projects, activeProject, loadProject } = useProject();
  const { user } = useAuth();

  // Active or base project if launched from existing project
  const [baseProject, setBaseProject] = useState(null);

  // Upload & Vision State
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
  const [selectedPhotoName, setSelectedPhotoName] = useState('project_photo.jpg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Interactive Review State
  const [candidates, setCandidates] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'wiring' | 'questions'
  const [projectTitle, setProjectTitle] = useState('Reconstructed Engineering Project');
  const [hardwarePlatform, setHardwarePlatform] = useState('ESP32');
  const [category, setCategory] = useState('robotics');

  // Photo viewer zoom & pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  // Load base project if query param exists
  useEffect(() => {
    if (projectIdParam) {
      let p = projects.find(item => item.id === projectIdParam);
      if (!p && activeProject?.id === projectIdParam) p = activeProject;
      if (!p) p = loadProject(projectIdParam);
      if (p) {
        setBaseProject(p);
        setProjectTitle(p.title ? `${p.title} (Reconstructed)` : 'Reconstructed Project');
        if (p.hardwarePlatform) setHardwarePlatform(p.hardwarePlatform);
        if (p.category) setCategory(p.category);
        if (p.mediaAttachments?.[0]?.url) {
          handleAnalyzeUrl(p.mediaAttachments[0].url, p.mediaAttachments[0].name || 'project_photo.jpg');
        }
      }
    }
  }, [projectIdParam, projects, activeProject]);

  // Image Upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateReconstructionImage(file);
    if (!check.valid) {
      setErrorMessage(check.error);
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = () => {
      handleAnalyzeUrl(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Run Vision Reconstruction
  const handleAnalyzeUrl = async (url, name) => {
    setSelectedPhotoUrl(url);
    setSelectedPhotoName(name);
    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const result = await analyzeProjectPhoto(url, {
        fileName: name,
        codeHint: baseProject?.sourceFiles?.[0]?.code || '',
        userNotes: baseProject?.description || ''
      });

      setAnalysisResult(result);
      setCandidates(result.candidates || []);
      setConnections(result.provisionalConnections || []);
      if (result.hardwarePlatform) setHardwarePlatform(result.hardwarePlatform);
      if (result.category) setCategory(result.category);
      if (result.candidates?.[0]) setSelectedCandidateId(result.candidates[0].provisionalId);
    } catch (err) {
      setErrorMessage(err.message || 'Vision analysis failed. Please try a clearer photograph.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Candidate modifications
  const handleToggleCandidateConfirm = (id) => {
    setCandidates(prev => prev.map(c =>
      c.provisionalId === id ? { ...c, confirmed: !c.confirmed, needsReview: false } : c
    ));
  };

  const handleRemoveCandidate = (id) => {
    setCandidates(prev => prev.filter(c => c.provisionalId !== id));
    setConnections(prev => prev.filter(
      w => w.from?.componentId !== id && w.to?.componentId !== id
    ));
    if (selectedCandidateId === id) setSelectedCandidateId(null);
  };

  const handleUpdateCandidateName = (id, newName) => {
    setCandidates(prev => prev.map(c =>
      c.provisionalId === id ? { ...c, name: newName } : c
    ));
  };

  // Wire modifications
  const handleToggleWireConfirm = (id) => {
    setConnections(prev => prev.map(w =>
      w.id === id ? { ...w, confirmed: !w.confirmed, certainty: 'STUDENT_CONFIRMED' } : w
    ));
  };

  const handleRemoveWire = (id) => {
    setConnections(prev => prev.filter(w => w.id !== id));
  };

  // Generate Editable Project & Route to Studio
  const handleGenerateProject = () => {
    try {
      const newProj = createEditableProjectFromReconstruction({
        candidates,
        connections,
        photoMedia: selectedPhotoUrl ? [{ id: 'recon-photo-1', name: selectedPhotoName, url: selectedPhotoUrl, type: 'image' }] : [],
        title: projectTitle.trim() || 'Reconstructed Project',
        hardwarePlatform,
        category,
        baseProject
      });

      saveProject(newProj);
      // Route straight to Studio canvas with the newly created editable project
      navigate(`/app/studio/${newProj.id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to construct editable project.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#071831', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Application Bar */}
      <header
        style={{
          height: '60px',
          backgroundColor: '#0a1f40',
          borderBottom: '1px solid rgba(45, 197, 233, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to={baseProject ? `/app/projects/${baseProject.id}` : '/app'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#94a3b8',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} color="#38bdf8" />
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Photo-to-Project Circuit Reconstruction
            </h1>
          </div>
        </div>

        {/* Generate Project Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {analysisResult && (
            <TracewiseBubbleButton
              onClick={handleGenerateProject}
              variant="accent"
              size="sm"
              style={{ fontWeight: 700, gap: '6px' }}
            >
              <Cpu size={14} />
              <span>Generate Editable Project ({candidates.length} parts) →</span>
            </TracewiseBubbleButton>
          )}
        </div>
      </header>

      {/* Main Reconstruction Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* =========================================================================
            COLUMN 1: UPLOADED PHOTO & OPTICAL VISION INSPECTOR (35% Width)
        ========================================================================= */}
        <div
          style={{
            width: '35%',
            minWidth: '320px',
            backgroundColor: '#071831',
            borderRight: '1px solid rgba(74, 167, 242, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Column Header & Controls */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#0a1f40',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} color="#38bdf8" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                Hardware Photograph
              </span>
            </div>

            {selectedPhotoUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowBoundingBoxes(v => !v)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: showBoundingBoxes ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: showBoundingBoxes ? '#38bdf8' : '#94a3b8',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Toggle component bounding overlays"
                >
                  Boxes: {showBoundingBoxes ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(0.75, z - 0.25))}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  title="Reset Zoom"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Photo Canvas Area */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundColor: '#051226',
              padding: '16px'
            }}
          >
            {isAnalyzing ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <Sparkles size={36} color="#38bdf8" style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                  Scanning Multimodal Hardware Features...
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Detecting IC footprints, jumper wiring traces, and controller pinouts.
                </p>
              </div>
            ) : selectedPhotoUrl ? (
              <div
                style={{
                  position: 'relative',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease',
                  maxWidth: '100%'
                }}
              >
                <img
                  src={selectedPhotoUrl}
                  alt="Project Hardware"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
                  }}
                />

                {/* Bounding box overlays */}
                {showBoundingBoxes && candidates.map((cand) => {
                  const b = cand.boundingBox || { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
                  const isSelected = selectedCandidateId === cand.provisionalId;
                  return (
                    <div
                      key={cand.provisionalId}
                      onClick={() => setSelectedCandidateId(cand.provisionalId)}
                      style={{
                        position: 'absolute',
                        left: `${b.x * 100}%`,
                        top: `${b.y * 100}%`,
                        width: `${b.width * 100}%`,
                        height: `${b.height * 100}%`,
                        border: isSelected ? '2px solid #38bdf8' : '2px dashed rgba(56, 189, 248, 0.7)',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.08)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        transition: 'all 0.15s ease'
                      }}
                      title={`${cand.name} (${Math.round(cand.confidence * 100)}% match)`}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: -18,
                          left: 0,
                          backgroundColor: '#0a1f40',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cand.name.split(' ')[0]} ({Math.round(cand.confidence * 100)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: '360px', padding: '24px' }}>
                <Camera size={44} color="#38bdf8" style={{ marginBottom: '14px', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  Upload a Project Photograph
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                  Capture an overhead shot of your physical electronics, robot chassis, breadboard, or wiring harness.
                </p>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#38bdf8',
                    color: '#071831',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
                  }}
                >
                  <Upload size={16} />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Pre-loaded sample choices */}
                <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>
                    Or try a sample project photo:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {DEMO_PHOTOS.map(dp => (
                      <button
                        key={dp.id}
                        type="button"
                        onClick={() => handleAnalyzeUrl(dp.url, dp.name)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#e2e8f0',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ {dp.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2: PROPOSED CIRCUIT LAYOUT & SCHEMATIC VIEW (35% Width)
        ========================================================================= */}
        <div
          style={{
            width: '35%',
            minWidth: '320px',
            backgroundColor: '#0a1f40',
            borderRight: '1px solid rgba(74, 167, 242, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#071831',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} color="#38bdf8" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                Schematic Draft Layout
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              {candidates.length} components placed
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
              backgroundColor: '#081c38',
              position: 'relative'
            }}
          >
            {candidates.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>
                Upload a photograph on the left to generate candidate schematic components.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  Drag or select components to verify connections. Items with high optical confidence are pre-positioned.
                </div>

                {candidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.provisionalId;
                  return (
                    <div
                      key={cand.provisionalId}
                      onClick={() => setSelectedCandidateId(cand.provisionalId)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#071831',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                          {cand.category}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: cand.confirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: cand.confirmed ? '#10b981' : '#f59e0b',
                            fontWeight: 600
                          }}
                        >
                          {cand.confirmed ? '✓ Confirmed' : '⚠ Review Needed'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                        {cand.name}
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        Part: {cand.partNumber} • Match: <code>{cand.catalogMatch}</code>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            COLUMN 3: REVIEW PANEL & CERTAINTY AUDITOR (30% Width)
        ========================================================================= */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#071831',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Review Tab Navigation */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#0a1f40',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px'
            }}
          >
            {[
              { id: 'candidates', label: `Components (${candidates.length})` },
              { id: 'wiring', label: `Wiring & Nets (${connections.length})` },
              { id: 'questions', label: 'Hardware Q&A' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: activeTab === tab.id ? '1px solid #38bdf8' : '1px solid transparent',
                  color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
            {errorMessage && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '0.82rem' }}>
                {errorMessage}
              </div>
            )}

            {/* TAB 1: COMPONENTS AUDIT */}
            {activeTab === 'candidates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Confirm or correct recognized parts. Selected items highlight in the photograph.
                </div>

                {candidates.map((cand) => (
                  <div
                    key={cand.provisionalId}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#0a1f40',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={cand.name}
                        onChange={(e) => handleUpdateCandidateName(cand.provisionalId, e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: '#071831',
                          border: '1px solid rgba(74, 167, 242, 0.25)',
                          color: '#ffffff',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          marginRight: '8px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleCandidateConfirm(cand.provisionalId)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: cand.confirmed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid ' + (cand.confirmed ? '#10b981' : '#f59e0b'),
                          color: cand.confirmed ? '#10b981' : '#f59e0b',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {cand.confirmed ? '✓ Verified' : 'Confirm'}
                      </button>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      • <strong>Confidence:</strong> {Math.round(cand.confidence * 100)}%<br />
                      • <strong>Visual Evidence:</strong> {cand.evidence}
                    </div>

                    {cand.alternatives && cand.alternatives.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Alternatives: {cand.alternatives.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: WIRING & UNCERTAINTIES */}
            {activeTab === 'wiring' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.78rem', color: '#e0f2fe' }}>
                  <strong>Grounding Rule:</strong> Wires obscured beneath the chassis or inside breadboards are marked <em>Unconfirmed</em> and are not fabricated as verified facts.
                </div>

                {connections.map((w) => {
                  const cert = CERTAINTY_LEVELS[w.certainty] || CERTAINTY_LEVELS.UNCONFIRMED;
                  return (
                    <div
                      key={w.id}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: '#0a1f40',
                        border: `1px solid ${cert.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                          {w.from?.componentId?.slice(-6)}:{w.from?.pin} ↔ {w.to?.componentId?.slice(-6)}:{w.to?.pin}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: cert.badgeBg,
                            color: cert.color,
                            fontWeight: 700
                          }}
                        >
                          {cert.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {w.evidence}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleWireConfirm(w.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: w.confirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid ' + (w.confirmed ? '#10b981' : '#38bdf8'),
                            color: w.confirmed ? '#10b981' : '#38bdf8',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {w.confirmed ? '✓ Confirmed by Student' : 'Verify Wire'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveWire(w.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Remove Wire"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: HARDWARE QUESTIONS */}
            {activeTab === 'questions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Answer these quick hardware checks to resolve obscured chassis elements:
                </div>

                {(analysisResult?.studentQuestions || []).map((q) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#0a1f40',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                      {q.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {q.options.map((opt, i) => (
                        <label
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.78rem',
                            color: '#cbd5e1',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            defaultChecked={i === 0}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
