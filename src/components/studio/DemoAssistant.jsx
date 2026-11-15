import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, AlertCircle, Wrench, RefreshCw } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function DemoAssistant({ project, validation, onApplyFix }) {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [appliedProposalId, setAppliedProposalId] = useState(null);

  // Check if there are known issues
  const pinMismatchCheck = validation.checks?.find(c => c.id === 'check-pin-mismatch' && c.status === 'FAILED');
  const ledProtectionCheck = validation.checks?.find(c => c.id === 'check-led-current' && c.status === 'WARNING');

  const proposals = [];

  if (pinMismatchCheck) {
    proposals.push({
      id: 'fix-pin-mismatch',
      title: 'Resolve Firmware Pin Conflict',
      summary: 'Change BUTTON_PIN definition in firmware from Pin 2 to Pin 7 to match physical wiring.',
      changes: [
        { type: 'code', description: 'Replace "const int BUTTON_PIN = 2;" with "const int BUTTON_PIN = 7;"' },
        { type: 'validation', description: 'Clears Pin Conflict Error on D2' }
      ],
      action: () => {
        // Fix code in sketch
        const currentCode = project.firmware?.files?.[0]?.content || '';
        const fixedCode = currentCode.replace(
          /(?:const\s+int|int|#define)\s+BUTTON_PIN\s*=?\s*2;?/,
          'const int BUTTON_PIN = 7;'
        );
        onApplyFix({ code: fixedCode });
        setAppliedProposalId('fix-pin-mismatch');
      }
    });
  }

  if (ledProtectionCheck) {
    proposals.push({
      id: 'fix-led-resistor',
      title: 'Add 220Ω Current Limiting Resistor',
      summary: 'Insert a 220Ω resistor in series with the unprotected LED to prevent overcurrent damage.',
      changes: [
        { type: 'circuit', description: 'Insert Resistor between LED Cathode and Ground rail' },
        { type: 'validation', description: 'Satisfies physical hardware safety rule' }
      ],
      action: () => {
        // Find unprotected LED
        const led = project.components.find(c => c.type === 'led');
        if (led) {
          onApplyFix({
            addResistorForLed: led.id
          });
          setAppliedProposalId('fix-led-resistor');
        }
      }
    });
  }

  // Generic enhancement proposal
  proposals.push({
    id: 'opt-format-code',
    title: 'Format Arduino C++ Structure',
    summary: 'Standardize indentation, comment headers, and setup/loop structure.',
    changes: [
      { type: 'code', description: 'Clean indentation and header comments' }
    ],
    action: () => {
      const currentCode = project.firmware?.files?.[0]?.content || '';
      const formatted = currentCode
        .split('\n')
        .map(l => l.trimEnd())
        .join('\n');
      onApplyFix({ code: formatted });
      setAppliedProposalId('opt-format-code');
    }
  });

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
        {/* Demo Assistant Notice Badge */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--tw-brand-soft)',
            border: '1px solid var(--tw-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} color="var(--tw-brand)" />
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', fontFamily: 'var(--font-heading)' }}>
              Demo Assistant — Rule & Schema Engine
            </span>
            <p style={{ fontSize: '0.72rem', color: 'var(--tw-text-secondary)', marginTop: '2px' }}>
              Deterministic reviewable engineering suggestions. No unvalidated hallucinated circuits.
            </p>
          </div>
        </div>

        {/* Suggested Engineering Proposals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
            Reviewable Circuit Proposals ({proposals.length})
          </h4>

          {proposals.map((prop) => (
            <div
              key={prop.id}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: appliedProposalId === prop.id ? '1.5px solid var(--tw-success)' : '1px solid var(--tw-border)',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h5 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--tw-text)' }}>
                  {prop.title}
                </h5>
                {appliedProposalId === prop.id && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--tw-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={13} /> Applied
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--tw-text-secondary)', lineHeight: 1.4 }}>
                {prop.summary}
              </p>

              {/* Change list */}
              <div style={{ background: 'var(--tw-bg)', padding: '6px 8px', borderRadius: '6px', fontSize: '0.72rem' }}>
                {prop.changes.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--tw-text-secondary)' }}>
                    <span style={{ color: 'var(--tw-brand)', fontWeight: 'bold' }}>•</span>
                    <span>{c.description}</span>
                  </div>
                ))}
              </div>

              <TracewiseBubbleButton
                onClick={prop.action}
                disabled={appliedProposalId === prop.id}
                variant={appliedProposalId === prop.id ? 'secondary' : 'primary'}
                size="sm"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  alignSelf: 'flex-start',
                  marginTop: '4px',
                  gap: '6px',
                  opacity: appliedProposalId === prop.id ? 0.7 : 1
                }}
              >
                <Wrench size={12} />
                <span>{appliedProposalId === prop.id ? 'Fix Applied' : 'Apply Proposal'}</span>
              </TracewiseBubbleButton>
            </div>
          ))}
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
