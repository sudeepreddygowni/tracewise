import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Cpu,
  Layers,
  Upload,
  Image as ImageIcon,
  Code as CodeIcon,
  CheckCircle2,
  Trash2,
  Plus,
  AlertCircle,
  HelpCircle,
  FileText,
  Clock,
  Mic,
  Camera,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import { uploadMediaAttachment, validateMediaFile } from '../services/mediaStorageService';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../components/ui/BubbleActions';

const DRAFT_STORAGE_KEY = 'tracewise_new_existing_project_draft';

export function NewExistingProjectPage() {
  const navigate = useNavigate();
  const { createPhysicalProject } = useProject();
  const { user } = useAuth();

  // Form State initialized with draft if available
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      title: '',
      description: '',
      hardwarePlatform: 'ESP32',
      category: 'robotics',
      projectStatus: 'working_prototype',
      problemSolved: '',
      targetAudience: '',
      workingPrinciple: '',
      codeSummary: '',
      challengesFaced: '',
      testingEvidence: '',
      demonstrationPlan: '',
      futureImprovements: '',
      componentsList: [
        { id: 'c1', name: '', quantity: 1, purpose: '' }
      ],
      mediaAttachments: [],
      sourceFiles: [],
      links: []
    };
  });

  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Basics, 2: Technical & BOM, 3: Evidence & Pitch
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Autosave draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {}
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Component BOM handlers
  const handleAddComponent = () => {
    setFormData(prev => ({
      ...prev,
      componentsList: [
        ...prev.componentsList,
        { id: 'c_' + Date.now(), name: '', quantity: 1, purpose: '' }
      ]
    }));
  };

  const handleUpdateComponent = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      componentsList: prev.componentsList.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveComponent = (id) => {
    setFormData(prev => ({
      ...prev,
      componentsList: prev.componentsList.filter(item => item.id !== id)
    }));
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadError('');
    setIsUploading(true);

    for (const file of files) {
      const check = validateMediaFile(file);
      if (!check.valid) {
        setUploadError(check.error);
        setIsUploading(false);
        return;
      }

      try {
        const uploaded = await uploadMediaAttachment(file, user?.uid);
        setFormData(prev => ({
          ...prev,
          mediaAttachments: [
            ...prev.mediaAttachments,
            {
              id: uploaded.id || 'att_' + Date.now(),
              name: uploaded.name || file.name,
              url: uploaded.url,
              type: uploaded.type || 'image',
              size: file.size
            }
          ]
        }));
      } catch (err) {
        setUploadError(err.message || 'Image upload failed. Using local preview.');
      }
    }
    setIsUploading(false);
  };

  const handleRemoveMedia = (id) => {
    setFormData(prev => ({
      ...prev,
      mediaAttachments: prev.mediaAttachments.filter(m => m.id !== id)
    }));
  };

  // Source code file upload handler
  const handleCodeFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result || '';
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let lang = 'cpp';
      if (ext === 'py') lang = 'python';
      else if (ext === 'ino' || ext === 'cpp' || ext === 'c' || ext === 'h') lang = 'cpp';

      setFormData(prev => ({
        ...prev,
        sourceFiles: [
          ...prev.sourceFiles,
          {
            name: file.name,
            code: content,
            language: lang
          }
        ]
      }));
    };
    reader.readAsText(file);
  };

  const handleRemoveSourceFile = (idx) => {
    setFormData(prev => ({
      ...prev,
      sourceFiles: prev.sourceFiles.filter((_, i) => i !== idx)
    }));
  };

  // Optional AI Extraction helper
  const handleRunAiExtraction = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      // Analyze current fields or uploaded code
      const currentCode = formData.sourceFiles[0]?.code || '';
      let detectedComponents = [];

      if (/WiFi|Bluetooth|esp_now/i.test(currentCode)) {
        detectedComponents.push({ id: 'c_wifi', name: 'ESP32 Wi-Fi / Bluetooth Module', quantity: 1, purpose: 'Wireless telemetry & control' });
      }
      if (/servo|attach/i.test(currentCode)) {
        detectedComponents.push({ id: 'c_servo', name: 'Micro Servo (SG90)', quantity: 1, purpose: 'Steering or robotic articulation' });
      }
      if (/trig|echo|sonar/i.test(currentCode)) {
        detectedComponents.push({ id: 'c_sonar', name: 'HC-SR04 Ultrasonic Distance Sensor', quantity: 1, purpose: 'Obstacle distance measurement' });
      }
      if (/dht|temperature/i.test(currentCode)) {
        detectedComponents.push({ id: 'c_temp', name: 'DHT11 / DHT22 Sensor', quantity: 1, purpose: 'Ambient environmental telemetry' });
      }

      setFormData(prev => ({
        ...prev,
        componentsList: detectedComponents.length > 0
          ? [...prev.componentsList.filter(c => c.name.trim()), ...detectedComponents]
          : prev.componentsList,
        workingPrinciple: prev.workingPrinciple || (detectedComponents.length > 0 ? `The ${prev.hardwarePlatform} microcontroller reads input telemetry from connected sensors, evaluates distance and threshold conditions, and coordinates outputs via digital pins.` : prev.workingPrinciple)
      }));
      setAiAnalyzing(false);
      setShowAiSuggestions(true);
    }, 600);
  };

  // Form submit -> Create project and route to Pitch Lab
  const handleSubmit = (targetDestination = 'pitch') => {
    if (!formData.title.trim()) {
      alert('Please enter a project title to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean empty component entries
      const cleanedComponents = formData.componentsList.filter(c => c.name && c.name.trim());

      const created = createPhysicalProject({
        ...formData,
        componentsList: cleanedComponents,
        title: formData.title.trim()
      });

      // Clear draft storage
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}

      if (targetDestination === 'pitch') {
        navigate(`/app/pitch/${created.id}?created=true`);
      } else {
        navigate(`/app/projects/${created.id}?created=true`);
      }
    } catch (err) {
      alert('Error creating project: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const handleClearDraft = () => {
    if (window.confirm('Clear your current unsaved draft form?')) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}
      window.location.reload();
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Add Existing Project</span>
            <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(45, 197, 233, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
              Physical Build
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleClearDraft}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Clear Draft
          </button>
          <TracewiseBubbleButton
            onClick={() => handleSubmit('overview')}
            variant="secondary"
            size="sm"
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
            disabled={isSubmitting}
          >
            Save Overview
          </TracewiseBubbleButton>
          <TracewiseBubbleButton
            onClick={() => handleSubmit('pitch')}
            variant="primary"
            size="sm"
            disabled={isSubmitting}
          >
            <Mic size={14} />
            <span>Prepare Presentation →</span>
          </TracewiseBubbleButton>
        </div>
      </header>

      {/* Main Form Content */}
      <main style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '36px 20px 80px' }}>
        
        {/* Hero Intro */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '14px'
            }}
          >
            <Sparkles size={14} />
            <span>Science Fair Project Preparation</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Your project is already built. Let's get it ready to present.
          </h1>
          <p style={{ fontSize: '1.02rem', color: '#cbd5e1', maxWidth: '680px', margin: '12px auto 0', lineHeight: 1.6 }}>
            Add a few details, attach photos or code, and prepare your science-fair presentation. You can document your project without rebuilding the circuit.
          </p>
        </div>

        {/* Step Navigation Pill */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#0a1f40',
              border: '1px solid rgba(45, 197, 233, 0.25)',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px'
            }}
          >
            {[
              { step: 1, label: '1. Basic Details' },
              { step: 2, label: '2. Hardware & Components' },
              { step: 3, label: '3. Testing & Pitch Facts' }
            ].map(item => (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(item.step)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeStep === item.step ? '#2dc5e9' : 'transparent',
                  color: activeStep === item.step ? '#071831' : '#cbd5e1',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: BASIC DETAILS */}
        {activeStep === 1 && (
          <div
            style={{
              backgroundColor: '#0a1f40',
              border: '1px solid rgba(45, 197, 233, 0.25)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.3)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                Project Overview
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                Give your physical build a clear name and define what hardware platform it runs on.
              </p>
            </div>

            {/* Project Title (Required) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Project Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Autonomous Wi-Fi Obstacle Avoiding Car or Smart Plant Telemetry Unit"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.96rem'
                }}
                required
              />
            </div>

            {/* Hardware Platform & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Microcontroller / Hardware Board
                </label>
                <select
                  value={formData.hardwarePlatform}
                  onChange={(e) => handleChange('hardwarePlatform', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(45, 197, 233, 0.3)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="ESP32">ESP32 (Wi-Fi / Bluetooth)</option>
                  <option value="Arduino Uno">Arduino Uno R3</option>
                  <option value="Arduino Nano">Arduino Nano</option>
                  <option value="Raspberry Pi">Raspberry Pi (SBC)</option>
                  <option value="Raspberry Pi Pico">Raspberry Pi Pico (RP2040)</option>
                  <option value="STM32">STM32 Nucleo / BluePill</option>
                  <option value="Micro:bit">BBC Micro:bit</option>
                  <option value="Custom Hardware">Custom PCB / Discrete Hardware</option>
                  <option value="No Microcontroller">No Microcontroller / Pure Analog</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Science Fair Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(45, 197, 233, 0.3)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="robotics">Robotics & Autonomous Systems</option>
                  <option value="iot">IoT & Connected Devices</option>
                  <option value="sensors">Sensors & Environmental Science</option>
                  <option value="automation">Smart Automation & Home Systems</option>
                  <option value="health">Healthcare & Assistive Technology</option>
                  <option value="energy">Renewable Energy & Power Management</option>
                  <option value="general">General Electronics & Computing</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Current Build Status
                </label>
                <select
                  value={formData.projectStatus}
                  onChange={(e) => handleChange('projectStatus', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(45, 197, 233, 0.3)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="working_prototype">Working Prototype (Bench Tested)</option>
                  <option value="completed">Completed Physical Build</option>
                  <option value="in_progress">Assembled & In Progress</option>
                  <option value="needs_improvement">Needs Tuning Before Fair</option>
                </select>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Short Description (What it does)
              </label>
              <textarea
                rows={3}
                placeholder="A brief 1-2 sentence summary of what your project does..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  lineHeight: 1.5
                }}
              />
            </div>

            {/* Target Audience & Problem Solved */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Target Audience (Who is this for?)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elderly individuals living alone, farmers, lab researchers"
                  value={formData.targetAudience}
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(45, 197, 233, 0.3)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Real-World Problem Being Solved
                </label>
                <input
                  type="text"
                  placeholder="e.g. Preventing accidental falls by detecting floor obstacles automatically"
                  value={formData.problemSolved}
                  onChange={(e) => handleChange('problemSolved', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(45, 197, 233, 0.3)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <TracewiseBubbleButton
                onClick={() => setActiveStep(2)}
                variant="primary"
                size="md"
              >
                <span>Next: Hardware & Components →</span>
              </TracewiseBubbleButton>
            </div>
          </div>
        )}

        {/* STEP 2: HARDWARE, COMPONENTS & UPLOADS */}
        {activeStep === 2 && (
          <div
            style={{
              backgroundColor: '#0a1f40',
              border: '1px solid rgba(45, 197, 233, 0.25)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.3)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    Bill of Materials & Working Principle
                  </h2>
                  <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                    List the components you physically connected, and explain how the hardware operates.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link
                    to="/app/reconstruct"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    <Camera size={14} />
                    <span>Reconstruct from Photo</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleRunAiExtraction}
                    disabled={aiAnalyzing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{aiAnalyzing ? 'Analyzing...' : 'Code-to-BOM'}</span>
                  </button>
                </div>
              </div>

              {showAiSuggestions && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.82rem', color: '#e0f2fe' }}>
                  ✓ AI draft suggestions applied. Review and refine the component names and quantities below.
                </div>
              )}
            </div>

            {/* Components List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  Component List ({formData.componentsList.length} items)
                </label>
                <button
                  type="button"
                  onClick={handleAddComponent}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(45, 197, 233, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(45, 197, 233, 0.3)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                  <span>Add Component</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formData.componentsList.map((comp, idx) => (
                  <div
                    key={comp.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: '#071831',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Component name (e.g. L298N Motor Driver, HC-SR04, 9V Battery)"
                      value={comp.name}
                      onChange={(e) => handleUpdateComponent(comp.id, 'name', e.target.value)}
                      style={{
                        flex: 2,
                        padding: '8px 12px',
                        backgroundColor: '#0a1f40',
                        border: '1px solid rgba(45, 197, 233, 0.25)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.86rem'
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={comp.quantity}
                      onChange={(e) => handleUpdateComponent(comp.id, 'quantity', Number(e.target.value) || 1)}
                      style={{
                        width: '60px',
                        padding: '8px 8px',
                        textAlign: 'center',
                        backgroundColor: '#0a1f40',
                        border: '1px solid rgba(45, 197, 233, 0.25)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.86rem'
                      }}
                      title="Quantity"
                    />
                    <input
                      type="text"
                      placeholder="Purpose / Role (e.g. Powers 2 DC gear motors)"
                      value={comp.purpose}
                      onChange={(e) => handleUpdateComponent(comp.id, 'purpose', e.target.value)}
                      style={{
                        flex: 3,
                        padding: '8px 12px',
                        backgroundColor: '#0a1f40',
                        border: '1px solid rgba(45, 197, 233, 0.25)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.86rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(comp.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Remove component"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Working Principle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Working Principle (How it works physically)
              </label>
              <textarea
                rows={3}
                placeholder="Explain the physical signals and actions: e.g. An ultrasonic sensor sends a 10µs trigger pulse. The ESP32 measures echo duration, converts time to distance, and halts the motors when distance < 20cm."
                value={formData.workingPrinciple}
                onChange={(e) => handleChange('workingPrinciple', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  lineHeight: 1.5
                }}
              />
            </div>

            {/* Photos & Diagrams Upload */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Attach Project Photographs & Circuit Diagrams
              </label>
              
              <div
                style={{
                  border: '2px dashed rgba(45, 197, 233, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(7, 24, 49, 0.4)'
                }}
              >
                <input
                  type="file"
                  id="photo-upload-input"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="photo-upload-input"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#1e3a6a',
                    border: '1px solid rgba(45, 197, 233, 0.4)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={16} />
                  <span>{isUploading ? 'Uploading...' : 'Choose Photos / Diagrams'}</span>
                </label>
                <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '8px' }}>
                  Supports JPG, PNG, WebP up to 5MB. Clear bench photos help judges understand your physical layout.
                </p>

                {uploadError && (
                  <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>{uploadError}</p>
                )}
              </div>

              {/* Uploaded Media Thumbnails */}
              {formData.mediaAttachments.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {formData.mediaAttachments.map((media) => (
                    <div
                      key={media.id}
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid rgba(45, 197, 233, 0.3)',
                        backgroundColor: '#071831',
                        height: '110px'
                      }}
                    >
                      {media.url ? (
                        <img
                          src={media.url}
                          alt={media.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <ImageIcon size={28} color="#64748b" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(media.id)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Remove photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Source Code File Upload or Paste */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc' }}>
                  Source Code (.ino, .cpp, .py)
                </label>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                >
                  <CodeIcon size={13} />
                  <span>Upload .ino / .cpp file</span>
                  <input
                    type="file"
                    accept=".ino,.cpp,.c,.py,.txt,.h"
                    onChange={handleCodeFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {formData.sourceFiles.map((sf, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#071831',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CodeIcon size={14} color="#38bdf8" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>{sf.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({sf.language})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSourceFile(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <textarea
                rows={4}
                placeholder="Or paste your microcontroller firmware / script here..."
                value={formData.sourceFiles[0]?.code || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    sourceFiles: [
                      {
                        name: prev.sourceFiles[0]?.name || 'main.ino',
                        code: val,
                        language: 'cpp'
                      }
                    ]
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#e2e8f0',
                  fontSize: '0.84rem',
                  fontFamily: 'var(--font-code)',
                  lineHeight: 1.4
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <TracewiseBubbleButton
                onClick={() => setActiveStep(1)}
                variant="secondary"
                size="md"
              >
                <span>← Back: Basic Details</span>
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={() => setActiveStep(3)}
                variant="primary"
                size="md"
              >
                <span>Next: Testing & Pitch Facts →</span>
              </TracewiseBubbleButton>
            </div>
          </div>
        )}

        {/* STEP 3: TESTING EVIDENCE & SCIENCE FAIR FACTS */}
        {activeStep === 3 && (
          <div
            style={{
              backgroundColor: '#0a1f40',
              border: '1px solid rgba(45, 197, 233, 0.25)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.3)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                Testing Evidence & Presentation Preparation
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                These authentic facts will feed directly into your Pitch Lab script, rehearsal cue cards, and judge Q&A.
              </p>
            </div>

            {/* Actual Testing Results */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Actual Testing Evidence & Measurements
              </label>
              <textarea
                rows={3}
                placeholder="What real trials did you run? e.g. We conducted 20 obstacle avoidance trials at speeds between 0.3m/s and 0.6m/s. The vehicle avoided collisions in 19 out of 20 trials, with an average braking reaction time of 120ms."
                value={formData.testingEvidence}
                onChange={(e) => handleChange('testingEvidence', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  lineHeight: 1.5
                }}
              />
            </div>

            {/* Biggest Challenge & How You Solved It */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Biggest Development Obstacle & How You Solved It
              </label>
              <textarea
                rows={3}
                placeholder="What was the hardest bug or assembly hurdle? e.g. The motors caused a voltage drop that made the ESP32 restart repeatedly. We resolved this by adding a dedicated 470µF decoupling capacitor and separate battery power for logic and motor driver."
                value={formData.challengesFaced}
                onChange={(e) => handleChange('challengesFaced', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  lineHeight: 1.5
                }}
              />
            </div>

            {/* Live Demonstration Plan */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Live Demonstration Plan for Judges
              </label>
              <input
                type="text"
                placeholder="e.g. Place the robot car on the demonstration table, place a cardboard block in its path, and observe real-time braking and reverse turning."
                value={formData.demonstrationPlan}
                onChange={(e) => handleChange('demonstrationPlan', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Future Improvements */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                Future Improvements (Roadmap with more time/budget)
              </label>
              <input
                type="text"
                placeholder="e.g. Design a custom PCB shield to eliminate loose jumper wires, and 3D print an aerodynamic chassis."
                value={formData.futureImprovements}
                onChange={(e) => handleChange('futureImprovements', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Final Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <TracewiseBubbleButton
                onClick={() => setActiveStep(2)}
                variant="secondary"
                size="md"
              >
                <span>← Back: Hardware</span>
              </TracewiseBubbleButton>

              <div style={{ display: 'flex', gap: '12px' }}>
                <TracewiseBubbleButton
                  onClick={() => handleSubmit('overview')}
                  variant="secondary"
                  size="md"
                  disabled={isSubmitting}
                >
                  <span>Save Project Overview</span>
                </TracewiseBubbleButton>

                <TracewiseBubbleButton
                  onClick={() => handleSubmit('pitch')}
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                >
                  <Mic size={15} />
                  <span>Prepare My Presentation in Pitch Lab →</span>
                </TracewiseBubbleButton>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
