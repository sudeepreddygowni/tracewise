import React, { useState } from 'react';
import {
  Compass,
  Layers,
  Cpu,
  Info,
  Maximize2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Move,
  RotateCw,
  Gauge,
  Zap
} from 'lucide-react';
import { TracewiseBubbleArea, TracewiseBubbleButton } from '../ui/BubbleActions';

export function PhysicalLayoutView({ project, onUpdateLayout }) {
  const [selectedPartId, setSelectedPartId] = useState('part-sonar');
  const [simulatedDistance, setSimulatedDistance] = useState(45); // in cm
  const [activeMotionMode, setActiveMotionMode] = useState('forward'); // 'forward' | 'stop' | 'pivot_right'

  const layout = project?.physicalLayout || {
    enabled: true,
    chassis: { type: '2wd_robot_car', width: 220, length: 280, shape: 'rounded-rect' },
    parts: [
      { id: 'part-chassis', type: 'chassis', name: '2WD Acrylic Robot Chassis', x: 200, y: 160 },
      { id: 'part-sonar', type: 'ultrasonic-mount', name: 'Front HC-SR04 Mount', x: 200, y: 35 },
      { id: 'part-mcu', type: 'controller-mount', name: 'ESP32 NodeMCU Controller Bay', x: 200, y: 130 },
      { id: 'part-driver', type: 'driver-mount', name: 'L298N H-Bridge Driver Bay', x: 200, y: 220 },
      { id: 'part-motor-left', type: 'dc-motor', name: 'Left TT Drive Motor & Wheel', x: 65, y: 200 },
      { id: 'part-motor-right', type: 'dc-motor', name: 'Right TT Drive Motor & Wheel', x: 335, y: 200 },
      { id: 'part-caster', type: 'caster', name: 'Rear Ball Caster Wheel', x: 200, y: 300 },
      { id: 'part-battery', type: 'battery-holder', name: '2x 18650 Battery Pack', x: 200, y: 260 }
    ]
  };

  const selectedPart = layout.parts?.find(p => p.id === selectedPartId) || layout.parts?.[0];

  // React to distance threshold
  const isObstacleClose = simulatedDistance <= 25;
  const avoidanceState = isObstacleClose ? 'OBSTACLE_AVOIDANCE (Brake & Pivot)' : 'FORWARD_CRUISE (Clear Path)';

  return (
    <TracewiseBubbleArea theme="dark">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#071831',
          color: '#f8fafc',
          overflow: 'hidden'
        }}
      >
        {/* Top Control Bar */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#0a1f40',
            borderBottom: '1px solid rgba(74, 167, 242, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={18} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Physical Assembly & Chassis Layout (2D Top-Down)
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>
                Structural component placement independent of electrical schematic diagram.
              </p>
            </div>
          </div>

          {/* Interactive Distance Tester Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8' }}>Virtual Distance:</span>
              <input
                type="range"
                min="5"
                max="100"
                value={simulatedDistance}
                onChange={(e) => setSimulatedDistance(Number(e.target.value))}
                style={{ width: '120px', accentColor: isObstacleClose ? '#ef4444' : '#10b981' }}
              />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: isObstacleClose ? '#ef4444' : '#10b981',
                  minWidth: '45px'
                }}
              >
                {simulatedDistance} cm
              </span>
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: isObstacleClose ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: `1px solid ${isObstacleClose ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                color: isObstacleClose ? '#fca5a5' : '#6ee7b7',
                fontWeight: 700
              }}
            >
              {avoidanceState}
            </div>
          </div>
        </div>

        {/* Assembly Layout Canvas & Inspector Grid */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* 2D Canvas Area */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#051226',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Visual Grid Lines */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(74, 167, 242, 0.12) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                pointerEvents: 'none'
              }}
            />

            {/* 2D SVG Robot Layout */}
            <svg
              width="440"
              height="380"
              viewBox="0 0 440 380"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a254d" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#05152d" stopOpacity="0.9" />
                </linearGradient>
                <radialGradient id="sonarCone" cx="0.5" cy="1" r="0.8">
                  <stop offset="0%" stopColor={isObstacleClose ? '#ef4444' : '#10b981'} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={isObstacleClose ? '#ef4444' : '#10b981'} stopOpacity="0.02" />
                </radialGradient>
              </defs>

              {/* Acoustic Ultrasonic Beam Cone */}
              <polygon
                points={`200,35 ${200 - simulatedDistance * 2.5},-30 ${200 + simulatedDistance * 2.5},-30`}
                fill="url(#sonarCone)"
                stroke={isObstacleClose ? '#ef4444' : '#10b981'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Obstacle Representation */}
              {isObstacleClose && (
                <g>
                  <rect x="150" y="-15" width="100" height="14" rx="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                  <text x="200" y="-4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">OBSTACLE DETECTED</text>
                </g>
              )}

              {/* Main Robot Chassis (Clear Acrylic Outline) */}
              <rect
                x="90"
                y="50"
                width="220"
                height="270"
                rx="28"
                fill="url(#chassisGrad)"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />

              {/* Left TT DC Gear Motor & Wheel */}
              <g
                onClick={() => setSelectedPartId('part-motor-left')}
                style={{ cursor: 'pointer' }}
              >
                {/* Wheel Tyre */}
                <rect x="42" y="150" width="36" height="96" rx="8" fill="#0f172a" stroke={selectedPartId === 'part-motor-left' ? '#38bdf8' : '#334155'} strokeWidth="2" />
                {/* Yellow TT Motor Box */}
                <rect x="78" y="165" width="28" height="66" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                <text x="60" y="202" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" transform="rotate(-90 60 202)">LEFT DRIVE</text>
              </g>

              {/* Right TT DC Gear Motor & Wheel */}
              <g
                onClick={() => setSelectedPartId('part-motor-right')}
                style={{ cursor: 'pointer' }}
              >
                {/* Wheel Tyre */}
                <rect x="322" y="150" width="36" height="96" rx="8" fill="#0f172a" stroke={selectedPartId === 'part-motor-right' ? '#38bdf8' : '#334155'} strokeWidth="2" />
                {/* Yellow TT Motor Box */}
                <rect x="294" y="165" width="28" height="66" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                <text x="340" y="202" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" transform="rotate(90 340 202)">RIGHT DRIVE</text>
              </g>

              {/* Rear Ball Caster */}
              <circle
                cx="200"
                cy="295"
                r="16"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="2"
                onClick={() => setSelectedPartId('part-caster')}
                style={{ cursor: 'pointer' }}
              />
              <circle cx="200" cy="295" r="8" fill="#e2e8f0" />

              {/* Ultrasonic Sensor Mount (Front Bumper) */}
              <g
                onClick={() => setSelectedPartId('part-sonar')}
                style={{ cursor: 'pointer' }}
              >
                <rect x="150" y="25" width="100" height="32" rx="6" fill="#0284c7" stroke={selectedPartId === 'part-sonar' ? '#38bdf8' : '#0369a1'} strokeWidth="2" />
                <circle cx="172" cy="41" r="11" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                <circle cx="228" cy="41" r="11" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                <text x="172" y="44" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">T</text>
                <text x="228" y="44" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">R</text>
              </g>

              {/* Microcontroller Bay (ESP32) */}
              <g
                onClick={() => setSelectedPartId('part-mcu')}
                style={{ cursor: 'pointer' }}
              >
                <rect x="135" y="85" width="130" height="75" rx="6" fill="#0f172a" stroke={selectedPartId === 'part-mcu' ? '#38bdf8' : '#334155'} strokeWidth="2" />
                <rect x="155" y="95" width="45" height="40" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <text x="177" y="118" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">ESP32</text>
                <text x="200" y="148" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">NodeMCU Bay</text>
              </g>

              {/* L298N Motor Driver Bay */}
              <g
                onClick={() => setSelectedPartId('part-driver')}
                style={{ cursor: 'pointer' }}
              >
                <rect x="140" y="180" width="120" height="65" rx="6" fill="#1e293b" stroke={selectedPartId === 'part-driver' ? '#38bdf8' : '#334155'} strokeWidth="2" />
                {/* Heat Sink Fins */}
                <rect x="175" y="186" width="50" height="20" rx="2" fill="#020617" stroke="#475569" strokeWidth="1" />
                <text x="200" y="230" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">L298N H-Bridge</text>
              </g>

              {/* Battery Bay */}
              <g
                onClick={() => setSelectedPartId('part-battery')}
                style={{ cursor: 'pointer' }}
              >
                <rect x="130" y="255" width="140" height="28" rx="4" fill="#030712" stroke={selectedPartId === 'part-battery' ? '#38bdf8' : '#1f2937'} strokeWidth="1.5" />
                <rect x="135" y="260" width="60" height="18" rx="2" fill="#1e3a8a" />
                <rect x="205" y="260" width="60" height="18" rx="2" fill="#1e3a8a" />
                <text x="200" y="273" textAnchor="middle" fill="#93c5fd" fontSize="7" fontWeight="bold">2x 18650 (7.4V)</text>
              </g>
            </svg>
          </div>

          {/* Right Inspector Panel */}
          <div
            style={{
              width: '320px',
              backgroundColor: '#0a1f40',
              borderLeft: '1px solid rgba(74, 167, 242, 0.2)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                Mechanical Part Inspector
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '4px 0 0' }}>
                {selectedPart.name}
              </h4>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#071831', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              • <strong>Identifier:</strong> <code>{selectedPart.id}</code><br />
              • <strong>Mount Slot:</strong> {selectedPart.type}<br />
              • <strong>Position:</strong> ({selectedPart.x}, {selectedPart.y}) mm<br />
              • <strong>Electrical Link:</strong> Connected to Controller via Schematic Net
            </div>

            {/* Educational Context */}
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.78rem', color: '#e0f2fe', lineHeight: 1.45 }}>
              <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
              <strong>Chassis Engineering Principle:</strong> Keeping high-current battery and motor wiring low and centered prevents noise coupling into sensitive microcontroller logic lines.
            </div>

            {/* Quick Part Switcher */}
            <div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                All Chassis Elements
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {layout.parts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPartId(p.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: selectedPartId === p.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: selectedPartId === p.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: selectedPartId === p.id ? '#ffffff' : '#94a3b8',
                      fontSize: '0.78rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: selectedPartId === p.id ? 700 : 500
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
