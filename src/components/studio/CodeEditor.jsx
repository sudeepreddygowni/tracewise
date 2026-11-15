import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, Terminal, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';

export function CodeEditor({ code = '', onChange, onRunCheck, validationResults = [] }) {
  const [copied, setCopied] = useState(false);
  const [detectedPins, setDetectedPins] = useState([]);

  // Parse code for pins
  useEffect(() => {
    const pins = [];
    const pinRegex = /(?:pinMode|digitalWrite|digitalRead|analogWrite|analogRead)\s*\(\s*([A-Za-z0-9_]+)/g;
    let match;
    while ((match = pinRegex.exec(code)) !== null) {
      if (!pins.includes(match[1])) {
        pins.push(match[1]);
      }
    }
    setDetectedPins(pins);
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = (code.match(/\n/g) || []).length + 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#071831',
        color: '#f8fafc',
        fontFamily: 'var(--font-code)',
        overflow: 'hidden'
      }}
    >
      {/* Editor Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: '#0b2348',
          borderBottom: '1px solid rgba(74, 167, 242, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16} color="#2dc5e9" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
            sketch.ino
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
            Arduino C++
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopy}
            title="Copy Code"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#cbd5e1',
              fontSize: '0.75rem'
            }}
          >
            {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Line Numbers */}
        <div
          style={{
            width: '42px',
            padding: '12px 8px',
            backgroundColor: '#081e3d',
            color: '#475569',
            fontSize: '0.82rem',
            lineHeight: '1.6',
            textAlign: 'right',
            userSelect: 'none',
            borderRight: '1px solid rgba(74, 167, 242, 0.1)'
          }}
        >
          {[...Array(lineCount)].map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck="false"
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: 'transparent',
            color: '#f8fafc',
            fontSize: '0.82rem',
            lineHeight: '1.6',
            fontFamily: 'var(--font-code)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflowX: 'auto',
            tabSize: 2
          }}
        />
      </div>

      {/* Pin Reference & Diagnostics Status Footer */}
      <div
        style={{
          padding: '8px 14px',
          backgroundColor: '#081e3d',
          borderTop: '1px solid rgba(74, 167, 242, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          <span style={{ color: '#94a3b8' }}>Detected GPIO Pins:</span>
          {detectedPins.length > 0 ? (
            detectedPins.map((p) => (
              <span
                key={p}
                style={{
                  color: '#2dc5e9',
                  background: 'rgba(45, 197, 233, 0.12)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              >
                {p}
              </span>
            ))
          ) : (
            <span style={{ color: '#64748b' }}>None</span>
          )}
        </div>

        <button
          onClick={onRunCheck}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'var(--tw-brand)',
            color: '#ffffff',
            fontWeight: 600
          }}
        >
          <Play size={12} fill="#ffffff" />
          <span>Validate Code</span>
        </button>
      </div>
    </div>
  );
}
