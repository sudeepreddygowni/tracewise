import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { StudioToolbar } from '../components/studio/StudioToolbar';
import { ComponentLibrary } from '../components/studio/ComponentLibrary';
import { CircuitCanvas } from '../components/studio/CircuitCanvas';
import { CodeEditor } from '../components/studio/CodeEditor';
import { ComponentInspector } from '../components/studio/ComponentInspector';
import { DemoAssistant } from '../components/studio/DemoAssistant';
import { ValidationDrawer } from '../components/studio/ValidationDrawer';
import { Code, Sliders, Sparkles, Layout, CheckCircle2 } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function StudioPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
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
    updateActiveProject
  } = useProject();

  const [selectedCompId, setSelectedCompId] = useState(null);
  const [rightTab, setRightTab] = useState('code'); // 'code' | 'inspector' | 'assistant'
  const [mobileTab, setMobileTab] = useState('canvas'); // 'canvas' | 'components' | 'code' | 'inspector'

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

  const handleApplyAssistantFix = (fix) => {
    if (fix.code) {
      updateFirmware(fix.code);
    }
    if (fix.addResistorForLed) {
      const led = (activeProject.components || []).find(c => c.id === fix.addResistorForLed);
      if (led) {
        addComponent(
          { type: 'resistor', name: '220Ω Resistor' },
          led.x + 90,
          led.y
        );
      }
    }
    saveCurrent();
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
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {rightTab === 'code' && (
              <CodeEditor
                code={activeProject.firmware?.files?.[0]?.content || ''}
                onChange={updateFirmware}
                onRunCheck={saveCurrent}
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
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Structural Validation Drawer */}
      <ValidationDrawer validation={validation} />

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
