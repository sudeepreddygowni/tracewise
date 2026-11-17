import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  Send,
  X,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { useSimulation } from '../../store/useSimulationStore';
import { TracewiseBubbleButton, TracewiseBubbleIconButton, TracewiseBubbleArea } from '../ui/BubbleActions';

const BAUD_RATES = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

export function SerialMonitor({ isOpen, onClose }) {
  const {
    serialOutput,
    sendSerial,
    clearSerial,
    baudRate,
    setBaudRate,
    isRunning,
    isPaused
  } = useSimulation();

  const [inputVal, setInputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const terminalEndRef = useRef(null);

  // Auto-scroll terminal to bottom when new serial data arrives
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialOutput, autoScroll]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendSerial(inputVal);
    setInputVal('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(serialOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="tracewise-serial-monitor"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: isExpanded ? '380px' : '220px',
        backgroundColor: '#071831',
        borderTop: '2px solid #2dc5e9',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 48,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-code)',
        animation: 'slideUp 0.2s ease-out'
      }}
    >
      <TracewiseBubbleArea theme="dark">
        {/* Terminal Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: '#0b2348',
            borderBottom: '1px solid rgba(74, 167, 242, 0.2)',
            flexShrink: 0
          }}
        >
          {/* Title & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={15} color="#2dc5e9" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
              Serial Monitor
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                backgroundColor: isRunning ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.08)',
                color: isRunning ? '#22c55e' : '#94a3b8',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              {isRunning ? 'UART CONNECTED' : isPaused ? 'UART PAUSED' : 'UART OFFLINE'}
            </span>
          </div>

          {/* Controls: Baud rate, Autoscroll, Clear, Copy, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Baud Rate Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#94a3b8' }}>
              <span>Baud:</span>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(Number(e.target.value))}
                style={{
                  backgroundColor: '#071831',
                  color: '#2dc5e9',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-code)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {BAUD_RATES.map((b) => (
                  <option key={b} value={b}>
                    {b} baud
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-scroll toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#2dc5e9' }}
              />
              <span>Autoscroll</span>
            </label>

            {/* Clear Button */}
            <TracewiseBubbleIconButton
              onClick={clearSerial}
              title="Clear Terminal Output"
              size="sm"
              style={{ color: '#94a3b8' }}
            >
              <Trash2 size={13} />
            </TracewiseBubbleIconButton>

            {/* Copy Button */}
            <TracewiseBubbleIconButton
              onClick={handleCopy}
              title="Copy Output"
              size="sm"
              style={{ color: '#94a3b8' }}
            >
              {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
            </TracewiseBubbleIconButton>

            {/* Expand / Minimize Toggle */}
            <TracewiseBubbleIconButton
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? 'Minimize' : 'Expand'}
              size="sm"
              style={{ color: '#94a3b8' }}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </TracewiseBubbleIconButton>

            {/* Close Button */}
            <TracewiseBubbleIconButton
              onClick={onClose}
              title="Close Serial Monitor"
              size="sm"
              style={{ color: '#94a3b8' }}
            >
              <X size={14} />
            </TracewiseBubbleIconButton>
          </div>
        </div>

        {/* Terminal Screen Output Area */}
        <div
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#020617',
            color: '#38bdf8',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            userSelect: 'text'
          }}
        >
          {serialOutput ? (
            <>
              {serialOutput}
              <div ref={terminalEndRef} />
            </>
          ) : (
            <div style={{ color: '#64748b', fontStyle: 'italic', paddingTop: '16px', textAlign: 'center' }}>
              No serial data received yet.<br />
              Add <span style={{ color: '#2dc5e9' }}>Serial.begin(9600);</span> in <span style={{ color: '#2dc5e9' }}>setup()</span> and <span style={{ color: '#2dc5e9' }}>Serial.println("Hello");</span> to print output here.
            </div>
          )}
        </div>

        {/* Input Bar for Sending Text to MCU RX */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 12px',
            backgroundColor: '#081e3d',
            borderTop: '1px solid rgba(74, 167, 242, 0.2)',
            gap: '8px',
            flexShrink: 0
          }}
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type message to send to Arduino Uno (press Enter to send)..."
            style={{
              flex: 1,
              backgroundColor: '#071831',
              color: '#f8fafc',
              border: '1px solid rgba(45, 197, 233, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-code)',
              outline: 'none'
            }}
          />

          <TracewiseBubbleButton
            type="submit"
            variant="accent"
            size="sm"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              gap: '6px',
              minHeight: '32px'
            }}
          >
            <Send size={13} />
            <span>Send</span>
          </TracewiseBubbleButton>
        </form>
      </TracewiseBubbleArea>
    </div>
  );
}
