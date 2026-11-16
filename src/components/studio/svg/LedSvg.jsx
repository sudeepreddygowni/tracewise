import React from 'react';

export function LedSvg({
  width = 60,
  height = 70,
  color = 'red',
  pins = [],
  activePinId = null,
  highlightedPins = [],
  onPinClick,
  onPinHover
}) {
  const colorMap = {
    red: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'Red LED' },
    yellow: { fill: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', text: 'Yellow LED' },
    green: { fill: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', text: 'Green LED' },
    blue: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', text: 'Blue LED' }
  };

  const ledConf = colorMap[color] || colorMap.red;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 70"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        <radialGradient id={`ledGrad-${color}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="35%" stopColor={ledConf.fill} />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
      </defs>

      {/* Leads (Long Anode on left, Short Cathode on right) */}
      <line x1="18" y1="36" x2="18" y2="60" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="36" x2="42" y2="60" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* LED Epoxy Dome */}
      <path
        d="M 14 36
           L 14 22
           A 16 16 0 0 1 46 22
           L 46 36
           Z"
        fill={`url(#ledGrad-${color})`}
        stroke="#64748b"
        strokeWidth="1"
      />

      {/* LED Flat Collar Base Rim */}
      <rect x="12" y="34" width="36" height="5" rx="1.5" fill={ledConf.fill} stroke="#475569" strokeWidth="0.8" />

      {/* Subtle Glow */}
      <ellipse cx="30" cy="22" rx="14" ry="14" fill={ledConf.glow} filter="blur(3px)" />

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
