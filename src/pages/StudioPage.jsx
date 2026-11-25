import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import { StudioToolbar } from '../components/studio/StudioToolbar';
import { ComponentLibrary } from '../components/studio/ComponentLibrary';
import { CircuitCanvas } from '../components/studio/CircuitCanvas';
import { PhysicalLayoutView } from '../components/studio/PhysicalLayoutView';
import { CodeEditor } from '../components/studio/CodeEditor';
import { ComponentInspector } from '../components/studio/ComponentInspector';
import { DemoAssistant } from '../components/studio/DemoAssistant';
import { ValidationDrawer } from '../components/studio/ValidationDrawer';
import { PublishProjectModal } from '../components/studio/PublishProjectModal';
import { SimulationControlBar } from '../components/studio/SimulationControlBar';
import { SerialMonitor } from '../components/studio/SerialMonitor';
import { GuidedPracticeMode } from '../components/onboarding/GuidedPracticeMode';
import { useSimulation } from '../store/useSimulationStore';
import { applyProjectModification } from '../domain/projectBuilder/projectModifier';
import {
  Code,
  Sliders,
  Sparkles,
  Layout,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  FolderOpen,
  FileCode,
  Trash2,
  Plus
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function StudioPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeProject,
    loadProject,
    saveCurrent,
    forkActive,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaved,
    validation,
    addComponent,
    removeComponent,
    moveComponent,
    addConnection,
    removeConnection,
    updateFirmware,
    updatePhysicalLayout,
    updateActiveProject,
    commitHistory
  } = useProject();

  const { user } = useAuth();
  const { isSerialOpen, toggleSerial, status: simStatus } = useSimulation();
  const isSimulating = simStatus === 'RUNNING';
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [practiceModeOpen, setPracticeModeOpen] = useState(
    Boolean(location.state?.practiceMode || new URLSearchParams(location.search).get('practice') === 'true')
  );
  const [canvasViewMode, setCanvasViewMode] = useState('circuit'); // 'circuit' | 'physical'
  const [rightTab, setRightTab] = useState(
    location.state?.initialQuery || location.state?.openAssistant ? 'assistant' : 'code'
  ); // 'code' | 'inspector' | 'assistant'
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isComponentLibraryOpen, setIsComponentLibraryOpen] = useState(true);

  // Responsive device breakpoint state
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [mobileActiveTab, setMobileActiveTab] = useState('canvas'); // 'canvas' | 'components' | 'code' | 'inspector' | 'assistant'
  const [tabletLeftOpen, setTabletLeftOpen] = useState(false);
  const [tabletRightOpen, setTabletRightOpen] = useState(false);

  // Live viewport metrics from CircuitCanvas for center-of-view component placement
  const [viewport, setViewport] = useState({
    pan: { x: 0, y: 0 },
    zoom: 1,
    width: 800,
    height: 600
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024;

  useEffect(() => {
    if (location.state?.initialQuery || location.state?.openAssistant) {
      setRightTab('assistant');
      if (isMobile) {
        setMobileActiveTab('assistant');
      } else if (isTablet) {
        setTabletRightOpen(true);
      }
    }
  }, [location.state, isMobile, isTablet]);

  useEffect(() => {
    if (location.state?.practiceMode || new URLSearchParams(location.search).get('practice') === 'true') {
      setPracticeModeOpen(true);
    }
  }, [location.state, location.search]);

  useEffect(() => {
    const handleOpenAssistant = () => {
      setRightTab('assistant');
      if (isMobile) {
        setMobileActiveTab('assistant');
      } else if (isTablet) {
        setTabletRightOpen(true);
      }
    };
    const handleOpenPractice = () => {
      setPracticeModeOpen(true);
    };
    window.addEventListener('tracewise:open_studio_assistant', handleOpenAssistant);
    window.addEventListener('tracewise:open_practice_mode', handleOpenPractice);
    return () => {
      window.removeEventListener('tracewise:open_studio_assistant', handleOpenAssistant);
      window.removeEventListener('tracewise:open_practice_mode', handleOpenPractice);
    };
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (projectId) {
      if (!activeProject || activeProject.id !== projectId) {
        const loaded = loadProject(projectId);
        if (!loaded) {
          // Fallback to first starter if not found
          loadProject('starter-traffic-light');
        }
      }
    } else if (!activeProject) {
      // Direct bare /app/studio access defaults to starter traffic light
      loadProject('starter-traffic-light');
    }
  }, [projectId, activeProject, loadProject]);

  // Handle component selection on canvas
  const handleSelectComponent = (id) => {
    setSelectedCompId(id);
    if (id) {
      if (rightTab === 'assistant' && isDesktop) {
        setRightTab('inspector');
      }
    }
  };

  // Honest, precise engineering fix applicator
  const handleApplyAssistantFix = (fix) => {
    if (!fix) return;

    if (fix.type === 'apply_project_modification' && fix.modification) {
      updateActiveProject(prev => applyProjectModification(prev, fix.modification));
      return;
    }

    if (fix.type === 'replace_project' && fix.project) {
      updateActiveProject(() => fix.project);
      return;
    }

    if (fix.code) {
      updateFirmware(fix.code);
    }

    if (fix.type === 'insert_resistor_series') {
      updateActiveProject(prev => {
        const comps = [...(prev.components || [])];
        const led = comps.find(c => c.id === fix.ledId);
        if (!led) return prev;

        // 1. Remove direct cathode wire
        let wires = [...(prev.connections || [])];
        if (fix.removeWireId) {
          wires = wires.filter(w => w.id !== fix.removeWireId);
        } else {
          wires = wires.filter(w => !(
            (w.from?.componentId === led.id && w.from?.pinId === 'cathode') ||
            (w.to?.componentId === led.id && w.to?.pinId === 'cathode')
          ));
        }

        // 2. Add 220Ω resistor component next to LED
        const resistorId = `resistor-${Math.random().toString(36).slice(-4)}`;
        const newResistor = {
          id: resistorId,
          type: 'resistor',
          name: '220Ω Resistor',
          x: led.x + 90,
          y: led.y + 30,
          props: { resistance: '220Ω' }
        };
        comps.push(newResistor);

        // 3. Connect LED Cathode -> Resistor Lead 1
        const wireToResistor = {
          id: `wire-${Math.random().toString(36).slice(-5)}`,
          from: { componentId: led.id, pinId: 'cathode' },
          to: { componentId: resistorId, pinId: 'lead1' },
          color: '#2DC5E9',
          label: 'LED Cathode Wire'
        };
        wires.push(wireToResistor);

        // 4. Connect Resistor Lead 2 -> Ground Target
        const gTarget = fix.groundTarget || { componentId: 'uno-main', pinId: 'GND' };
        const wireToGround = {
          id: `wire-${Math.random().toString(36).slice(-5)}`,
          from: { componentId: resistorId, pinId: 'lead2' },
          to: gTarget,
          color: '#0B2348',
          label: 'GND Return Wire'
        };
        wires.push(wireToGround);

        return {
          ...prev,
          components: comps,
          connections: wires
        };
      });
    }
  };

  const handleValidateCode = () => {
    saveCurrent();
    setIsValidationOpen(true);
  };

  // Smart placement for added components based on visible viewport center
  const handleAddComponentAtCenter = (compDef) => {
    const w = viewport.width || 800;
    const h = viewport.height || 600;
    const z = viewport.zoom || 1;
    const p = viewport.pan || { x: 0, y: 0 };

    // Calculate world coordinates of the viewport center
    const centerX = (-p.x + w / 2) / z;
    const centerY = (-p.y + h / 2) / z;

    // Small jitter so consecutive additions don't completely overlap
    const jitterX = Math.round((Math.random() - 0.5) * 60);
    const jitterY = Math.round((Math.random() - 0.5) * 60);

    const placeX = Math.max(20, Math.round(centerX - 80 + jitterX));
    const placeY = Math.max(20, Math.round(centerY - 60 + jitterY));

    addComponent(compDef, placeX, placeY);
  };

  const handleToggleComponentLibrary = () => {
    if (isDesktop) {
      setIsComponentLibraryOpen(prev => !prev);
    } else if (isTablet) {
      setTabletLeftOpen(prev => !prev);
    } else {
      setMobileActiveTab(prev => (prev === 'components' ? 'canvas' : 'components'));
    }
  };

  if (!activeProject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--tw-bg)' }}>
        <p style={{ color: 'var(--tw-text-muted)' }}>Loading Tracewise Studio...</p>
      </div>
    );
  }

  const selectedComp = (activeProject.components || []).find(c => c.id === selectedCompId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top Toolbar */}
      <StudioToolbar
        project={activeProject}
        isSaved={isSaved}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={saveCurrent}
        onFork={() => {
          const forked = forkActive();
          if (forked) navigate(`/app/studio/${forked.id}`);
        }}
        onPublish={() => setPublishModalOpen(true)}
        onUndo={undo}
        onRedo={redo}
        onUpdateTitle={(title) => updateActiveProject({ title })}
        validation={validation}
        isComponentLibraryOpen={isDesktop ? isComponentLibraryOpen : isTablet ? tabletLeftOpen : mobileActiveTab === 'components'}
        onToggleComponentLibrary={handleToggleComponentLibrary}
      />

      {/* Main Studio Middle Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* DESKTOP LEFT: Component Library (Collapsible) */}
        {isDesktop && (
          <div
            className="studio-col-left"
            style={{
              width: isComponentLibraryOpen ? '280px' : '0px',
              minWidth: isComponentLibraryOpen ? '280px' : '0px',
              height: '100%',
              minHeight: 0,
              backgroundColor: '#ffffff',
              borderRight: isComponentLibraryOpen ? '1px solid var(--tw-border)' : 'none',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-right 0.22s ease'
            }}
          >
            <div style={{ width: '280px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ComponentLibrary
                onAddComponent={handleAddComponentAtCenter}
                onClose={() => setIsComponentLibraryOpen(false)}
              />
            </div>
          </div>
        )}

        {/* TABLET LEFT DRAWER: Collapsible Component Library */}
        {isTablet && tabletLeftOpen && (
          <>
            <div
              onClick={() => setTabletLeftOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(7, 24, 49, 0.35)',
                zIndex: 60,
                backdropFilter: 'blur(2px)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '320px',
                height: '100%',
                minHeight: 0,
                backgroundColor: '#ffffff',
                zIndex: 61,
                boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideInLeft 0.2s ease-out'
              }}
            >
              <ComponentLibrary
                onAddComponent={handleAddComponentAtCenter}
                onClose={() => setTabletLeftOpen(false)}
              />
            </div>
          </>
        )}

        {/* CENTER: Circuit Canvas & Real MCU Simulation */}
        <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SimulationControlBar
            project={activeProject}
            onOpenValidation={() => setIsValidationOpen(true)}
          />

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* View Mode Switcher for Robotics & Physical Builds */}
            {(activeProject?.physicalLayout || (activeProject?.category || '').includes('robot') || (activeProject?.title || '').toLowerCase().includes('car')) && (
              <div
                style={{
                  position: 'absolute',
                  top: 66,
                  left: 14,
                  zIndex: 40,
                  display: 'flex',
                  gap: '4px',
                  backgroundColor: 'rgba(7, 24, 49, 0.9)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setCanvasViewMode('circuit')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: canvasViewMode === 'circuit' ? '#38bdf8' : 'transparent',
                    color: canvasViewMode === 'circuit' ? '#071831' : '#cbd5e1',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Circuit Schematic
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasViewMode('physical')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: canvasViewMode === 'physical' ? '#38bdf8' : 'transparent',
                    color: canvasViewMode === 'physical' ? '#071831' : '#cbd5e1',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Physical Chassis (2D)
                </button>
              </div>
            )}

            {canvasViewMode === 'physical' ? (
              <PhysicalLayoutView
                project={activeProject}
                onUpdateLayout={updatePhysicalLayout}
              />
            ) : (
              <CircuitCanvas
                project={activeProject}
                selectedComponentId={selectedCompId}
                onSelectComponent={handleSelectComponent}
                onMoveComponent={moveComponent}
                onRemoveComponent={removeComponent}
                onAddConnection={addConnection}
                onRemoveConnection={removeConnection}
                onCommitHistory={commitHistory}
                onViewportChange={setViewport}
              />
            )}

            {/* Serial Monitor Collapsible Drawer */}
            <SerialMonitor isOpen={isSerialOpen} onClose={toggleSerial} />



          {/* TABLET FLOATING TOGGLE BUTTONS (Canvas Edges) */}
          {isTablet && (
            <TracewiseBubbleArea theme="light">
              {/* Left Edge Toggle */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 12,
                  transform: 'translateY(-50%)',
                  zIndex: 42
                }}
              >
                <TracewiseBubbleButton
                  onClick={() => setTabletLeftOpen(prev => !prev)}
                  variant="secondary"
                  size="sm"
                  title="Toggle Component Library"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--tw-radius-pill)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Layers size={15} color="var(--tw-brand)" />
                  <span>Components</span>
                </TracewiseBubbleButton>
              </div>

              {/* Right Edge Toggle */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 12,
                  transform: 'translateY(-50%)',
                  zIndex: 42
                }}
              >
                <TracewiseBubbleButton
                  onClick={() => setTabletRightOpen(prev => !prev)}
                  variant="secondary"
                  size="sm"
                  title="Toggle Engineering Hub"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--tw-radius-pill)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Sliders size={15} color="var(--tw-brand)" />
                  <span>Hub ({rightTab})</span>
                </TracewiseBubbleButton>
              </div>
            </TracewiseBubbleArea>
          )}

          {/* MOBILE FLOATING COMPONENT INSPECTOR PILL */}
          {isMobile && mobileActiveTab === 'canvas' && selectedComp && (
            <div
              style={{
                position: 'absolute',
                bottom: 74,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 43,
                animation: 'slideUp 0.2s ease-out'
              }}
            >
              <button
                onClick={() => setMobileActiveTab('inspector')}
                style={{
                  backgroundColor: 'rgba(7, 24, 49, 0.96)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: 'var(--tw-radius-pill)',
                  border: '1px solid rgba(45, 197, 233, 0.35)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  minHeight: '44px'
                }}
              >
                <Sliders size={14} color="#2dc5e9" />
                <span>Selected: <b>{selectedComp.name || selectedComp.type}</b></span>
                <span style={{ opacity: 0.6 }}>•</span>
                <span style={{ color: '#2dc5e9' }}>Tap for Inspector</span>
              </button>
            </div>
          )}
          </div>
        </div>

        {/* DESKTOP RIGHT: Engineering Hub (380px) */}
        {isDesktop && (
          <div
            className="studio-col-right"
            style={{
              width: '380px',
              height: '100%',
              backgroundColor: '#ffffff',
              borderLeft: '1px solid var(--tw-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {/* Desktop Hub Tab Switcher */}
            <TracewiseBubbleArea theme="light">
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  backgroundColor: '#f1f5f9',
                  padding: '6px',
                  borderBottom: '1px solid var(--tw-border)'
                }}
              >
                <TracewiseBubbleButton
                  onClick={() => setRightTab('code')}
                  variant={rightTab === 'code' ? 'primary' : 'ghost'}
                  size="sm"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '6px 8px', gap: '6px' }}
                >
                  <Code size={14} />
                  <span>Firmware</span>
                </TracewiseBubbleButton>

                <TracewiseBubbleButton
                  onClick={() => setRightTab('inspector')}
                  variant={rightTab === 'inspector' ? 'primary' : 'ghost'}
                  size="sm"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '6px 8px', gap: '6px' }}
                >
                  <Sliders size={14} />
                  <span>Inspector</span>
                </TracewiseBubbleButton>

                <TracewiseBubbleButton
                  onClick={() => setRightTab('assistant')}
                  variant={rightTab === 'assistant' ? 'primary' : 'ghost'}
                  size="sm"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '6px 8px', gap: '6px' }}
                >
                  <Sparkles size={14} />
                  <span>Assistant</span>
                </TracewiseBubbleButton>
              </div>
            </TracewiseBubbleArea>

            {/* Desktop Hub Content */}
            <div style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {rightTab === 'code' && (
                <CodeEditor
                  code={activeProject.firmware?.files?.[0]?.content || ''}
                  onChange={updateFirmware}
                  onRunCheck={handleValidateCode}
                  validationResults={validation.checks}
                  project={activeProject}
                  onUpdateProject={updateActiveProject}
                />
              )}

              {rightTab === 'inspector' && (
                <ComponentInspector
                  selectedComponent={selectedComp}
                  project={activeProject}
                  onUpdateProps={(newProps) => {
                    if (selectedCompId) {
                      updateActiveProject(prev => ({
                        ...prev,
                        components: prev.components.map(c =>
                          c.id === selectedCompId ? { ...c, props: { ...c.props, ...newProps } } : c
                        )
                      }));
                    }
                  }}
                  onDeleteComponent={(id) => {
                    removeComponent(id);
                    setSelectedCompId(null);
                  }}
                />
              )}

              {rightTab === 'assistant' && (
                <DemoAssistant
                  project={activeProject}
                  validation={validation}
                  onApplyFix={handleApplyAssistantFix}
                  initialQuery={location.state?.initialQuery}
                  buildCompleted={location.state?.buildCompleted}
                  buildMessage={location.state?.buildMessage}
                />
              )}
            </div>
          </div>
        )}

        {/* TABLET RIGHT DRAWER: Collapsible Engineering Hub */}
        {isTablet && tabletRightOpen && (
          <>
            <div
              onClick={() => setTabletRightOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(7, 24, 49, 0.35)',
                zIndex: 60,
                backdropFilter: 'blur(2px)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '380px',
                height: '100%',
                minHeight: 0,
                backgroundColor: '#ffffff',
                zIndex: 61,
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideInRight 0.2s ease-out'
              }}
            >
              {/* Header with Close */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--tw-border)',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '8px' }}>
                  <TracewiseBubbleButton
                    onClick={() => setRightTab('code')}
                    variant={rightTab === 'code' ? 'primary' : 'ghost'}
                    size="sm"
                    style={{ flex: 1, fontSize: '0.74rem', padding: '5px 6px', gap: '4px' }}
                  >
                    <Code size={13} />
                    <span>Code</span>
                  </TracewiseBubbleButton>
                  <TracewiseBubbleButton
                    onClick={() => setRightTab('inspector')}
                    variant={rightTab === 'inspector' ? 'primary' : 'ghost'}
                    size="sm"
                    style={{ flex: 1, fontSize: '0.74rem', padding: '5px 6px', gap: '4px' }}
                  >
                    <Sliders size={13} />
                    <span>Inspector</span>
                  </TracewiseBubbleButton>
                  <TracewiseBubbleButton
                    onClick={() => setRightTab('assistant')}
                    variant={rightTab === 'assistant' ? 'primary' : 'ghost'}
                    size="sm"
                    style={{ flex: 1, fontSize: '0.74rem', padding: '5px 6px', gap: '4px' }}
                  >
                    <Sparkles size={13} />
                    <span>Assistant</span>
                  </TracewiseBubbleButton>
                </div>

                <TracewiseBubbleIconButton
                  onClick={() => setTabletRightOpen(false)}
                  variant="ghost"
                  size="sm"
                  title="Close Drawer"
                  style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
                >
                  <X size={16} />
                </TracewiseBubbleIconButton>
              </div>

              {/* Hub Drawer Content */}
              <div style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {rightTab === 'code' && (
                  <CodeEditor
                    code={activeProject.firmware?.files?.[0]?.content || ''}
                    onChange={updateFirmware}
                    onRunCheck={handleValidateCode}
                    validationResults={validation.checks}
                    project={activeProject}
                    onUpdateProject={updateActiveProject}
                  />
                )}
                {rightTab === 'inspector' && (
                  <ComponentInspector
                    selectedComponent={selectedComp}
                    project={activeProject}
                    onUpdateProps={(newProps) => {
                      if (selectedCompId) {
                        updateActiveProject(prev => ({
                          ...prev,
                          components: prev.components.map(c =>
                            c.id === selectedCompId ? { ...c, props: { ...c.props, ...newProps } } : c
                          )
                        }));
                      }
                    }}
                    onDeleteComponent={(id) => {
                      removeComponent(id);
                      setSelectedCompId(null);
                    }}
                  />
                )}
                {rightTab === 'assistant' && (
                  <DemoAssistant
                    project={activeProject}
                    validation={validation}
                    onApplyFix={handleApplyAssistantFix}
                    initialQuery={location.state?.initialQuery}
                    buildCompleted={location.state?.buildCompleted}
                    buildMessage={location.state?.buildMessage}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MOBILE SLIDING BOTTOM SHEET (Components, Code, Assistant, Files, Inspector) */}
      {isMobile && mobileActiveTab !== 'canvas' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileActiveTab('canvas')}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(7, 24, 49, 0.60)',
              backdropFilter: 'blur(3px)'
            }}
            aria-label="Close sheet backdrop"
          />

          {/* Bottom Sheet Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: mobileActiveTab === 'code' ? '92dvh' : mobileActiveTab === 'assistant' ? '86dvh' : '82dvh',
              maxHeight: 'calc(100dvh - 36px)',
              backgroundColor: mobileActiveTab === 'code' || mobileActiveTab === 'files' ? '#071831' : '#ffffff',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Sheet Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: (mobileActiveTab === 'code' || mobileActiveTab === 'files')
                  ? '1px solid rgba(74, 167, 242, 0.25)'
                  : '1px solid var(--tw-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: (mobileActiveTab === 'code' || mobileActiveTab === 'files') ? '#0b2348' : '#ffffff',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mobileActiveTab === 'components' && <Layers size={18} color="var(--tw-brand)" />}
                {mobileActiveTab === 'code' && <Code size={18} color="#38bdf8" />}
                {mobileActiveTab === 'assistant' && <Sparkles size={18} color="var(--tw-brand)" />}
                {mobileActiveTab === 'files' && <FolderOpen size={18} color="#38bdf8" />}
                {mobileActiveTab === 'inspector' && <Sliders size={18} color="var(--tw-brand)" />}

                <span
                  style={{
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: (mobileActiveTab === 'code' || mobileActiveTab === 'files') ? '#f8fafc' : 'var(--tw-text)'
                  }}
                >
                  {mobileActiveTab === 'components' && 'Component Library'}
                  {mobileActiveTab === 'code' && 'Firmware & Code'}
                  {mobileActiveTab === 'assistant' && 'Engineering Assistant'}
                  {mobileActiveTab === 'files' && 'Project Files'}
                  {mobileActiveTab === 'inspector' && 'Component Inspector'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileActiveTab('canvas')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: (mobileActiveTab === 'code' || mobileActiveTab === 'files')
                    ? 'rgba(255,255,255,0.14)'
                    : 'var(--tw-bg)',
                  color: (mobileActiveTab === 'code' || mobileActiveTab === 'files') ? '#f8fafc' : 'var(--tw-text)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                aria-label="Return to Canvas"
              >
                <X size={15} />
                <span>Canvas</span>
              </button>
            </div>

            {/* Sheet Body */}
            <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* 1. Component Library */}
              {mobileActiveTab === 'components' && (
                <ComponentLibrary
                  onAddComponent={(def) => {
                    handleAddComponentAtCenter(def);
                  }}
                  onClose={() => setMobileActiveTab('canvas')}
                />
              )}

              {/* 2. Code Editor */}
              {mobileActiveTab === 'code' && (
                <CodeEditor
                  code={activeProject.firmware?.files?.[0]?.content || ''}
                  onChange={updateFirmware}
                  onRunCheck={handleValidateCode}
                  validationResults={validation.checks}
                  project={activeProject}
                  onUpdateProject={updateActiveProject}
                  onClose={() => setMobileActiveTab('canvas')}
                />
              )}

              {/* 3. AI Engineering Assistant */}
              {mobileActiveTab === 'assistant' && (
                <DemoAssistant
                  project={activeProject}
                  validation={validation}
                  onApplyFix={handleApplyAssistantFix}
                  initialQuery={location.state?.initialQuery}
                  buildCompleted={location.state?.buildCompleted}
                  buildMessage={location.state?.buildMessage}
                />
              )}

              {/* 4. Dedicated Project Files Drawer */}
              {mobileActiveTab === 'files' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#071831', overflow: 'hidden' }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Source Files ({(activeProject.firmware?.files || [{ path: 'sketch.ino' }]).length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const fileName = prompt('Enter new file name (e.g. helper.h, state.py, pins.h):');
                          if (fileName && fileName.trim()) {
                            const clean = fileName.trim();
                            const isPy = clean.endsWith('.py');
                            const newFile = {
                              path: clean,
                              content: isPy
                                ? `# ${clean}\nimport time\n\nprint("Loaded ${clean}")\n`
                                : `// ${clean}\n\nvoid setup() {\n}\n\nvoid loop() {\n}\n`,
                              language: isPy ? 'python' : 'arduino-cpp'
                            };
                            updateActiveProject(prev => {
                              const existing = prev.firmware?.files || [
                                { path: prev.firmware?.mainFile || 'sketch.ino', content: prev.firmware?.code || '', language: prev.firmware?.language || 'arduino-cpp' }
                              ];
                              if (existing.some(f => f.path === clean)) return prev;
                              return {
                                ...prev,
                                firmware: {
                                  ...(prev.firmware || {}),
                                  files: [...existing, newFile]
                                }
                              };
                            });
                            setMobileActiveTab('code');
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: '16px',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={13} />
                        <span>New File</span>
                      </button>
                    </div>

                    {(activeProject.firmware?.files && activeProject.firmware.files.length > 0
                      ? activeProject.firmware.files
                      : [{ path: activeProject.firmware?.mainFile || 'sketch.ino', content: activeProject.firmware?.code || '', language: activeProject.firmware?.language || 'arduino-cpp' }]
                    ).map((file, idx) => {
                      const isMain = file.path === (activeProject.firmware?.mainFile || 'sketch.ino') || idx === 0;
                      const isPy = file.path.endsWith('.py');
                      return (
                        <div
                          key={file.path}
                          onClick={() => setMobileActiveTab('code')}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(74, 167, 242, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileCode size={20} color={isPy ? '#eab308' : '#38bdf8'} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                                  {file.path}
                                </span>
                                {isMain && (
                                  <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', fontWeight: 700 }}>
                                    Main
                                  </span>
                                )}
                                {isPy && (
                                  <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(234, 179, 8, 0.18)', color: '#eab308', fontWeight: 700 }}>
                                    MicroPython
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {(file.content || '').split('\n').length} lines • Tap to edit in Code
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!isMain && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete file "${file.path}"?`)) {
                                    updateActiveProject(prev => ({
                                      ...prev,
                                      firmware: {
                                        ...(prev.firmware || {}),
                                        files: (prev.firmware?.files || []).filter(f => f.path !== file.path)
                                      }
                                    }));
                                  }
                                }}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '6px'
                                }}
                                title="Delete file"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                            <ChevronRight size={16} color="#64748b" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Component Inspector */}
              {mobileActiveTab === 'inspector' && (
                <ComponentInspector
                  selectedComponent={selectedComp}
                  project={activeProject}
                  onUpdateProps={(newProps) => {
                    if (selectedCompId) {
                      updateActiveProject(prev => ({
                        ...prev,
                        components: prev.components.map(c =>
                          c.id === selectedCompId ? { ...c, props: { ...c.props, ...newProps } } : c
                        )
                      }));
                    }
                  }}
                  onDeleteComponent={(id) => {
                    removeComponent(id);
                    setSelectedCompId(null);
                    setMobileActiveTab('canvas');
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM WORKSPACE TOOLBAR: Components | Code | Assistant | Files */}
      {isMobile && (
        <nav
          className="studio-mobile-toolbar"
          style={{
            height: '58px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid var(--tw-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '2px 8px',
            paddingBottom: 'env(safe-area-inset-bottom, 2px)',
            zIndex: 45,
            flexShrink: 0,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
          }}
          aria-label="Studio Tools"
        >
          {/* 1. Components */}
          <button
            type="button"
            onClick={() => setMobileActiveTab(prev => prev === 'components' ? 'canvas' : 'components')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              border: 'none',
              backgroundColor: mobileActiveTab === 'components' ? 'rgba(30, 63, 216, 0.08)' : 'transparent',
              borderRadius: '8px',
              color: mobileActiveTab === 'components' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
              cursor: 'pointer',
              minHeight: '48px',
              padding: '4px 0',
              transition: 'all 0.15s ease'
            }}
            aria-label="Component Library"
          >
            <Layers size={18} strokeWidth={mobileActiveTab === 'components' ? 2.5 : 2} />
            <span style={{ fontSize: '0.72rem', fontWeight: mobileActiveTab === 'components' ? 700 : 600 }}>
              Components
            </span>
          </button>

          {/* 2. Code */}
          <button
            type="button"
            onClick={() => setMobileActiveTab(prev => prev === 'code' ? 'canvas' : 'code')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              border: 'none',
              backgroundColor: mobileActiveTab === 'code' ? 'rgba(30, 63, 216, 0.08)' : 'transparent',
              borderRadius: '8px',
              color: mobileActiveTab === 'code' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
              cursor: 'pointer',
              minHeight: '48px',
              padding: '4px 0',
              transition: 'all 0.15s ease'
            }}
            aria-label="Code Editor"
          >
            <Code size={18} strokeWidth={mobileActiveTab === 'code' ? 2.5 : 2} />
            <span style={{ fontSize: '0.72rem', fontWeight: mobileActiveTab === 'code' ? 700 : 600 }}>
              Code
            </span>
          </button>

          {/* 3. Assistant */}
          <button
            type="button"
            onClick={() => setMobileActiveTab(prev => prev === 'assistant' ? 'canvas' : 'assistant')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              border: 'none',
              backgroundColor: mobileActiveTab === 'assistant' ? 'rgba(30, 63, 216, 0.08)' : 'transparent',
              borderRadius: '8px',
              color: mobileActiveTab === 'assistant' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
              cursor: 'pointer',
              minHeight: '48px',
              padding: '4px 0',
              transition: 'all 0.15s ease'
            }}
            aria-label="Engineering Assistant"
          >
            <Sparkles size={18} strokeWidth={mobileActiveTab === 'assistant' ? 2.5 : 2} />
            <span style={{ fontSize: '0.72rem', fontWeight: mobileActiveTab === 'assistant' ? 700 : 600 }}>
              Assistant
            </span>
          </button>

          {/* 4. Files */}
          <button
            type="button"
            onClick={() => setMobileActiveTab(prev => prev === 'files' ? 'canvas' : 'files')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              border: 'none',
              backgroundColor: mobileActiveTab === 'files' ? 'rgba(30, 63, 216, 0.08)' : 'transparent',
              borderRadius: '8px',
              color: mobileActiveTab === 'files' ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
              cursor: 'pointer',
              minHeight: '48px',
              padding: '4px 0',
              transition: 'all 0.15s ease'
            }}
            aria-label="Project Files"
          >
            <FolderOpen size={18} strokeWidth={mobileActiveTab === 'files' ? 2.5 : 2} />
            <span style={{ fontSize: '0.72rem', fontWeight: mobileActiveTab === 'files' ? 700 : 600 }}>
              Files
            </span>
          </button>
        </nav>
      )}

      {/* Bottom Structural Validation Drawer */}
      <ValidationDrawer
        validation={validation}
        isOpen={isValidationOpen}
        onToggle={() => setIsValidationOpen(prev => !prev)}
        onOpenAssistant={() => {
          if (isMobile) {
            setMobileActiveTab('assistant');
          } else {
            setRightTab('assistant');
            if (isTablet) setTabletRightOpen(true);
          }
        }}
      />

      {/* Community Project Publishing Modal */}
      {publishModalOpen && (
        <PublishProjectModal
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          project={activeProject}
          user={user}
          onProjectPublished={() => {
            alert('Your circuit was published to the Community Projects showcase!');
          }}
        />
      )}

      {/* Guided First Circuit Practice Mode */}
      {practiceModeOpen && (
        <GuidedPracticeMode
          project={activeProject}
          currentTab={isMobile ? mobileActiveTab : rightTab}
          isSimulating={isSimulating}
          onClose={() => setPracticeModeOpen(false)}
          onOpenCodeTab={() => {
            if (isMobile) {
              setMobileActiveTab('code');
            } else {
              setRightTab('code');
              if (isTablet) setTabletRightOpen(true);
            }
          }}
        />
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}