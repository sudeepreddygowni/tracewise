import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Info,
  Copy,
  Check,
  Terminal,
  Sparkles
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function ValidationDrawer({
  validation,
  isOpen,
  onToggle,
  onOpenAssistant
}) {
  const [copiedReport, setCopiedReport] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'STRUCTURAL' | 'CODE'

  const checks = validation?.checks || [];
  const errors = checks.filter(c => c.status === 'FAILED');
  const warnings = checks.filter(c => c.status === 'WARNING');
  const passed = checks.filter(c => c.status === 'PASSED');

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  const filteredChecks = checks.filter(c => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'STRUCTURAL') return c.id.includes('integrity') || c.id.includes('led');
    if (activeFilter === 'CODE') return c.id.includes('pin') || c.id.includes('code');
    return true;
  });

  const handleCopyReport = () => {
    const timestamp = new Date().toLocaleString();
    const reportText = [
      `==================================================`,
      `TRACEWISE CIRCUIT & FIRMWARE DIAGNOSTICS REPORT`,
      `Generated: ${timestamp}`,
      `Status: ${hasErrors ? 'STRUCTURALLY INVALID' : hasWarnings ? 'STRUCTURAL WARNINGS' : 'STRUCTURALLY VALID'}`,
      `Rules Satisfied: ${passed.length}/${checks.length}`,
      `==================================================\n`,
      `[RULE DETAILS]`,
      ...checks.map(c => `• [${c.status}] ${c.name}\n  Origin: ${c.ruleOrigin}\n  Details: ${c.message}${c.suggestedFix ? `\n  Suggested Fix: ${c.suggestedFix}` : ''}`),
      `\n[CLIENT EXECUTION NOTICE]`,
      `Tracewise runs deterministic static AST parsing and catalog pin mapping checks. It is not an analog SPICE simulator.`
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

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
      {/* Drawer Header Bar */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          cursor: 'pointer',
          backgroundColor: hasErrors ? '#fff1f2' : hasWarnings ? '#fffbeb' : '#f0fdf4',
          borderBottom: isOpen ? '1px solid var(--tw-border)' : 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hasErrors ? (
            <XCircle size={18} color="var(--tw-error)" />
          ) : hasWarnings ? (
            <AlertTriangle size={18} color="#d97706" />
          ) : (
            <CheckCircle2 size={18} color="var(--tw-success)" />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: hasErrors ? 'var(--tw-error)' : hasWarnings ? '#b45309' : 'var(--tw-success)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {hasErrors ? 'STRUCTURALLY INVALID' : hasWarnings ? 'STRUCTURAL WARNINGS' : 'STRUCTURALLY VALID'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
              ({passed.length}/{checks.length} checks satisfied)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-secondary)', fontWeight: 500 }}>
            {isOpen ? 'Collapse Diagnostics' : 'Inspect Rule Engine Output'}
          </span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Expanded Diagnostics Console */}
      {isOpen && (
        <TracewiseBubbleArea theme="light">
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '280px', overflowY: 'auto' }}>
            {/* Control Bar: Filters + Copy Report Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <TracewiseBubbleButton
                  onClick={(e) => { e.stopPropagation(); setActiveFilter('ALL'); }}
                  variant={activeFilter === 'ALL' ? 'primary' : 'ghost'}
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                >
                  All ({checks.length})
                </TracewiseBubbleButton>
                <TracewiseBubbleButton
                  onClick={(e) => { e.stopPropagation(); setActiveFilter('STRUCTURAL'); }}
                  variant={activeFilter === 'STRUCTURAL' ? 'primary' : 'ghost'}
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                >
                  Structural & Pins
                </TracewiseBubbleButton>
                <TracewiseBubbleButton
                  onClick={(e) => { e.stopPropagation(); setActiveFilter('CODE'); }}
                  variant={activeFilter === 'CODE' ? 'primary' : 'ghost'}
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                >
                  Firmware AST
                </TracewiseBubbleButton>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TracewiseBubbleButton
                  onClick={(e) => { e.stopPropagation(); handleCopyReport(); }}
                  variant="secondary"
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px' }}
                  title="Copy formatted diagnostics report to clipboard"
                >
                  {copiedReport ? <Check size={13} color="var(--tw-success)" /> : <Copy size={13} />}
                  <span>{copiedReport ? 'Report Copied' : 'Copy Report'}</span>
                </TracewiseBubbleButton>
              </div>
            </div>

            {/* Check Results Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredChecks.map((chk) => (
                <div
                  key={chk.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--tw-bg)',
                    border: '1px solid var(--tw-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  {chk.status === 'PASSED' && <CheckCircle2 size={18} color="var(--tw-success)" style={{ marginTop: '2px', flexShrink: 0 }} />}
                  {chk.status === 'WARNING' && <AlertTriangle size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />}
                  {chk.status === 'FAILED' && <XCircle size={18} color="var(--tw-error)" style={{ marginTop: '2px', flexShrink: 0 }} />}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <h5 style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--tw-text)', margin: 0 }}>
                        {chk.name}
                      </h5>
                      <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)', fontFamily: 'var(--font-code)', backgroundColor: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                        {chk.ruleOrigin}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      {chk.message}
                    </p>

                    {chk.suggestedFix && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--tw-brand)', fontWeight: 600 }}>
                          Fix: {chk.suggestedFix}
                        </div>
                        {onOpenAssistant && (
                          <TracewiseBubbleButton
                            onClick={(e) => { e.stopPropagation(); onOpenAssistant(); }}
                            variant="secondary"
                            size="sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
                          >
                            <Sparkles size={12} color="var(--tw-brand)" />
                            <span>Fix with Assistant</span>
                          </TracewiseBubbleButton>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Honest Disclaimer Notice */}
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--tw-text-secondary)',
                backgroundColor: 'rgba(7, 24, 49, 0.04)',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.4
              }}
            >
              <Info size={14} color="var(--tw-brand)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Static AST & Rule Engine:</strong> Tracewise structural validation verifies pin references and circuit catalog connections. It does not replace physical breadboard assembly or analog SPICE simulation.
              </span>
            </div>
          </div>
        </TracewiseBubbleArea>
      )}
    </div>
  );
}
