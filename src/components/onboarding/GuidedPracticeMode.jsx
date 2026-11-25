import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Play,
  Lightbulb
} from 'lucide-react';
import { tutorialProgressService } from '../../services/tutorialProgressService';
import { Analytics } from '../../services/analyticsService';

const PRACTICE_STEPS = [
  {
    id: 'step-1-arduino',
    title: '1. Add an Arduino Uno',
    desc: 'From the Component Library on the left, click or drag an Arduino Uno R3 onto the canvas.',
    hint: 'Look for "Arduino Uno R3" under Microcontrollers in the left panel and click "+ Add" or drag it.',
    check: (project) => {
      return project?.components?.some(c => c.type === 'arduino-uno' || c.type === 'arduino');
    }
  },
  {
    id: 'step-2-led',
    title: '2. Add a Red LED',
    desc: 'Add a standard 5mm Red LED from the Component Library onto the canvas.',
    hint: 'Under Outputs / Actuators, find "Red LED" and add it to the canvas near the Arduino.',
    check: (project) => {
      return project?.components?.some(c => c.type === 'led');
    }
  },
  {
    id: 'step-3-resistor',
    title: '3. Add a 220Ω Resistor',
    desc: 'Add a 220Ω resistor to safely limit current through the LED and protect Arduino Pin 13.',
    hint: 'Under Passives, click "220Ω Resistor". By default, new resistors in Tracewise are set to 220Ω.',
    check: (project) => {
      return project?.components?.some(c => c.type === 'resistor');
    }
  },
  {
    id: 'step-4-wire-pin13',
    title: '4. Wire Pin 13 to Resistor',
    desc: 'Click on Arduino digital pin D13, then click on one terminal of the 220Ω resistor.',
    hint: 'Hover over pin "13" on the Arduino until the crosshair appears, click to start wire, then click terminal 1 of the resistor.',
    check: (project) => {
      const wires = project?.connections || [];
      return wires.some(w => {
        const fromD13 = (w.from?.pinId === '13' || w.from?.pinId === 'D13');
        const toD13 = (w.to?.pinId === '13' || w.to?.pinId === 'D13');
        const hasResistor = project?.components?.some(c => c.type === 'resistor' && (c.id === w.from?.componentId || c.id === w.to?.componentId));
        return (fromD13 || toD13) && hasResistor;
      });
    }
  },
  {
    id: 'step-5-wire-anode',
    title: '5. Wire Resistor to LED Anode',
    desc: 'Connect the other terminal of the resistor to the LED Anode (+).',
    hint: 'Click the second pin of the resistor, then click the Anode pin of the LED (the longer bent lead or labeled "anode").',
    check: (project) => {
      const wires = project?.connections || [];
      return wires.some(w => {
        const toLed = (w.to?.pinId === 'anode' || w.from?.pinId === 'anode');
        const hasResistor = project?.components?.some(c => c.type === 'resistor' && (c.id === w.from?.componentId || c.id === w.to?.componentId));
        return toLed && hasResistor;
      });
    }
  },
  {
    id: 'step-6-wire-gnd',
    title: '6. Wire LED Cathode to GND',
    desc: 'Complete the electric circuit by connecting the LED Cathode (-) to an Arduino GND pin.',
    hint: 'Click the LED Cathode pin (flat side), then click any "GND" pin on the Arduino.',
    check: (project) => {
      const wires = project?.connections || [];
      return wires.some(w => {
        const hasCathode = (w.from?.pinId === 'cathode' || w.to?.pinId === 'cathode');
        const hasGnd = (w.from?.pinId === 'GND' || w.from?.pinId === 'GND.1' || w.from?.pinId === 'GND.2' || w.to?.pinId === 'GND' || w.to?.pinId === 'GND.1' || w.to?.pinId === 'GND.2');
        return hasCathode && hasGnd;
      });
    }
  },
  {
    id: 'step-7-firmware',
    title: '7. Inspect Arduino Code',
    desc: 'Switch to the Code tab on the right to view the default Blink firmware.',
    hint: 'Click the "Code" tab on the right panel to ensure void setup() has pinMode(13, OUTPUT) and void loop() toggles pin 13.',
    check: (project, currentTab) => {
      return currentTab === 'code' || (project?.firmware?.files?.[0]?.content?.includes('13') || project?.code?.includes('13'));
    }
  },
  {
    id: 'step-8-simulate',
    title: '8. Start the Simulation',
    desc: 'Click "Start Simulation" in the top toolbar to power on the virtual circuit.',
    hint: 'Click the green "Start Simulation" button with the Play icon in the top toolbar.',
    check: (project, currentTab, isSimulating) => {
      return isSimulating === true;
    }
  },
  {
    id: 'step-9-complete',
    title: '9. Congratulations! Circuit Live',
    desc: 'Your Red LED is now blinking once per second using genuine ATmega328P execution!',
    hint: 'Try changing delay(1000) to delay(200) in the Code editor to make it blink 5x faster!',
    check: (project, currentTab, isSimulating) => {
      return isSimulating === true;
    }
  }
];

