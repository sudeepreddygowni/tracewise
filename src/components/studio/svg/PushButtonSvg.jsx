import React from 'react';

export function PushButtonSvg({
  width = 65,
  height = 65,
  pins = [],
  activePinId = null,
  highlightedPins = [],
  onPinClick,
  onPinHover
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 65 65"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        <radialGradient id="btnActuatorGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>

      {/* 4 Corner Leads */}
      <line x1="12" y1="15" x2="20" y2="20" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="50" x2="20" y2="45" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="53" y1="15" x2="45" y2="20" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="53" y1="50" x2="45" y2="45" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Silver Outer Metal Shroud */}
      <rect x="18" y="16" width="30" height="32" rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />

      {/* Central Round Black Button Plunger */}
      <circle cx="33" cy="32" r="9" fill="url(#btnActuatorGrad)" stroke="#1e293b" strokeWidth="1" />

      {/* 4 Corner Pins */}
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
              r={15}
              fill="transparent"
              style={{ pointerEvents: 'auto' }}
            />
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isSelected ? 5.5 : 3.5}
              fill={isSelected ? '#2dc5e9' : isHighlighted ? '#eab308' : '#334155'}
              stroke="#ffffff"
              strokeWidth={1.2}
            />
            <text
              x={pin.x < 30 ? pin.x - 8 : pin.x + 8}
              y={pin.y + 3}
              fill="#64748b"
              fontSize="6"
              fontWeight="bold"
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              {pin.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
