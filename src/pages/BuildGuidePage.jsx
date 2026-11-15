import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { getProjectById, getAllProjects } from '../services/projectStorage';
import {
  Wrench,
  ArrowLeft,
  CheckSquare,
  Square,
  Printer,
  ShieldAlert,
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function BuildGuidePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useProject();

  const all = getAllProjects();
  const project = (activeProject?.id === projectId ? activeProject : getProjectById(projectId)) || all[0];

  // Checklist state
  const [checkedSteps, setCheckedSteps] = useState({});

  const toggleStep = (stepId) => {
    setCheckedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Generate Bill of Materials (BOM) from components
  const bom = [];
  const compCounts = {};
  (project?.components || []).forEach(c => {
    const key = `${c.name || c.type}-${JSON.stringify(c.props || {})}`;
    if (!compCounts[key]) {
      compCounts[key] = {
        name: c.name || c.type,
        type: c.type,
        props: c.props,
        count: 0
      };
    }
    compCounts[key].count += 1;
  });

  Object.values(compCounts).forEach(item => bom.push(item));

  // Add jumper wires to BOM
  if ((project?.connections || []).length > 0) {
    bom.push({
      name: 'Male-to-Male Jumper Wires',
      type: 'wire',
      props: { type: 'Premium DuPont' },
      count: project.connections.length
    });
  }

  const steps = [
    {
      id: 'step-1',
      title: 'Prepare Workspace & Power Off',
      desc: 'Ensure your work area is dry and static-safe. Disconnect the USB cable from the Arduino Uno before inserting components.'
    },
    {
      id: 'step-2',
      title: 'Position Microcontroller & Breadboard',
      desc: 'Place the Arduino Uno R3 on the left and the Half Breadboard on the right so jumper wires reach comfortably.'
    },
    {
      id: 'step-3',
      title: 'Establish Common Ground Rail',
      desc: 'Run a black jumper wire from Arduino GND pin to the negative (-) blue rail on the breadboard.'
    },
    {
      id: 'step-4',
      title: 'Insert Components & Current-Limiting Resistors',
      desc: 'Insert LEDs with the longer leg (anode) toward the control pin and the shorter leg (cathode) connected in series with a 220Ω resistor to GND.'
    },
    {
      id: 'step-5',
      title: 'Wire Signal Jumpers According to Wire Map',
      desc: 'Connect digital I/O jumper wires as detailed in the wiring map below. Double check pin numbers before powering on.'
    },
    {
      id: 'step-6',
      title: 'Plug in USB & Upload Sketch',
      desc: 'Connect USB cable to your computer, open Arduino IDE, select "Arduino Uno" board and port, and upload sketch.ino.'
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header
          style={{
            height: '60px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--tw-border)',
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
            <TracewiseBubbleButton
              to={`/app/studio/${project.id}`}
              variant="ghost"
              size="sm"
              style={{
                fontSize: '0.84rem',
                gap: '6px',
                color: 'var(--tw-text-secondary)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Return to Studio</span>
            </TracewiseBubbleButton>

            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--tw-border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} color="var(--tw-brand)" />
              <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
                Physical Build Guide • {project?.title}
              </h1>
            </div>
          </div>

          <TracewiseBubbleButton
            onClick={handlePrint}
            variant="secondary"
            size="sm"
            style={{ fontSize: '0.82rem', gap: '6px' }}
          >
            <Printer size={15} />
            <span>Print Assembly Guide</span>
          </TracewiseBubbleButton>
        </header>

        {/* Main Container */}
        <main style={{ maxWidth: '1080px', margin: '0 auto', width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Header Banner */}
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Physical Assembly
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
              From your screen to your breadboard.
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
              Follow the verified component bill of materials, step-by-step assembly guide, and jumper wire pin map before powering on your circuit.
            </p>
          </div>
        
        {/* Safety & Honest Limitations Notice */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <ShieldAlert size={20} color="var(--tw-brand)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--tw-brand)' }}>
              Safe Beginner Electronics Notice
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
              This project is designed for low-voltage (5V USB-powered) educational circuits. Virtual validation confirms structural pin mappings; it does not replace breadboard contact checks or multimeter probing. Never connect this circuit to mains voltage (110V/220V).
            </p>
          </div>
        </div>

        {/* Bill of Materials (BOM) Table */}
        <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)' }}>
              Bill of Materials (BOM)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)' }}>
              Derived directly from {project?.title} state
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--tw-border)', textAlign: 'left', color: 'var(--tw-text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Item</th>
                <th style={{ padding: '8px 12px' }}>Component Name</th>
                <th style={{ padding: '8px 12px' }}>Specifications</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {bom.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--tw-border)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--tw-text-muted)' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--tw-text)' }}>{item.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--tw-text-secondary)' }}>
                    {item.props?.resistance ? `Value: ${item.props.resistance}` : item.props?.color ? `Color: ${item.props.color}` : item.type}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--tw-brand)' }}>
                    {item.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Step-by-Step Construction Checklist */}
        <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)' }}>
            Assembly & Construction Checklist
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((st) => {
              const isDone = !!checkedSteps[st.id];

              return (
                <div
                  key={st.id}
                  onClick={() => toggleStep(st.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: isDone ? '#f0fdf4' : 'var(--tw-bg)',
                    border: isDone ? '1px solid #bbf7d0' : '1px solid var(--tw-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <button style={{ color: isDone ? 'var(--tw-success)' : 'var(--tw-text-muted)', marginTop: '2px' }}>
                    {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: isDone ? 'var(--tw-success)' : 'var(--tw-text)', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {st.title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Wiring Connection Map Reference Table */}
        <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)' }}>
            Wiring Connection Map
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--tw-border)', textAlign: 'left', color: 'var(--tw-text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Wire</th>
                <th style={{ padding: '8px 12px' }}>Source Pin</th>
                <th style={{ padding: '8px 12px' }}>Target Destination</th>
                <th style={{ padding: '8px 12px' }}>Color</th>
              </tr>
            </thead>
            <tbody>
              {(project?.connections || []).map((wire, idx) => (
                <tr key={wire.id || idx} style={{ borderBottom: '1px solid var(--tw-border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>#{idx + 1}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-code)', color: 'var(--tw-brand)' }}>
                    {wire.from?.componentId} • <b>{wire.from?.pinId}</b>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-code)', color: 'var(--tw-text)' }}>
                    {wire.to?.componentId} • <b>{wire.to?.pinId}</b>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: wire.color || '#2dc5e9' }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-secondary)' }}>{wire.color || 'Cyan'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  </TracewiseBubbleArea>
  );
}
