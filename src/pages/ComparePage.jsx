import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { getProjectById, getAllProjects } from '../services/projectStorage';
import { compareProjects } from '../domain/compareVersions';
import {
  GitCompare,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  Wrench,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function ComparePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject, loadProject, updateFirmware, saveCurrent } = useProject();

  const allProjects = getAllProjects();

  // Selected current project
  const current = (activeProject?.id === projectId ? activeProject : getProjectById(projectId)) || allProjects[1] || allProjects[0];
  
  // Baseline project (parent project or traffic-light baseline)
  const defaultBaselineId = current?.version?.parentId || 'starter-traffic-light';
  const [baselineId, setBaselineId] = useState(defaultBaselineId);
  const baseline = getProjectById(baselineId) || allProjects[0];

  const [fixApplied, setFixApplied] = useState(false);

  // Compute diff
  const diff = compareProjects(baseline, current);

  const handleApplyFix = () => {
    // If fixing the canonical pedestrian button bug:
    const currentCode = current.firmware?.files?.[0]?.content || '';
    const fixedCode = currentCode.replace(
      /(?:const\s+int|int|#define)\s+BUTTON_PIN\s*=?\s*2;?/,
      'const int BUTTON_PIN = 7;'
    );
    updateFirmware(fixedCode);
    saveCurrent();
    setFixApplied(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }
  };

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
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
              to={`/app/studio/${current.id}`}
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
              <GitCompare size={18} color="var(--tw-brand)" />
              <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
                Compare & Debug • See What Changed
              </h1>
            </div>
          </div>

          {/* Version Pickers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--tw-text-muted)' }}>Baseline:</span>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--tw-border)',
                  backgroundColor: 'var(--tw-bg)',
                  fontSize: '0.82rem'
                }}
              >
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.version?.label || 'Baseline'})
                  </option>
                ))}
              </select>
            </div>

            <span style={{ color: 'var(--tw-text-muted)' }}>vs</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--tw-text-muted)' }}>Current Fork:</span>
              <span style={{ fontWeight: 600, color: 'var(--tw-brand)' }}>
                {current?.title}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Core Question Callout */}
          <div
            className="glass-card"
            style={{
              padding: '28px 32px',
              background: 'linear-gradient(135deg, rgba(30,63,216,0.06) 0%, rgba(45,197,233,0.08) 100%)',
              border: '1px solid rgba(74, 167, 242, 0.4)',
              borderRadius: 'var(--tw-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Change-Aware Engineering
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
                Something stopped working? See what changed.
              </h2>
              <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '6px', maxWidth: '640px', lineHeight: 1.5 }}>
                Comparing the working <b>{baseline?.title}</b> with your modified <b>{current?.title}</b>. We isolate the exact connections, components, and code lines you changed so you can fix the problem.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--tw-border)' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--tw-brand)', fontFamily: 'var(--font-heading)' }}>
                  {diff?.summary?.addedComponentsCount + diff?.summary?.removedComponentsCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)' }}>Parts Changed</div>
              </div>
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--tw-border)' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--tw-sky)', fontFamily: 'var(--font-heading)' }}>
                  {diff?.summary?.addedWiresCount + diff?.summary?.removedWiresCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)' }}>Wires Changed</div>
              </div>
              <div style={{ textAlign: 'center', background: '#ffffff', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--tw-border)' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--tw-cyan)', fontFamily: 'var(--font-heading)' }}>
                  {diff?.summary?.codeLinesChanged}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)' }}>Code Lines Diff</div>
              </div>
            </div>
          </div>

        {/* Diagnosis & Suggested Fix Box */}
        {diff?.validation?.newErrors?.length > 0 && (
          <div
            style={{
              padding: '24px 28px',
              borderRadius: 'var(--tw-radius-lg)',
              backgroundColor: '#fff1f2',
              border: '1.5px solid var(--tw-error)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={22} color="var(--tw-error)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-error)' }}>
                  Detected Regression: {diff.validation.newErrors[0].name}
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tw-error)', background: '#fee2e2', padding: '4px 10px', borderRadius: '12px' }}>
                Introduced in this version
              </span>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#881337', lineHeight: 1.5 }}>
              {diff.validation.newErrors[0].message}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(244,63,94,0.2)' }}>
              <div style={{ fontSize: '0.85rem', color: '#9f1239' }}>
                <b>Recommended Fix:</b> {diff.validation.newErrors[0].suggestedFix}
              </div>

              <TracewiseBubbleButton
                onClick={handleApplyFix}
                disabled={fixApplied}
                variant={fixApplied ? 'secondary' : 'primary'}
                size="md"
                style={{
                  padding: '9px 20px',
                  fontSize: '0.88rem',
                  gap: '8px'
                }}
              >
                {fixApplied ? <Check size={16} /> : <Wrench size={16} />}
                <span>{fixApplied ? 'Fix Applied Successfully!' : 'Apply One-Click Fix'}</span>
              </TracewiseBubbleButton>
            </div>
          </div>
        )}

        {/* Two-Column Diffs (Circuit Graph & Firmware Code) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Column 1: Circuit Graph Changes */}
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tw-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Circuit & Wiring Differences</span>
            </h3>

            {/* Components Diff */}
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text-muted)', marginBottom: '8px' }}>
                Components
              </h4>
              {diff?.components?.added.length === 0 && diff?.components?.removed.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-secondary)' }}>No components added or removed.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diff?.components?.added.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        fontSize: '0.8rem',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>+ Added:</span>
                      <span>{c.name || c.id} ({c.type})</span>
                    </div>
                  ))}
                  {diff?.components?.removed.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        fontSize: '0.8rem',
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>- Removed:</span>
                      <span>{c.name || c.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wires Diff */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text-muted)', marginBottom: '8px' }}>
                Connections & Pins
              </h4>
              {diff?.wires?.added.length === 0 && diff?.wires?.removed.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-secondary)' }}>No wire changes.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diff?.wires?.added.map((w) => (
                    <div
                      key={w.id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        fontSize: '0.8rem',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>+ Wire:</span>
                      <span>{w.from.componentId}:{w.from.pinId} → {w.to.componentId}:{w.to.pinId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Firmware Code Diff */}
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tw-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={16} color="var(--tw-brand)" />
              <span>Firmware Diff (sketch.ino)</span>
            </h3>

            <div
              style={{
                backgroundColor: '#071831',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'var(--font-code)',
                fontSize: '0.78rem',
                lineHeight: 1.6,
                maxHeight: '340px',
                overflowY: 'auto'
              }}
            >
              {(diff?.firmwareDiff || []).map((line, idx) => {
                const isAdded = line.type === 'added';
                const isRemoved = line.type === 'removed';

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      backgroundColor: isAdded
                        ? 'rgba(34, 197, 94, 0.2)'
                        : isRemoved
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'transparent',
                      color: isAdded ? '#4ade80' : isRemoved ? '#f87171' : '#cbd5e1',
                      padding: '1px 6px',
                      borderRadius: '2px'
                    }}
                  >
                    <span style={{ width: '24px', color: '#64748b', userSelect: 'none' }}>
                      {isAdded ? '+' : isRemoved ? '-' : ' '}
                    </span>
                    <span style={{ whiteSpace: 'pre' }}>{line.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  </TracewiseBubbleArea>
  );
}
