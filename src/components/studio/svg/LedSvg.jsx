import React from 'react';

export function LedSvg({
  width = 60,
  height = 70,
  color = 'red',
  isLit = false,
  isUnprotected = false,
  pins = [],
  activePinId = null,
  highlightedPins = [],
  onPinClick,
  onPinHover
}) {
  const colorMap = {
    red: {
      litFill: '#ff2222',
      unlitFill: '#7f1d1d',
      glow: 'rgba(255, 34, 34, 0.75)',
      deepGlow: 'rgba(255, 68, 68, 0.4)',
      text: 'Red LED'
    },
    yellow: {
      litFill: '#ffea00',
      unlitFill: '#713f12',
      glow: 'rgba(255, 234, 0, 0.75)',
      deepGlow: 'rgba(234, 179, 8, 0.4)',
      text: 'Yellow LED'
    },
    green: {
      litFill: '#22c55e',
      unlitFill: '#14532d',
      glow: 'rgba(34, 197, 94, 0.75)',
      deepGlow: 'rgba(34, 197, 94, 0.4)',
      text: 'Green LED'
    },
    blue: {
      litFill: '#38bdf8',
      unlitFill: '#1e3a8a',
      glow: 'rgba(56, 189, 248, 0.75)',
      deepGlow: 'rgba(59, 130, 246, 0.4)',
      text: 'Blue LED'
    }
  };

  const ledConf = colorMap[color] || colorMap.red;
  const gradId = `ledGrad-${color}-${isLit ? 'lit' : 'unlit'}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 70"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="70%">
          {isLit ? (
            <>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor={ledConf.litFill} stopOpacity="0.9" />
              <stop offset="80%" stopColor={ledConf.litFill} stopOpacity="0.75" />
              <stop offset="100%" stopColor="#991b1b" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="35%" stopColor={ledConf.unlitFill} />
              <stop offset="100%" stopColor="#0f172a" />
            </>
          )}
        </radialGradient>

        <filter id={`ledGlowFilter-${color}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur1" />
          <feGaussianBlur stdDeviation="10" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Leads (Long Anode on left, Short Cathode on right) */}
      <line x1="18" y1="36" x2="18" y2="60" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="36" x2="42" y2="60" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Active Glowing Halos when Lit */}
      {isLit && (
        <>
          {/* Broad outer diffusion */}
          <circle cx="30" cy="22" r="22" fill={ledConf.deepGlow} filter="blur(8px)" />
          {/* Concentrated brilliant core glow */}
          <circle cx="30" cy="22" r="14" fill={ledConf.glow} filter="blur(3px)" />
          <circle cx="30" cy="20" r="7" fill="#ffffff" opacity="0.8" filter="blur(2px)" />
        </>
      )}

      {/* LED Epoxy Dome */}
      <path
        d="M 14 36
           L 14 22
           A 16 16 0 0 1 46 22
           L 46 36
           Z"
        fill={`url(#${gradId})`}
        stroke={isLit ? '#ffffff' : '#64748b'}
        strokeWidth={isLit ? 1.5 : 1}
      />

      {/* LED Flat Collar Base Rim */}
      <rect
        x="12"
        y="34"
        width="36"
        height="5"
        rx="1.5"
        fill={isLit ? ledConf.litFill : ledConf.unlitFill}
        stroke={isLit ? '#ffffff' : '#475569'}
        strokeWidth={0.8}
      />

      {/* Unprotected Warning Aura if driven without resistor */}
      {isUnprotected && isLit && (
        <circle cx="30" cy="22" r="20" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
      )}

      {/* Interactive Pin Nodes */}
      {pins.map((pin) => {
        const isSelected = activePinId === pin.id;
        const isHighlighted = highlightedPins.includes(pin.id);

        return (
          <g
            key={pin.id}
            data-pin="true"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPinClick && onPinClick(pin);
            }}
            onMouseEnter={() => onPinHover && onPinHover(pin)}
            onMouseLeave={() => onPinHover && onPinHover(null)}
            style={{ cursor: 'pointer', touchAction: 'none' }}
          >
            {/* Expanded touch target */}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={16}
              fill="transparent"
              style={{ pointerEvents: 'auto' }}
            />
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isSelected ? 6 : 4}
              fill={isSelected ? '#2dc5e9' : isHighlighted ? '#eab308' : '#334155'}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <text
              x={pin.x}
              y={pin.y + 11}
              fill="#475569"
              fontSize="6"
              fontWeight="bold"
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              {pin.id === 'anode' ? 'A(+)' : 'K(-)'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
