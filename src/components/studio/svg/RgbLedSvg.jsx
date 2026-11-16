import React from 'react';

export function RgbLedSvg({
  width = 70,
  height = 80,
  red = 255,
  green = 0,
  blue = 128,
  pins = [],
  activePinId = null,
  highlightedPins = [],
  onPinClick,
  onPinHover
}) {
  const activeColor = `rgb(${red}, ${green}, ${blue})`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 80"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        <radialGradient id="rgbDomeGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="45%" stopColor={activeColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>

      {/* 4 Leads: Red (16), Cathode (28, longest), Green (42), Blue (54) */}
      <line x1="16" y1="42" x2="16" y2="70" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="28" y1="42" x2="28" y2="74" stroke="#64748b" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="42" y1="42" x2="42" y2="70" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="54" y1="42" x2="54" y2="70" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />

      {/* Epoxy Dome */}
      <path
        d="M 14 42
           L 14 24
           A 21 21 0 0 1 56 24
           L 56 42
           Z"
        fill="url(#rgbDomeGrad)"
        stroke="#475569"
        strokeWidth="1.2"
      />

      {/* Base Collar Rim with Flat side on Blue lead */}
      <rect x="12" y="40" width="46" height="5" rx="1.5" fill="#334155" stroke="#1e293b" strokeWidth="1" />

      {/* Internal RGB Dies */}
      <circle cx="25" cy="28" r="3.5" fill="#ef4444" opacity="0.8" />
      <circle cx="35" cy="22" r="3.5" fill="#22c55e" opacity="0.8" />
      <circle cx="45" cy="28" r="3.5" fill="#3b82f6" opacity="0.8" />

      {/* Glow */}
      <ellipse cx="35" cy="26" rx="18" ry="16" fill={activeColor} opacity="0.25" filter="blur(4px)" />

      {/* Pin Labels (Tiny) */}
      <text x="16" y="65" fontSize="7" fill="#64748b" textAnchor="middle" fontWeight="bold">R</text>
      <text x="28" y="67" fontSize="7" fill="#64748b" textAnchor="middle" fontWeight="bold">-</text>
      <text x="42" y="65" fontSize="7" fill="#64748b" textAnchor="middle" fontWeight="bold">G</text>
      <text x="54" y="65" fontSize="7" fill="#64748b" textAnchor="middle" fontWeight="bold">B</text>

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
              r={14}
              fill="transparent"
              style={{ pointerEvents: 'auto' }}
            />
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
