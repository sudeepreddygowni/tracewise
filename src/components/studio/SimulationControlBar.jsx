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
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useSimulation } from '../../store/useSimulationStore';
import { TracewiseBubbleButton, TracewiseBubbleArea } from '../ui/BubbleActions';

export function SimulationControlBar({ project, onOpenValidation }) {
  const {
    status,
    simTime,
    isCompiling,
    isRunning,
    isPaused,
    isStopped,
    compileError,
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
    const totalMs = Math.floor(secs * 1000);
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

  return (
    <TracewiseBubbleArea theme="light">
      <div
        className="tracewise-simulation-control-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: '#071831',
          borderBottom: '1px solid rgba(45, 197, 233, 0.25)',
          color: '#f8fafc',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 40,
          position: 'relative'
        }}
      >
        {/* Left: Simulation Primary Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Main Play / Pause Button */}
          <TracewiseBubbleButton
            onClick={handleTogglePlay}
            disabled={isCompiling}
            variant={isRunning ? 'secondary' : 'accent'}
            size="sm"
            style={{
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              minHeight: '34px',
              backgroundColor: isRunning ? '#0e2b58' : '#2dc5e9',
              color: isRunning ? '#ffffff' : '#071831'
            }}
            title={isRunning ? 'Pause Simulation' : isPaused ? 'Resume Simulation' : 'Start Real MCU Simulation'}
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
          </TracewiseBubbleButton>

          {/* Stop Button */}
          <TracewiseBubbleButton
            onClick={stopSimulation}
            disabled={isStopped || isCompiling}
            variant="ghost"
            size="sm"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              minHeight: '34px',
              gap: '5px',
              color: isStopped ? '#64748b' : '#ef4444'
            }}
            title="Stop Simulation and Reset All Outputs"
          >
            <Square size={13} fill="currentColor" />
            <span>Stop</span>
          </TracewiseBubbleButton>

          {/* Reset Button */}
          <TracewiseBubbleButton
            onClick={resetSimulation}
            disabled={isStopped || isCompiling}
            variant="ghost"
            size="sm"
            style={{
              padding: '6px 10px',
              fontSize: '0.78rem',
              minHeight: '34px',
              gap: '5px',
              color: isStopped ? '#64748b' : '#cbd5e1'
            }}
            title="Reset Microcontroller (Restart from Cycle 0)"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </TracewiseBubbleButton>
        </div>

        {/* Center: Live Timer and Target MCU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Target Microcontroller Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              color: '#94a3b8'
            }}
          >
            <Cpu size={14} color="#2dc5e9" />
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>Arduino Uno</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span>ATmega328P @ 16MHz</span>
          </div>

          {/* Live Virtual Clock Timer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isRunning ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.3)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-code)',
              border: isRunning ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <Clock size={13} color={isRunning ? '#22c55e' : '#94a3b8'} />
            <span style={{ fontWeight: 700, color: isRunning ? '#22c55e' : '#94a3b8' }}>
              {formatTime(simTime)}
            </span>
          </div>
        </div>

        {/* Right: Status Pill & Serial Monitor Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Badge */}
          {status === 'ERROR' && (
            <div
              onClick={onOpenValidation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title={compileError || 'Error in circuit or code'}
            >
              <AlertCircle size={13} />
              <span>{compileError ? 'Compile Error' : 'Circuit Error'}</span>
            </div>
          )}

          {status === 'RUNNING' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 6px #22c55e'
                }}
              />
              <span>RUNNING</span>
            </div>
          )}

          {status === 'PAUSED' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#eab308',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600
              }}
            >
              <span>PAUSED</span>
            </div>
          )}

          {/* Serial Monitor Toggle Button */}
          <TracewiseBubbleButton
            onClick={toggleSerial}
            variant={isSerialOpen ? 'primary' : 'secondary'}
            size="sm"
            style={{
              padding: '5px 12px',
              fontSize: '0.76rem',
              minHeight: '32px',
              gap: '6px',
              backgroundColor: isSerialOpen ? '#2dc5e9' : 'rgba(255, 255, 255, 0.12)',
              color: isSerialOpen ? '#071831' : '#ffffff'
            }}
            title="Toggle Microcontroller Serial Monitor (UART)"
          >
            <Terminal size={13} />
            <span>Serial Monitor</span>
          </TracewiseBubbleButton>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
