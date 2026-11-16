import React from 'react';

export function ResistorSvg({
  width = 80,
  height = 35,
  resistance = '220Ω',
  pins = [],
  activePinId = null,
  highlightedPins = [],
  onPinClick,
  onPinHover
}) {
  // Color code bands
  // 220 ohm: Red, Red, Brown, Gold
  // 1k ohm: Brown, Black, Red, Gold
  // 10k ohm: Brown, Black, Orange, Gold
  const bandMap = {
    '220Ω': ['#dc2626', '#dc2626', '#92400e', '#ca8a04'],
    '1kΩ': ['#92400e', '#0f172a', '#dc2626', '#ca8a04'],
    '10kΩ': ['#92400e', '#0f172a', '#ea580c', '#ca8a04']
  };

  const bands = bandMap[resistance] || bandMap['220Ω'];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 35"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      {/* Axial Leads */}
      <line x1="6" y1="18" x2="22" y2="18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="58" y1="18" x2="74" y2="18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Ceramic Resistor Body */}
      <rect x="22" y="10" width="36" height="16" rx="4" fill="#fed7aa" stroke="#ca8a04" strokeWidth="1" />

      {/* Color Code Bands */}
      <rect x="27" y="10" width="3" height="16" fill={bands[0]} />
      <rect x="34" y="10" width="3" height="16" fill={bands[1]} />
      <rect x="41" y="10" width="3" height="16" fill={bands[2]} />
      <rect x="49" y="10" width="3.5" height="16" fill={bands[3]} />

      {/* Resistance Label text */}
      <text x="40" y="32" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle">
        {resistance}
      </text>

      {/* Terminal Interactive Pins */}
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
          </g>
        );
      })}
    </svg>
  );
}
