import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronUp, ChevronDown, ShieldCheck, Info } from 'lucide-react';

export function ValidationDrawer({ validation }) {
  const [isOpen, setIsOpen] = useState(false);

  const checks = validation?.checks || [];
  const overallStatus = validation?.overallStatus || 'STRUCTURALLY_VALID';
  const hasErrors = checks.some(c => c.status === 'FAILED');
  const hasWarnings = checks.some(c => c.status === 'WARNING');

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--tw-border)',
        zIndex: 50,
        boxShadow: isOpen ? '0 -8px 24px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Drawer Toggle Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px',
          cursor: 'pointer',
          backgroundColor: hasErrors ? '#fff1f2' : hasWarnings ? '#fffbeb' : '#f0fdf4',
          borderBottom: isOpen ? '1px solid var(--tw-border)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hasErrors ? (
            <XCircle size={18} color="var(--tw-error)" />
          ) : hasWarnings ? (
            <AlertTriangle size={18} color="var(--tw-warning)" />
          ) : (
            <CheckCircle2 size={18} color="var(--tw-success)" />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: hasErrors ? 'var(--tw-error)' : hasWarnings ? 'var(--tw-warning)' : 'var(--tw-success)'
              }}
            >
              {hasErrors ? 'STRUCTURALLY INVALID' : hasWarnings ? 'STRUCTURAL WARNINGS' : 'STRUCTURALLY VALID'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
              ({checks.filter(c => c.status === 'PASSED').length}/{checks.length} rules satisfied)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--tw-text-secondary)' }}>
          <span>{isOpen ? 'Collapse Checks' : 'View Rule Diagnostics'}</span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Expanded Checks List */}
      {isOpen && (
        <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {checks.map((chk) => (
            <div
              key={chk.id}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--tw-bg)',
                border: '1px solid var(--tw-border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              {chk.status === 'PASSED' && <CheckCircle2 size={16} color="var(--tw-success)" style={{ marginTop: '2px', flexShrink: 0 }} />}
              {chk.status === 'WARNING' && <AlertTriangle size={16} color="var(--tw-warning)" style={{ marginTop: '2px', flexShrink: 0 }} />}
              {chk.status === 'FAILED' && <XCircle size={16} color="var(--tw-error)" style={{ marginTop: '2px', flexShrink: 0 }} />}

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <h5 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--tw-text)' }}>
                    {chk.name}
                  </h5>
                  <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)', fontFamily: 'var(--font-code)' }}>
                    {chk.ruleOrigin}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--tw-text-secondary)', lineHeight: 1.4 }}>
                  {chk.message}
                </p>
                {chk.suggestedFix && (
                  <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--tw-brand)', fontWeight: 600 }}>
                    Fix: {chk.suggestedFix}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Honest Disclaimer Notice */}
          <div style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={13} />
            <span>
              Tracewise Structural Validation checks wire references and pin catalog definitions. It does not replace physical breadboard testing or electrical SPICE simulation.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
