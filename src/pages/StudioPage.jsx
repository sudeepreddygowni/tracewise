import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { StudioToolbar } from '../components/studio/StudioToolbar';
import { ComponentLibrary } from '../components/studio/ComponentLibrary';
import { CircuitCanvas } from '../components/studio/CircuitCanvas';
import { CodeEditor } from '../components/studio/CodeEditor';
import { ComponentInspector } from '../components/studio/ComponentInspector';
import { DemoAssistant } from '../components/studio/DemoAssistant';
import { ValidationDrawer } from '../components/studio/ValidationDrawer';
import { applyProjectModification } from '../domain/projectBuilder/projectModifier';
import { Code, Sliders, Sparkles, Layout, CheckCircle2 } from 'lucide-react';
import {
  TracewiseBubbleButton,
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
    updateActiveProject,
    commitHistory
  } = useProject();

  const [selectedCompId, setSelectedCompId] = useState(null);
  const [rightTab, setRightTab] = useState(
    location.state?.initialQuery || location.state?.openAssistant ? 'assistant' : 'code'
  ); // 'code' | 'inspector' | 'assistant'
  const [isValidationOpen, setIsValidationOpen] = useState(false);

  useEffect(() => {
    if (location.state?.initialQuery || location.state?.openAssistant) {
      setRightTab('assistant');
    }
  }, [location.state]);

  useEffect(() => {
    if (projectId && (!activeProject || activeProject.id !== projectId)) {
      const loaded = loadProject(projectId);
      if (!loaded) {
        // Fallback to first starter if not found
        loadProject('starter-traffic-light');
      }
    }
  }, [projectId, activeProject, loadProject]);

  if (!activeProject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--tw-bg)' }}>
        <p style={{ color: 'var(--tw-text-muted)' }}>Loading Tracewise Studio...</p>
      </div>
    );
  }

  const selectedComp = (activeProject.components || []).find(c => c.id === selectedCompId);

  // When a component is clicked on canvas, auto switch to inspector tab if desired
  const handleSelectComponent = (id) => {
    setSelectedCompId(id);
    if (id && rightTab === 'assistant') {
      setRightTab('inspector');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
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
        onUndo={undo}
        onRedo={redo}
        onUpdateTitle={(title) => updateActiveProject({ title })}
        validation={validation}
      />

      {/* Main Studio 3-Column Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left: Component Library */}
        <div className="studio-col-left">
          <ComponentLibrary
            onAddComponent={(compDef) => {
              addComponent(compDef, 400 + Math.random() * 80, 160 + Math.random() * 80);
            }}
          />
        </div>

        {/* Center: Circuit Canvas */}
        <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
          <CircuitCanvas
            project={activeProject}
            selectedComponentId={selectedCompId}
            onSelectComponent={handleSelectComponent}
            onMoveComponent={moveComponent}
            onAddConnection={addConnection}
            onRemoveConnection={removeConnection}
            onCommitHistory={commitHistory}
          />
        </div>

        {/* Right: Engineering Hub (Code Editor, Inspector, Demo Assistant) */}
        <div
          className="studio-col-right"
          style={{
            width: '380px',
            height: '100%',
            backgroundColor: '#ffffff',
            borderLeft: '1px solid var(--tw-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Right Hub Tab Switcher */}
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
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '6px 8px',
                  gap: '6px'
                }}
              >
                <Code size={14} />
                <span>Arduino C++</span>
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={() => setRightTab('inspector')}
                variant={rightTab === 'inspector' ? 'primary' : 'ghost'}
                size="sm"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '6px 8px',
                  gap: '6px'
                }}
              >
                <Sliders size={14} />
                <span>Inspector</span>
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={() => setRightTab('assistant')}
                variant={rightTab === 'assistant' ? 'primary' : 'ghost'}
                size="sm"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '6px 8px',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} />
                <span>Assistant</span>
              </TracewiseBubbleButton>
            </div>
          </TracewiseBubbleArea>

          {/* Right Hub Content */}
          <div style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {rightTab === 'code' && (
              <CodeEditor
                code={activeProject.firmware?.files?.[0]?.content || ''}
                onChange={updateFirmware}
                onRunCheck={handleValidateCode}
                validationResults={validation.checks}
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
      </div>

      {/* Bottom Structural Validation Drawer */}
      <ValidationDrawer
        validation={validation}
        isOpen={isValidationOpen}
        onToggle={() => setIsValidationOpen(prev => !prev)}
        onOpenAssistant={() => setRightTab('assistant')}
      />

      <style>{`
        @media (max-width: 1024px) {
          .studio-col-left {
            display: none !important;
          }
          .studio-col-right {
            width: 320px !important;
          }
        }
        @media (max-width: 768px) {
          .studio-col-right {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
