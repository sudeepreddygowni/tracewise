import React from 'react';

export function PotentiometerSvg({
  width = 70,
  height = 70,
  value = 512, // 0 - 1023
  pins = [],
  activePinId = null,
  highlightedPins = [],
  onPinClick,
  onPinHover
}) {
  // Compute rotary dial angle from 0-1023 (approx -135 to +135 degrees)
  const angle = ((value / 1023) * 270) - 135;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 70"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        <radialGradient id="potKnobGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
      </defs>

      {/* 3 Leads down */}
      <line x1="14" y1="42" x2="14" y2="62" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="35" y1="42" x2="35" y2="62" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="56" y1="42" x2="56" y2="62" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Blue Potentiometer Housing */}
      <rect x="8" y="10" width="54" height="36" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />

      {/* Mounting Collar / Metal Bushing */}
      <circle cx="35" cy="28" r="16" fill="#94a3b8" stroke="#475569" strokeWidth="1" />

      {/* Central Rotary White Knob */}
      <g transform={`rotate(${angle}, 35, 28)`}>
        <circle cx="35" cy="28" r="13" fill="url(#potKnobGrad)" stroke="#475569" strokeWidth="1" />
        {/* Pointer Notch */}
        <line x1="35" y1="16" x2="35" y2="24" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Pin Labels (1, W, 2) */}
      <text x="14" y="56" fontSize="6.5" fill="#64748b" textAnchor="middle" fontWeight="bold">1</text>
      <text x="35" y="56" fontSize="6.5" fill="#64748b" textAnchor="middle" fontWeight="bold">W</text>
      <text x="56" y="56" fontSize="6.5" fill="#64748b" textAnchor="middle" fontWeight="bold">2</text>

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
