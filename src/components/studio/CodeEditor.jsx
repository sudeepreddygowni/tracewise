import React, { useState, useEffect, useRef } from 'react';
import { Play, Copy, Check, Terminal, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function CodeEditor({ code = '', onChange, onRunCheck, validationResults = [] }) {
  const [copied, setCopied] = useState(false);
  const [detectedPins, setDetectedPins] = useState([]);
  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);

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

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const lineCount = (code.match(/\n/g) || []).length + 1;

  return (
    <TracewiseBubbleArea theme="dark">
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
            padding: '10px 16px',
            backgroundColor: '#0b2348',
            borderBottom: '1px solid rgba(74, 167, 242, 0.2)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={16} color="#2dc5e9" />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>
              sketch.ino
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
              Arduino C++
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TracewiseBubbleButton
              onClick={handleCopy}
              title="Copy Code"
              variant="secondary"
              size="sm"
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                minHeight: '34px',
                gap: '5px'
              }}
            >
              {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </TracewiseBubbleButton>
          </div>
        </div>

        {/* Editor Body with Synchronized Line Numbers */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            style={{
              width: '40px',
              padding: '12px 6px',
              backgroundColor: '#081e3d',
              color: '#475569',
              fontSize: '0.82rem',
              lineHeight: '1.6',
              textAlign: 'right',
              userSelect: 'none',
              borderRight: '1px solid rgba(74, 167, 242, 0.1)',
              overflowY: 'hidden',
              flexShrink: 0
            }}
          >
            {[...Array(lineCount)].map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Textarea Code Input with Touch Scrolling */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            spellCheck="false"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#f8fafc',
              fontSize: '0.84rem',
              lineHeight: '1.6',
              fontFamily: 'var(--font-code)',
              border: 'none',
              outline: 'none',
              resize: 'none',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              overflowX: 'auto',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y pan-x',
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
            fontSize: '0.75rem',
            flexShrink: 0,
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', minWidth: 0 }}>
            <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>GPIO:</span>
            {detectedPins.length > 0 ? (
              detectedPins.map((p) => (
                <span
                  key={p}
                  style={{
                    color: '#2dc5e9',
                    background: 'rgba(45, 197, 233, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p}
                </span>
              ))
            ) : (
              <span style={{ color: '#64748b' }}>None</span>
            )}
          </div>

          <TracewiseBubbleButton
            onClick={onRunCheck}
            variant="accent"
            size="sm"
            style={{
              fontSize: '0.76rem',
              padding: '5px 12px',
              minHeight: '34px',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Play size={12} fill="#071831" />
            <span>Validate</span>
          </TracewiseBubbleButton>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}