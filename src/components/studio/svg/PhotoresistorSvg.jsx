import React from 'react';

export function PhotoresistorSvg({
  width = 60,
  height = 60,
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
      viewBox="0 0 60 60"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        <radialGradient id="ldrDiskGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
      </defs>

      {/* 2 Leads down */}
      <line x1="18" y1="28" x2="18" y2="52" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="28" x2="42" y2="52" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Ceramic Disc Sensor Head */}
      <circle cx="30" cy="22" r="16" fill="url(#ldrDiskGrad)" stroke="#7c2d12" strokeWidth="1.2" />

      {/* Serpentine Photocell Track (Cadmium Sulfide Zigzag) */}
      <path
        d="M 20 18
           C 24 16, 26 16, 30 18
           C 34 20, 36 20, 40 18
           M 20 22
           C 24 20, 26 20, 30 22
           C 34 24, 36 24, 40 22
           M 20 26
           C 24 24, 26 24, 30 26
           C 34 28, 36 28, 40 26"
        fill="none"
        stroke="#451a03"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

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
