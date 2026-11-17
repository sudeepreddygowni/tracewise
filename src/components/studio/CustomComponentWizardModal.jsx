import React, { useState, useMemo } from 'react';
import {
  X,
  Cpu,
  Check,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Sliders
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';
import {
  registerCustomComponent,
  getComponentCapabilityLevel,
  CAPABILITY_LEVELS
} from '../../domain/componentRegistry';

const CATEGORIES = [
  'Sensors',
  'Microcontrollers',
  'Motor Drivers & Actuators',
  'Displays & Indicators',
  'Power & Regulators',
  'Communication & Wireless',
  'Passive Components',
  'Custom Modules'
];

const FOOTPRINTS = [
  { id: 'breakout', name: 'Breakout Board (Module)', width: 140, height: 100, shape: 'board' },
  { id: 'dip8', name: 'DIP IC (Dual In-line)', width: 120, height: 80, shape: 'ic' },
  { id: 'sensor', name: 'Sensor Module', width: 120, height: 90, shape: 'sensor' },
  { id: 'driver', name: 'Motor / Power Driver', width: 160, height: 120, shape: 'driver' }
];

const ELECTRICAL_ROLES = [
  { id: 'GPIO', label: 'General Digital I/O (GPIO)', defaultDir: 'io' },
  { id: 'ANALOG', label: 'Analog Input / Output', defaultDir: 'in' },
  { id: 'PWM', label: 'PWM Output', defaultDir: 'out' },
  { id: 'VCC', label: 'Power Supply (VCC / +5V / +3.3V)', defaultDir: 'power' },
  { id: 'GND', label: 'Ground (GND)', defaultDir: 'ground' },
  { id: 'I2C_SDA', label: 'I2C Serial Data (SDA)', defaultDir: 'io' },
  { id: 'I2C_SCL', label: 'I2C Serial Clock (SCL)', defaultDir: 'in' },
  { id: 'SPI_MOSI', label: 'SPI MOSI', defaultDir: 'in' },
  { id: 'SPI_MISO', label: 'SPI MISO', defaultDir: 'out' },
  { id: 'SPI_SCK', label: 'SPI Clock', defaultDir: 'in' },
  { id: 'UART_TX', label: 'UART Transmit (TX)', defaultDir: 'out' },
  { id: 'UART_RX', label: 'UART Receive (RX)', defaultDir: 'in' }
];

export function CustomComponentWizardModal({ isOpen, onClose, onComponentCreated }) {
  const [step, setStep] = useState(1); // 1: Metadata, 2: Pins, 3: Footprint & Shape, 4: Preview & Save

  // Step 1: Metadata
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sensors');
  const [partNumber, setPartNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [description, setDescription] = useState('');
  const [datasheetUrl, setDatasheetUrl] = useState('');
  const [voltageDomain, setVoltageDomain] = useState('5V'); // '3.3V' | '5V' | '12V'

  // Step 2: Pins Definition
  const [pins, setPins] = useState([
    { id: 'VCC', label: 'VCC', role: 'VCC', direction: 'power' },
    { id: 'GND', label: 'GND', role: 'GND', direction: 'ground' },
    { id: 'SIG', label: 'SIG', role: 'GPIO', direction: 'io' }
  ]);

  // Step 3: Footprint
  const [selectedFootprint, setSelectedFootprint] = useState(FOOTPRINTS[0]);

  // Status & Error
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate kebab-case type
  const compType = useMemo(() => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug ? `custom-${slug}` : 'custom-component';
  }, [name]);

  if (!isOpen) return null;

  // Add pin handler
  const handleAddPin = () => {
    const nextIdx = pins.length + 1;
    setPins(prev => [
      ...prev,
      {
        id: `PIN_${nextIdx}`,
        label: `P${nextIdx}`,
        role: 'GPIO',
        direction: 'io'
      }
    ]);
  };

  const handleRemovePin = (idx) => {
    if (pins.length <= 1) return;
    setPins(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePin = (idx, field, value) => {
    setPins(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      const updated = { ...p, [field]: value };
      if (field === 'role') {
        const found = ELECTRICAL_ROLES.find(r => r.id === value);
        if (found) updated.direction = found.defaultDir;
      }
      return updated;
    }));
  };

  // Compute calculated pin coordinates based on footprint and pin count
  const positionedPins = useMemo(() => {
    const fp = selectedFootprint;
    const count = pins.length;
    const list = [];

    // Distribute pins evenly along left or bottom header
    if (fp.shape === 'ic') {
      // Split between left and right side
      const half = Math.ceil(count / 2);
      const leftSpacing = fp.height / (half + 1);
      const rightSpacing = fp.height / ((count - half) + 1);

      pins.forEach((pin, idx) => {
        if (idx < half) {
          list.push({
            ...pin,
            x: 0,
            y: Math.round(leftSpacing * (idx + 1))
          });
        } else {
          const rIdx = idx - half;
          list.push({
            ...pin,
            x: fp.width,
            y: Math.round(rightSpacing * (rIdx + 1))
          });
        }
      });
    } else {
      // Bottom header breakout spacing
      const spacing = fp.width / (count + 1);
      pins.forEach((pin, idx) => {
        list.push({
          ...pin,
          x: Math.round(spacing * (idx + 1)),
          y: fp.height
        });
      });
    }

    return list;
  }, [pins, selectedFootprint]);

  // Generate SVG Body
  const svgBody = useMemo(() => {
    const fp = selectedFootprint;
    const bodyColor = fp.shape === 'ic' ? '#1e293b' : '#0369a1';
    const borderColor = '#38bdf8';

    return `
      <g>
        <rect x="0" y="0" width="${fp.width}" height="${fp.height}" rx="6" fill="${bodyColor}" stroke="${borderColor}" stroke-width="2"/>
        <text x="${fp.width / 2}" y="${fp.height / 2 - 4}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold" font-family="sans-serif">${name || 'Custom Component'}</text>
        <text x="${fp.width / 2}" y="${fp.height / 2 + 14}" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="monospace">${partNumber || voltageDomain}</text>
      </g>
    `.trim();
  }, [selectedFootprint, name, partNumber, voltageDomain]);

  // Compute capability level
  const capabilityLevel = useMemo(() => {
    return getComponentCapabilityLevel({
      pins: positionedPins,
      voltageDomain,
      viewBox: { x: 0, y: 0, width: selectedFootprint.width, height: selectedFootprint.height }
    });
  }, [positionedPins, voltageDomain, selectedFootprint]);

  const levelInfo = CAPABILITY_LEVELS[capabilityLevel] || CAPABILITY_LEVELS.C;

  // Handle Save
  const handleSave = () => {
    setError('');
    if (!name.trim()) {
      setError('Please provide a component name.');
      setStep(1);
      return;
    }

    setIsSaving(true);
    try {
      const descriptor = {
        type: compType,
        name: name.trim(),
        category,
        partNumber: partNumber.trim(),
        manufacturer: manufacturer.trim(),
        description: description.trim() || `${name.trim()} (${category})`,
        datasheetUrl: datasheetUrl.trim(),
        voltageDomain,
        voltageDomains: [voltageDomain],
        width: selectedFootprint.width,
        height: selectedFootprint.height,
        viewBox: { x: 0, y: 0, width: selectedFootprint.width, height: selectedFootprint.height },
        pins: positionedPins,
        svgBody,
        simulationAvailable: false // strictly false for custom component without simulation engine
      };

      const registered = registerCustomComponent(descriptor);
      if (onComponentCreated) {
        onComponentCreated(registered);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save component');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 24, 49, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: '#0a1f40',
          borderRadius: '20px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#071831'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Custom Component Creation Wizard
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                Step {step} of 4 — {step === 1 ? 'Component Metadata' : step === 2 ? 'Pin Mapping' : step === 3 ? 'Footprint & Shape' : 'Preview & Verification'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          {[
            { num: 1, label: 'Identity' },
            { num: 2, label: 'Pins' },
            { num: 3, label: 'Footprint' },
            { num: 4, label: 'Preview' }
          ].map(s => (
            <div
              key={s.num}
              style={{
                flex: 1,
                padding: '10px',
                textAlign: 'center',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: step === s.num ? '#38bdf8' : step > s.num ? '#10b981' : '#64748b',
                borderBottom: step === s.num ? '2px solid #38bdf8' : 'none',
                backgroundColor: step === s.num ? 'rgba(56, 189, 248, 0.08)' : 'transparent'
              }}
            >
              {s.num}. {s.label}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: COMPONENT IDENTITY */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Component Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BMP280 Barometric Pressure Sensor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(74, 167, 242, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#071831',
                      border: '1px solid rgba(74, 167, 242, 0.25)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                    Operating Voltage Domain
                  </label>
                  <select
                    value={voltageDomain}
                    onChange={(e) => setVoltageDomain(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#071831',
                      border: '1px solid rgba(74, 167, 242, 0.25)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  >
                    <option value="5V">5V Standard Logic</option>
                    <option value="3.3V">3.3V Low-Power Logic</option>
                    <option value="12V">12V High-Voltage / Motor Rail</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                    Part Number / Model (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BMP-280 or L298N"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#071831',
                      border: '1px solid rgba(74, 167, 242, 0.25)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                    Manufacturer / Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bosch Sensortec or Generic"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#071831',
                      border: '1px solid rgba(74, 167, 242, 0.25)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Datasheet Reference URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={datasheetUrl}
                  onChange={(e) => setDatasheetUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(74, 167, 242, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe what this component does in a circuit..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#071831',
                    border: '1px solid rgba(74, 167, 242, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: PINS DEFINITION */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Electrical Pinout ({pins.length} Pins)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0' }}>
                    Define pin labels and electrical roles for wiring and compatibility validation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPin}
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
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  <span>Add Pin</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {pins.map((pin, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr 100px 36px',
                      gap: '10px',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#071831',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div>
                      <input
                        type="text"
                        value={pin.label}
                        onChange={(e) => handleUpdatePin(idx, 'label', e.target.value)}
                        placeholder="Label (e.g. SDA)"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#0b2348',
                          border: '1px solid rgba(74, 167, 242, 0.2)',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div>
                      <select
                        value={pin.role}
                        onChange={(e) => handleUpdatePin(idx, 'role', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#0b2348',
                          border: '1px solid rgba(74, 167, 242, 0.2)',
                          color: '#ffffff',
                          fontSize: '0.8rem'
                        }}
                      >
                        {ELECTRICAL_ROLES.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase' }}>
                      {pin.direction}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemovePin(idx)}
                        disabled={pins.length <= 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: pins.length <= 1 ? '#475569' : '#ef4444',
                          cursor: pins.length <= 1 ? 'not-allowed' : 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: FOOTPRINT & SHAPE */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Select Generic Footprint
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Choose a visual shape to represent the component on the circuit canvas.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {FOOTPRINTS.map(fp => (
                  <div
                    key={fp.id}
                    onClick={() => setSelectedFootprint(fp)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: selectedFootprint.id === fp.id ? 'rgba(56, 189, 248, 0.15)' : '#071831',
                      border: selectedFootprint.id === fp.id ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                      {fp.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                      Dimensions: {fp.width} × {fp.height} px
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW & VERIFICATION */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Capability Level Badge */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: levelInfo.badgeBg,
                  border: `1px solid ${levelInfo.badgeBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color={levelInfo.color} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: levelInfo.color }}>
                      {levelInfo.tier}: {levelInfo.label}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#e2e8f0' }}>
                      {levelInfo.description}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: '#94a3b8'
                  }}
                >
                  Simulation: Unsupported
                </div>
              </div>

              {/* Live Canvas SVG Footprint Preview */}
              <div
                style={{
                  backgroundColor: '#071831',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
                  Canvas Visual & Pin Placement Preview
                </div>

                <svg
                  width={selectedFootprint.width + 40}
                  height={selectedFootprint.height + 40}
                  viewBox={`-20 -20 ${selectedFootprint.width + 40} ${selectedFootprint.height + 40}`}
                  style={{ overflow: 'visible' }}
                >
                  <g dangerouslySetInnerHTML={{ __html: svgBody }} />
                  {positionedPins.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
                      <text
                        x={p.x}
                        y={p.y + (p.y > selectedFootprint.height / 2 ? 14 : -8)}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize={8}
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Verification Details */}
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                • <strong>Identifier:</strong> <code>{compType}</code><br />
                • <strong>Pins:</strong> {positionedPins.map(p => p.label).join(', ')}<br />
                • <strong>Voltage Domain:</strong> {voltageDomain}<br />
                • <strong>Simulation Disclosure:</strong> Component will participate in schematic layout and rule checks, but will not claim fake firmware execution.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#071831'
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <TracewiseBubbleButton
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  setError('Please provide a component name.');
                  return;
                }
                setError('');
                setStep(s => s + 1);
              }}
              variant="primary"
              size="sm"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </TracewiseBubbleButton>
          ) : (
            <TracewiseBubbleButton
              onClick={handleSave}
              disabled={isSaving}
              variant="accent"
              size="sm"
            >
              <Check size={14} />
              <span>{isSaving ? 'Registering...' : 'Save & Register Component'}</span>
            </TracewiseBubbleButton>
          )}
        </div>
      </div>
    </div>
  );
}
