import React, { useState } from 'react';
import { X, Cpu, Check, AlertCircle, FileText, Upload, ShieldCheck, Sparkles } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';
import {
  submitComponentRequest,
  validateComponentDescriptor,
  registerCustomComponent,
  sanitizeSvgMarkup
} from '../../domain/componentRegistry';

export function RequestComponentModal({ isOpen, onClose, onComponentImported }) {
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'import'

  // Request Form State
  const [reqName, setReqName] = useState('');
  const [reqPartNumber, setReqPartNumber] = useState('');
  const [reqCategory, setReqCategory] = useState('Sensors');
  const [reqPinCount, setReqPinCount] = useState('');
  const [reqDatasheet, setReqDatasheet] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [reqSubmitted, setReqSubmitted] = useState(false);
  const [reqError, setReqError] = useState('');

  // Import JSON State
  const [importJson, setImportJson] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [importSecurityNotes, setImportSecurityNotes] = useState([]);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setReqError('');

    if (!reqName.trim()) {
      setReqError('Component name is required');
      return;
    }

    try {
      submitComponentRequest({
        name: reqName,
        partNumber: reqPartNumber,
        category: reqCategory,
        pinCount: reqPinCount,
        datasheetUrl: reqDatasheet,
        description: reqDescription
      });

      setReqSubmitted(true);
      setTimeout(() => {
        setReqSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      setReqError(err.message || 'Failed to submit request');
    }
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    setImportErrors([]);
    setImportSecurityNotes([]);

    if (!importJson.trim()) {
      setImportErrors(['Please provide a JSON descriptor']);
      return;
    }

    try {
      const parsed = JSON.parse(importJson);

      // 1. Validate descriptor schema
      const validation = validateComponentDescriptor(parsed);
      if (!validation.valid) {
        setImportErrors(validation.errors);
        return;
      }

      // 2. Strict SVG sanitation check if svgBody is included
      if (parsed.svgBody) {
        const san = sanitizeSvgMarkup(parsed.svgBody);
        if (san.issues.length > 0) {
          setImportSecurityNotes(san.issues);
        }
      }

      // 3. Register into runtime registry
      const registered = registerCustomComponent(parsed);
      setImportSuccess(true);

      if (onComponentImported) {
        onComponentImported(registered);
      }

      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      setImportErrors([err.message || 'Failed to parse JSON']);
    }
  };

  const loadSampleJson = () => {
    const sample = {
      type: "sensor-bme280",
      name: "BME280 Environmental Sensor",
      category: "Sensors",
      description: "Precision barometric pressure, temperature, and humidity sensor module with I2C/SPI interface.",
      width: 100,
      height: 80,
      viewBox: { x: 0, y: 0, width: 100, height: 80 },
      wiringSupported: true,
      codeAvailable: true,
      pins: [
        { id: "VIN", label: "VIN (3.3-5V)", role: "power-5v", x: 20, y: 68 },
        { id: "GND", label: "GND", role: "ground", x: 38, y: 68 },
        { id: "SCL", label: "SCL (I2C Clock)", role: "analog-i2c", x: 56, y: 68 },
        { id: "SDA", label: "SDA (I2C Data)", role: "analog-i2c", x: 74, y: 68 }
      ],
      aliases: ["bme280", "barometer", "pressure", "altimeter"]
    };
    setImportJson(JSON.stringify(sample, null, 2));
    setImportErrors([]);
    setImportSecurityNotes([]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 24, 49, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <TracewiseBubbleArea theme="light">
        <div
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(45, 197, 233, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--tw-brand)'
                }}
              >
                <Cpu size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                  Electronics Component Center
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                  Request uncataloged hardware or import custom components
                </span>
              </div>
            </div>
            <TracewiseBubbleIconButton
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={16} />
            </TracewiseBubbleIconButton>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--tw-border)', paddingBottom: '8px' }}>
            <TracewiseBubbleButton
              variant={activeTab === 'request' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('request')}
              style={{ fontSize: '0.8rem', minHeight: '34px' }}
            >
              <FileText size={14} />
              <span>Request Component</span>
            </TracewiseBubbleButton>

            <TracewiseBubbleButton
              variant={activeTab === 'import' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('import')}
              style={{ fontSize: '0.8rem', minHeight: '34px' }}
            >
              <Upload size={14} />
              <span>Import JSON / SVG</span>
            </TracewiseBubbleButton>
          </div>

          {/* TAB 1: Request Component */}
          {activeTab === 'request' && (
            <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reqError && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{reqError}</span>
                </div>
              )}

              {reqSubmitted && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} />
                  <span>Component request submitted! Our electronics team will add it to the catalog.</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Component Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BMP280 Barometer"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Part Number / IC Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BMP280 / GY-BME280"
                    value={reqPartNumber}
                    onChange={(e) => setReqPartNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.86rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="Microcontrollers">Microcontrollers</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Displays">Displays</option>
                    <option value="Input">Input Devices</option>
                    <option value="Output">Output & Actuators</option>
                    <option value="Passive">Passives & Power</option>
                    <option value="Semiconductors">Semiconductors</option>
                    <option value="Integrated Circuits">Integrated Circuits</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Pin Count (Approx.)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 4 or 6"
                    value={reqPinCount}
                    onChange={(e) => setReqPinCount(e.target.value)}
                    min="1"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Datasheet or Product URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={reqDatasheet}
                  onChange={(e) => setReqDatasheet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Use Case & Pin Descriptions
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe pins (e.g. VCC, GND, SDA, SCL) and the intended project..."
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <TracewiseBubbleButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  Cancel
                </TracewiseBubbleButton>
                <TracewiseBubbleButton
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  <Sparkles size={14} />
                  <span>Submit Request</span>
                </TracewiseBubbleButton>
              </div>
            </form>
          )}

          {/* TAB 2: Import Custom Component */}
          {activeTab === 'import' && (
            <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)' }}>
                  Paste component JSON descriptor:
                </span>
                <button
                  type="button"
                  onClick={loadSampleJson}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--tw-brand)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Load Sample BME280 JSON
                </button>
              </div>

              <textarea
                rows="8"
                placeholder='{\n  "type": "my-sensor",\n  "name": "My Custom Sensor",\n  "category": "Sensors",\n  "width": 100,\n  "height": 80,\n  "viewBox": { "x": 0, "y": 0, "width": 100, "height": 80 },\n  "pins": [\n    { "id": "VCC", "label": "VCC", "role": "power-5v", "x": 20, "y": 70 },\n    { "id": "GND", "label": "GND", "role": "ground", "x": 80, "y": 70 }\n  ]\n}'
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--tw-border)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: '#f8fafc',
                  resize: 'vertical'
                }}
              />

              {/* Strict Security Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                <ShieldCheck size={16} />
                <span>Strict DOMParser sanitizer automatically disarms any scripts, foreignObjects, or event handlers.</span>
              </div>

              {/* Validation Errors */}
              {importErrors.length > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Validation Failed:</div>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sanitization warnings / notices */}
              {importSecurityNotes.length > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#d97706', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>Security Sanitization Applied:</div>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {importSecurityNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} />
                  <span>Component verified and registered to your Studio library!</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <TracewiseBubbleButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  Cancel
                </TracewiseBubbleButton>
                <TracewiseBubbleButton
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  <Upload size={14} />
                  <span>Verify & Import</span>
                </TracewiseBubbleButton>
              </div>
            </form>
          )}
        </div>
      </TracewiseBubbleArea>
    </div>
  );
}
