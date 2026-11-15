import React from 'react';

/**
 * 400 Tie-Point Half Breadboard SVG
 */
export function BreadboardSvg({
  width = 320,
  height = 180,
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
      viewBox="0 0 320 180"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        <filter id="bbShadow" x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#071831" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Main White Plastic Body */}
      <rect
        x="0"
        y="0"
        width="320"
        height="180"
        rx="8"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        filter="url(#bbShadow)"
      />

      {/* Center Trough Separator */}
      <rect x="0" y="85" width="320" height="10" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />

      {/* Power Rails Stripes */}
      {/* Top + Red Line */}
      <line x1="20" y1="12" x2="300" y2="12" stroke="#ef4444" strokeWidth="1.5" />
      <text x="10" y="15" fill="#ef4444" fontSize="9" fontWeight="bold">+</text>
      {/* Top - Blue Line */}
      <line x1="20" y1="36" x2="300" y2="36" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="10" y="39" fill="#3b82f6" fontSize="10" fontWeight="bold">-</text>

      {/* Bottom + Red Line */}
      <line x1="20" y1="145" x2="300" y2="145" stroke="#ef4444" strokeWidth="1.5" />
      <text x="10" y="148" fill="#ef4444" fontSize="9" fontWeight="bold">+</text>
      {/* Bottom - Blue Line */}
      <line x1="20" y1="168" x2="300" y2="168" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="10" y="171" fill="#3b82f6" fontSize="10" fontWeight="bold">-</text>

      {/* Terminal row grid holes background */}
      {[...Array(25)].map((_, col) => {
        const x = 35 + col * 10.5;
        return (
          <React.Fragment key={col}>
            {/* Top terminal points */}
            <circle cx={x} cy="55" r="1.8" fill="#94a3b8" />
            <circle cx={x} cy="65" r="1.8" fill="#94a3b8" />
            <circle cx={x} cy="75" r="1.8" fill="#94a3b8" />
            {/* Bottom terminal points */}
            <circle cx={x} cy="105" r="1.8" fill="#94a3b8" />
            <circle cx={x} cy="115" r="1.8" fill="#94a3b8" />
            <circle cx={x} cy="125" r="1.8" fill="#94a3b8" />
          </React.Fragment>
        );
      })}

      {/* Render Named Interactive Pins */}
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
              fill={isSelected ? '#2dc5e9' : isHighlighted ? '#eab308' : '#071831'}
              stroke={isSelected ? '#1e3fd8' : '#64748b'}
              strokeWidth={1.5}
            />
            <text
              x={pin.x + 8}
              y={pin.y + 3}
              fill="#475569"
              fontSize="6.5"
              fontFamily="monospace"
              fontWeight="600"
            >
              {pin.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