export function GuidedPracticeMode({
  project,
  currentTab = 'canvas',
  isSimulating = false,
  onClose,
  onOpenCodeTab
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [showHint, setShowHint] = useState(false);

  // Initialize progress from service
  useEffect(() => {
    Analytics.practiceStarted('first_circuit');
    const prog = tutorialProgressService.getProgress();
    const done = {};
    PRACTICE_STEPS.forEach((step, idx) => {
      if (prog.practiceSteps?.[step.id]) {
        done[step.id] = true;
      }
    });
    setCompletedSteps(done);

    // Find first incomplete step
    const firstIncomplete = PRACTICE_STEPS.findIndex(s => !done[s.id]);
    if (firstIncomplete !== -1) {
      setActiveStepIdx(firstIncomplete);
    }
  }, []);

  // Auto-detect step completions on project or simulation changes
  useEffect(() => {
    const currentStep = PRACTICE_STEPS[activeStepIdx];
    if (!currentStep) return;

    if (!completedSteps[currentStep.id] && currentStep.check) {
      const isSatisfied = currentStep.check(project, currentTab, isSimulating);
      if (isSatisfied) {
        handleMarkComplete(currentStep.id, activeStepIdx);
      }
    }
  }, [project, currentTab, isSimulating, activeStepIdx, completedSteps]);

  const handleMarkComplete = (stepId, idx) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));
    tutorialProgressService.markPracticeStepCompleted(stepId);
    Analytics.practiceStepCompleted(idx + 1);

    if (idx < PRACTICE_STEPS.length - 1) {
      setActiveStepIdx(idx + 1);
      setShowHint(false);
    } else {
      tutorialProgressService.markPracticeCompleted();
      Analytics.practiceCompleted();
    }
  };

  const handleManualToggle = (stepId, idx) => {
    if (completedSteps[stepId]) {
      setCompletedSteps(prev => {
        const next = { ...prev };
        delete next[stepId];
        return next;
      });
    } else {
      handleMarkComplete(stepId, idx);
    }
  };

  const completedCount = Object.keys(completedSteps).length;
  const isAllComplete = completedCount === PRACTICE_STEPS.length;
  const currentStep = PRACTICE_STEPS[activeStepIdx] || PRACTICE_STEPS[PRACTICE_STEPS.length - 1];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 900,
        width: collapsed ? 'auto' : '360px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.15)',
        color: '#f8fafc',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.4), rgba(56, 189, 248, 0.1))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
            Build Your First Circuit
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: isAllComplete ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              color: isAllComplete ? '#4ade80' : '#38bdf8'
            }}
          >
            {completedCount}/{PRACTICE_STEPS.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title={collapsed ? 'Expand guide' : 'Collapse guide'}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Exit practice mode"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(completedCount / PRACTICE_STEPS.length) * 100}%`,
                height: '100%',
                backgroundColor: isAllComplete ? '#4ade80' : '#38bdf8',
                transition: 'width 0.3s ease'
              }}
            />
          </div>

          {/* Active Step Box */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700 }}>
                  Current Objective
                </span>
                <h4 style={{ margin: '2px 0 6px', fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                  {currentStep.title}
                </h4>
              </div>
              <button
                onClick={() => handleManualToggle(currentStep.id, activeStepIdx)}
                style={{
                  background: completedSteps[currentStep.id] ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid ' + (completedSteps[currentStep.id] ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'),
                  color: completedSteps[currentStep.id] ? '#4ade80' : '#e2e8f0',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {completedSteps[currentStep.id] ? <CheckCircle2 size={12} /> : null}
                {completedSteps[currentStep.id] ? 'Done' : 'Mark Done'}
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              {currentStep.desc}
            </p>

            {/* Hint toggler */}
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => setShowHint(!showHint)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Lightbulb size={13} />
                {showHint ? 'Hide Hint' : 'Need a hint?'}
              </button>
              {showHint && (
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {currentStep.hint}
                </p>
              )}
            </div>
          </div>

          {/* Quick checklist pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
            {PRACTICE_STEPS.map((s, idx) => {
              const isDone = !!completedSteps[s.id];
              const isCurrent = idx === activeStepIdx;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveStepIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid ' + (isCurrent ? 'rgba(56, 189, 248, 0.3)' : 'transparent'),
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {isDone ? (
                      <CheckCircle2 size={14} color="#4ade80" />
                    ) : (
                      <Circle size={14} color={isCurrent ? '#38bdf8' : '#64748b'} />
                    )}
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: isDone ? '#94a3b8' : isCurrent ? '#f8fafc' : '#cbd5e1',
                        textDecoration: isDone ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {s.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
            <button
              onClick={() => {
                setCompletedSteps({});
                setActiveStepIdx(0);
                tutorialProgressService.resetProgress();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} />
              Reset Steps
            </button>

            {isAllComplete ? (
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <CheckCircle2 size={14} />
                Finished Practice!
              </button>
            ) : (
              <button
                onClick={() => {
                  if (activeStepIdx < PRACTICE_STEPS.length - 1) {
                    setActiveStepIdx(activeStepIdx + 1);
                  }
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next Step
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
