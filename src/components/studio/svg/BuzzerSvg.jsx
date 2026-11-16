import React from 'react';

export function BuzzerSvg({
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
        <radialGradient id="buzzerBodyGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>

      {/* 2 Leads down */}
      <line x1="20" y1="36" x2="20" y2="56" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="45" y1="36" x2="45" y2="56" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Main Round Black Cylindrical Can Body */}
      <circle cx="32.5" cy="24" r="21" fill="url(#buzzerBodyGrad)" stroke="#475569" strokeWidth="1.2" />

      {/* Inner Recessed Sound Aperture Hole */}
      <circle cx="32.5" cy="24" r="6.5" fill="#020617" stroke="#0f172a" strokeWidth="1" />

      {/* Polarity Markings */}
      <text x="20" y="16" fontSize="10" fill="#ef4444" textAnchor="middle" fontWeight="bold">+</text>
      <text x="45" y="16" fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="bold">-</text>

      {/* Pin Labels near bottom */}
      <text x="20" y="50" fontSize="6.5" fill="#ef4444" textAnchor="middle" fontWeight="bold">+</text>
      <text x="45" y="50" fontSize="6.5" fill="#64748b" textAnchor="middle" fontWeight="bold">-</text>

      {/* Interactive Pin Nodes */}
      {pins.map((pin) => {
        const isSelected = activePinId === pin.id;
        const isHighlighted = highlightedPins.includes(pin.id);

        return (
          <g
            key={pin.id}
            onClick={(e) => {
              e.stopPropagation();
              onPinClick && onPinClick(pin);
            }}
            onMouseEnter={() => onPinHover && onPinHover(pin)}
            onMouseLeave={() => onPinHover && onPinHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isSelected ? 6 : 4}
              fill={isSelected ? '#2dc5e9' : isHighlighted ? '#eab308' : '#334155'}
              stroke="#ffffff"
              strokeWidth={isSelected ? 2 : 1.5}
            />
            {isSelected && (
              <circle cx={pin.x} cy={pin.y} r={9} fill="none" stroke="#2dc5e9" strokeWidth="1" strokeDasharray="2,2" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
