/**
 * Isolated Tutorial Mock Previews for Tracewise 8 Lessons
 *
 * Each preview renders faithful, read-only UI components with `data-tour-target`
 * attributes matching the Showcase Pointer scripted cursor steps.
 *
 * SAFETY CONTRACT:
 * - Local state only.
 * - Zero network requests, zero database calls, zero synthetic production events.
 */

import React from 'react';
import {
  Layers,
  Play,
  Square,
  RotateCcw,
  Plus,
  X,
  Check,
  Cpu,
  FileCode,
  Share2,
  GitCompare,
  Sparkles,
  Presentation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/* -----------------------------------------------------------------------------
   LESSON 1: DASHBOARD PREVIEW
   ----------------------------------------------------------------------------- */
export function DashboardLessonPreview({ state }) {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>WORKSPACE DASHBOARD</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>My Circuits</div>
        </div>
        <button
          type="button"
          data-tour-target="new-project-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#1e3fd8',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: 'default'
          }}
        >
          <Plus size={15} />
          <span>New Circuit</span>
        </button>
      </div>

      {state.showCreateDialog && (
        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Create New Engineering Project</div>
          <input
            type="text"
            readOnly
            data-tour-target="project-title-input"
            value={state.projectTitle || ''}
            placeholder="Project title (e.g. My First LED Circuit)"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '0.88rem', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              data-tour-target="confirm-create-btn"
              style={{
                padding: '7px 16px',
                backgroundColor: state.created ? '#10b981' : '#1e3fd8',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.84rem'
              }}
            >
              {state.created ? '✓ Created!' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', opacity: state.showCreateDialog ? 0.4 : 1 }}>
        <div style={{ padding: '14px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>Traffic Light Controller</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Arduino Uno • 3 LEDs</div>
        </div>
        <div style={{ padding: '14px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>Analog Light Dimmer</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Potentiometer • PWM</div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   LESSON 2: COMPONENTS PREVIEW
   ----------------------------------------------------------------------------- */
export function ComponentsLessonPreview({ state }) {
  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#0f172a', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top Studio Toolbar */}
      <div style={{ height: '48px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button
          type="button"
          data-tour-target="open-components-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#1e3fd8', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <Layers size={14} />
          <span>Components</span>
        </button>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Canvas: {state.componentsAdded?.length || 0} parts</span>
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, position: 'relative', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
        {state.componentsAdded?.includes('arduino') && (
          <div style={{ padding: '12px', backgroundColor: '#0369a1', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={16} /> Arduino Uno R3
          </div>
        )}
        {state.componentsAdded?.includes('led') && (
          <div style={{ padding: '10px 14px', backgroundColor: '#dc2626', borderRadius: '20px', color: '#fff', fontSize: '0.76rem', fontWeight: 700 }}>
            Red LED (5mm)
          </div>
        )}
        {state.componentsAdded?.includes('resistor') && (
          <div style={{ padding: '8px 12px', backgroundColor: '#d97706', borderRadius: '6px', color: '#fff', fontSize: '0.76rem', fontWeight: 700 }}>
            220Ω Resistor
          </div>
        )}
      </div>

      {/* Component Library Drawer */}
      {state.isLibraryOpen && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '220px', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Library (33 parts)</span>
            <button type="button" data-tour-target="close-components-btn" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'default' }}>
              <X size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button type="button" data-tour-target="part-arduino-uno" style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.78rem', textAlign: 'left' }}>
              + Arduino Uno R3
            </button>
            <button type="button" data-tour-target="part-led-red" style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.78rem', textAlign: 'left' }}>
              + 5mm Red LED
            </button>
            <button type="button" data-tour-target="part-resistor-220" style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.78rem', textAlign: 'left' }}>
              + 220Ω Resistor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   LESSON 3: WIRING PREVIEW
   ----------------------------------------------------------------------------- */
export function WiringLessonPreview({ state }) {
  return (
    <div style={{ height: '100%', backgroundColor: '#0b1329', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>Interactive Wiring Demonstration</span>
        <span style={{ fontSize: '0.74rem', color: state.wire3 ? '#4ade80' : '#f59e0b', fontWeight: 600 }}>
          {state.wire3 ? '✓ Closed Loop Established' : '⚡ Incomplete Circuit'}
        </span>
      </div>

      {/* Terminal Node Schematics */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: 'auto 0' }}>
        {/* Arduino Pins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div data-tour-target="pin-arduino-d13" style={{ padding: '6px 12px', backgroundColor: '#1e3fd8', color: '#fff', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
            Pin D13
          </div>
          <div data-tour-target="pin-arduino-gnd" style={{ padding: '6px 12px', backgroundColor: '#475569', color: '#fff', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
            GND
          </div>
        </div>

        {/* Resistor Pins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div data-tour-target="pin-resistor-t1" style={{ padding: '6px 10px', backgroundColor: '#d97706', color: '#fff', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
            220Ω T1
          </div>
          <div data-tour-target="pin-resistor-t2" style={{ padding: '6px 10px', backgroundColor: '#d97706', color: '#fff', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
            220Ω T2
          </div>
        </div>

        {/* LED Pins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div data-tour-target="pin-led-anode" style={{ padding: '6px 10px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
            Anode (+)
          </div>
          <div data-tour-target="pin-led-cathode" style={{ padding: '6px 10px', backgroundColor: '#991b1b', color: '#fff', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
            Cathode (-)
          </div>
        </div>
      </div>

      {/* Wire List Feedback */}
      <div style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <span style={{ color: state.wire1 ? '#38bdf8' : '#64748b' }}>{state.wire1 ? '● D13 → Resistor' : '○ D13 pending'}</span>
        <span style={{ color: state.wire2 ? '#38bdf8' : '#64748b' }}>{state.wire2 ? '● Resistor → Anode' : '○ Anode pending'}</span>
        <span style={{ color: state.wire3 ? '#38bdf8' : '#64748b' }}>{state.wire3 ? '● Cathode → GND' : '○ GND pending'}</span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   LESSON 4: FIRMWARE PREVIEW
   ----------------------------------------------------------------------------- */
export function FirmwareLessonPreview({ state }) {
  return (
    <div style={{ height: '100%', backgroundColor: '#0f172a', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: '40px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button type="button" data-tour-target="code-tab-btn" style={{ padding: '4px 8px', backgroundColor: '#334155', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '0.76rem', fontWeight: 600 }}>
            sketch.ino
          </button>
        </div>
        <button type="button" data-tour-target="editor-validate-btn" style={{ padding: '4px 10px', backgroundColor: state.validated ? '#10b981' : '#1e3fd8', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '0.74rem', fontWeight: 600 }}>
          {state.validated ? '✓ Validated' : 'Verify Syntax'}
        </button>
      </div>
      <div style={{ flex: 1, padding: '14px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.6 }}>
        <div style={{ color: '#94a3b8' }}>// Tracewise Blink Firmware</div>
        <div data-tour-target="editor-setup-line" style={{ padding: '2px 4px', backgroundColor: state.highlightSetup ? 'rgba(56, 189, 248, 0.2)' : 'transparent', borderRadius: '4px' }}>
          <span style={{ color: '#38bdf8' }}>void</span> setup() {'{'} pinMode(13, OUTPUT); {'}'}
        </div>
        <div style={{ margin: '6px 0' }} />
        <div data-tour-target="editor-loop-line" style={{ padding: '2px 4px', backgroundColor: state.highlightLoop ? 'rgba(56, 189, 248, 0.2)' : 'transparent', borderRadius: '4px' }}>
          <span style={{ color: '#38bdf8' }}>void</span> loop() {'{'}
          <div style={{ paddingLeft: '14px' }}>digitalWrite(13, HIGH);</div>
          <div style={{ paddingLeft: '14px' }}>delay(1000);</div>
          <div style={{ paddingLeft: '14px' }}>digitalWrite(13, LOW);</div>
          <div style={{ paddingLeft: '14px' }}>delay(1000);</div>
          {'}'}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   LESSON 5: SIMULATION PREVIEW
   ----------------------------------------------------------------------------- */
export function SimulationLessonPreview({ state }) {
  return (
    <div style={{ height: '100%', backgroundColor: '#09132b', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            data-tour-target="start-simulation-btn"
            style={{ padding: '6px 14px', backgroundColor: state.isRunning ? '#64748b' : '#10b981', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Play size={12} />
            <span>Run Simulation</span>
          </button>
          <button
            type="button"
            data-tour-target="stop-simulation-btn"
            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Square size={12} />
            <span>Stop</span>
          </button>
        </div>
        <span style={{ fontSize: '0.76rem', color: state.isRunning ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>
          {state.isRunning ? '● ATmega328P @ 16MHz RUNNING' : '○ SIMULATOR STOPPED'}
        </span>
      </div>

      {/* Visual Simulation Display */}
      <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div
          data-tour-target="simulated-led-indicator"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: state.ledOn ? '#ef4444' : '#450a0a',
            boxShadow: state.ledOn ? '0 0 24px 6px #ef4444' : 'none',
            border: '2px solid rgba(255,255,255,0.2)',
            transition: 'all 0.15s ease'
          }}
        />
        <span style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 700 }}>
          {state.ledOn ? 'LED State: HIGH (5V)' : 'LED State: LOW (0V)'}
        </span>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
        Demonstration Mode: Virtual machine cycles rendered in real time.
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   LESSON 6: COMPARE & DEBUG PREVIEW
   ----------------------------------------------------------------------------- */
export function CompareLessonPreview({ state }) {
  return (
    <div style={{ height: '100%', backgroundColor: '#0f172a', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Compare & Debug Analyzer</span>
        <button
          type="button"
          data-tour-target="compare-diff-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#1e3fd8', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '0.76rem', fontWeight: 600 }}
        >
          <GitCompare size={13} />
          <span>Compare Versions</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', flex: 1 }}>
        {/* Baseline Working Circuit */}
        <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4ade80', marginBottom: '6px' }}>Circuit A (Baseline)</div>
          <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>Wire: D2 → Button Pin 1</div>
          <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>Code: digitalRead(2)</div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '6px' }}>✓ Matching Pins</div>
        </div>

        {/* Modified Circuit with Bug */}
        <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '8px', border: state.fixed ? '1px solid #10b981' : '1px solid #ef4444' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: state.fixed ? '#4ade80' : '#f87171', marginBottom: '6px' }}>Circuit B (Modified)</div>
          <div data-tour-target="diff-highlight-wire" style={{ fontSize: '0.74rem', color: state.fixed ? '#cbd5e1' : '#fca5a5', backgroundColor: state.fixed ? 'transparent' : 'rgba(239, 68, 68, 0.2)', padding: '2px', borderRadius: '4px' }}>
            Wire: {state.fixed ? 'D2 → Button Pin 1' : 'D7 → Button Pin 1'}
          </div>
          <div data-tour-target="diff-highlight-code" style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '4px' }}>
            Code: digitalRead(2)
          </div>
          <div style={{ fontSize: '0.72rem', color: state.fixed ? '#10b981' : '#ef4444', marginTop: '6px' }}>
            {state.fixed ? '✓ Pin Mismatch Resolved' : '⚠ Pin Mismatch Detected'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          data-tour-target="align-pin-action"
          style={{ padding: '6px 14px', backgroundColor: state.fixed ? '#10b981' : '#ef4444', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '0.78rem', fontWeight: 700 }}
        >
          {state.fixed ? '✓ Aligned' : 'Align Firmware Pin (D2)'}
        </button>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   LESSON 7: PITCH LAB PREVIEW
   ----------------------------------------------------------------------------- */
export function PitchLessonPreview({ state }) {
  return (
    <div style={{ height: '100%', backgroundColor: '#f8fafc', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>Pitch Lab — Science Fair Studio</span>
        <button
          type="button"
          data-tour-target="pitch-lab-btn"
          style={{ padding: '4px 10px', backgroundColor: '#8b5cf6', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '0.76rem', fontWeight: 600 }}
        >
          Open Pitch Lab
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          data-tour-target="generate-slides-btn"
          style={{ padding: '6px 14px', backgroundColor: state.generated ? '#10b981' : '#1e3fd8', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '0.8rem', fontWeight: 600 }}
        >
          {state.generated ? '✓ 6 Slides Ready' : 'Generate Science Fair Slides'}
        </button>
        <button
          type="button"
          data-tour-target="judge-qa-tab"
          style={{ padding: '6px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
        >
          Practice Judge Q&A
        </button>
      </div>

      {state.generated && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', flex: 1, marginTop: '4px' }}>
          <div style={{ padding: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.72rem' }}>
            <span style={{ fontWeight: 700 }}>Slide 1</span>: Problem Statement
          </div>
          <div style={{ padding: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.72rem' }}>
            <span style={{ fontWeight: 700 }}>Slide 2</span>: Working Principle
          </div>
          <div style={{ padding: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.72rem' }}>
            <span style={{ fontWeight: 700 }}>Slide 3</span>: Testing Evidence
          </div>
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   LESSON 8: COMMUNITY PREVIEW
   ----------------------------------------------------------------------------- */
export function CommunityLessonPreview({ state }) {
  return (
    <div style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>Publish to Community</span>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Allow peers to view, remix, and test your circuit</div>
        </div>
        <button
          type="button"
          data-tour-target="publish-project-btn"
          style={{ padding: '5px 12px', backgroundColor: '#ec4899', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '0.78rem', fontWeight: 600 }}
        >
          Publish
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          data-tour-target="visibility-public-toggle"
          style={{ padding: '6px 12px', backgroundColor: state.isPublic ? '#fdf2f8' : '#f1f5f9', border: state.isPublic ? '1px solid #ec4899' : '1px solid #cbd5e1', color: state.isPublic ? '#be185d' : '#0f172a', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}
        >
          {state.isPublic ? '✓ Public Community' : 'Private Only'}
        </button>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          data-tour-target="confirm-publish-btn"
          style={{ padding: '7px 16px', backgroundColor: state.published ? '#10b981' : '#ec4899', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '0.82rem', fontWeight: 700 }}
        >
          {state.published ? '✓ Shared with Community!' : 'Confirm Publication'}
        </button>
      </div>
    </div>
  );
}
