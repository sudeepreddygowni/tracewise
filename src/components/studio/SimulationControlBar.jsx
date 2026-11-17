import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Terminal,
  Cpu,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSimulation } from '../../store/useSimulationStore';

export function SimulationControlBar({ project, onOpenValidation }) {
  const {
    status,
    simTime,
    isCompiling,
    isRunning,
    isPaused,
    isStopped,
    compileError,
    lastCompiledHex,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    toggleSerial,
    isSerialOpen
  } = useSimulation();

  // Format simTime (seconds) as mm:ss.ms (e.g. 00:03.450s)
  const formatTime = (secs) => {
    const totalMs = Math.floor((secs || 0) * 1000);
    const m = Math.floor(totalMs / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}s`;
  };

  const handleTogglePlay = () => {
    if (isStopped || status === 'READY' || status === 'ERROR') {
      startSimulation(project);
    } else if (isRunning) {
      pauseSimulation();
    } else if (isPaused) {
      resumeSimulation();
    }
  };

  const canStop = !isCompiling && (isRunning || isPaused);
  const canReset = !isCompiling && (isRunning || isPaused || Boolean(lastCompiledHex));

  return (
    <div
      style={{
        padding: '6px 12px 8px 12px',
        backgroundColor: '#071831',
        zIndex: 40,
        position: 'relative'
      }}
    >
      <div
        className="tracewise-simulation-dock"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'linear-gradient(180deg, #0e2448 0%, #091a35 100%)',
          border: '1px solid rgba(45, 197, 233, 0.28)',
          borderRadius: '14px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* =========================================================
            GROUP 1 & 2: PRIMARY & SECONDARY CONTROLS
        ========================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* PRIMARY: Start / Pause / Resume */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={isCompiling}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              minHeight: '34px',
              borderRadius: '9px',
              border: isRunning
                ? '1px solid rgba(250, 204, 21, 0.45)'
                : '1px solid rgba(45, 197, 233, 0.6)',
              backgroundColor: isRunning
                ? '#1e3a6a'
                : isPaused
                ? '#0284c7'
                : '#2dc5e9',
              color: isRunning ? '#fef08a' : isPaused ? '#ffffff' : '#071831',
              cursor: isCompiling ? 'not-allowed' : 'pointer',
              boxShadow: isRunning
                ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                : '0 2px 10px rgba(45, 197, 233, 0.35)',
              transition: 'all 0.15s ease'
            }}
            title={
              isCompiling
                ? 'Compiling C++ firmware...'
                : isRunning
                ? 'Pause Simulation (Freeze Clock)'
                : isPaused
                ? 'Resume Simulation'
                : 'Start Real MCU Simulation'
            }
          >
            {isCompiling ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Compiling...</span>
              </>
            ) : isRunning ? (
              <>
                <Pause size={14} fill="currentColor" />
                <span>Pause</span>
              </>
            ) : isPaused ? (
              <>
                <Play size={14} fill="currentColor" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>Start Simulation</span>
              </>
            )}
          </button>

          {/* SECONDARY: Stop Button */}
          <button
            type="button"
            onClick={stopSimulation}
            disabled={!canStop}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              minHeight: '34px',
              borderRadius: '9px',
              cursor: canStop ? 'pointer' : 'default',
              border: canStop
                ? '1px solid rgba(239, 68, 68, 0.45)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: canStop
                ? 'rgba(239, 68, 68, 0.16)'
                : 'rgba(255, 255, 255, 0.05)',
              color: canStop ? '#fca5a5' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
            title={canStop ? 'Stop Simulation and Reset Outputs' : 'Simulation Stopped'}
          >
            <Square size={13} fill="currentColor" />
            <span>Stop</span>
          </button>

          {/* SECONDARY: Reset Button */}
          <button
            type="button"
            onClick={resetSimulation}
            disabled={!canReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              minHeight: '34px',
              borderRadius: '9px',
              cursor: canReset ? 'pointer' : 'default',
              border: canReset
                ? '1px solid rgba(56, 189, 248, 0.35)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: canReset
                ? 'rgba(56, 189, 248, 0.12)'
                : 'rgba(255, 255, 255, 0.05)',
              color: canReset ? '#e0f2fe' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
            title={
              canReset
                ? (isRunning || isPaused ? 'Reset Microcontroller (Restart from Cycle 0)' : 'Restart Simulation from Compiled Firmware')
                : 'Reset Simulation (Available when firmware is compiled)'
            }
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* =========================================================
            GROUP 3: INFO (Target MCU + Virtual Clock Timer + Status)
        ========================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Target Microcontroller Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '5px 11px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              color: '#cbd5e1'
            }}
          >
            <Cpu size={14} color="#2dc5e9" />
            <span style={{ fontWeight: 600, color: '#ffffff' }}>Arduino Uno</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: '#94a3b8' }}>ATmega328P @ 16MHz</span>
          </div>

          {/* Live Virtual Clock Timer */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isRunning ? 'rgba(34, 197, 94, 0.16)' : 'rgba(0, 0, 0, 0.35)',
              padding: '5px 11px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-code)',
              border: isRunning
                ? '1px solid rgba(34, 197, 94, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <Clock size={13} color={isRunning ? '#4ade80' : '#94a3b8'} />
            <span
              style={{
                fontWeight: 700,
                color: isRunning ? '#4ade80' : isPaused ? '#fef08a' : '#cbd5e1'
              }}
            >
              {formatTime(simTime)}
            </span>
          </div>

          {/* Status Badge */}
          {status === 'ERROR' && (
            <div
              onClick={onOpenValidation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title={compileError || 'Error in circuit or code'}
            >
              <AlertCircle size={13} color="#ef4444" />
              <span>{compileError ? 'Compile Error' : 'Circuit Error'}</span>
            </div>
          )}

          {status === 'RUNNING' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(34, 197, 94, 0.18)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#86efac',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px #22c55e'
                }}
              />
              <span>RUNNING</span>
            </div>
          )}

          {status === 'PAUSED' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(234, 179, 8, 0.18)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#fef08a',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <span>PAUSED</span>
            </div>
          )}
        </div>

        {/* =========================================================
            GROUP 4: UTILITY (Serial Monitor Toggle)
        ========================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleSerial}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              minHeight: '34px',
              borderRadius: '9px',
              cursor: 'pointer',
              border: isSerialOpen
                ? '1px solid rgba(45, 197, 233, 0.65)'
                : '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: isSerialOpen
                ? '#2dc5e9'
                : 'rgba(255, 255, 255, 0.08)',
              color: isSerialOpen ? '#071831' : '#ffffff',
              boxShadow: isSerialOpen ? '0 2px 8px rgba(45, 197, 233, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Toggle Microcontroller Serial Monitor (UART Console)"
          >
            <Terminal size={13} />
            <span>Serial Monitor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
