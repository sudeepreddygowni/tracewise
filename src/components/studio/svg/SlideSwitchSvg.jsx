import React from 'react';

export function SlideSwitchSvg({
  width = 65,
  height = 45,
  state = 'left', // 'left' or 'right'
  pins = [],
  activePinId = null,
  highlightedPins = [],
  onPinClick,
  onPinHover
}) {
  const isLeft = state === 'left';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 65 45"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      {/* 3 Leads down */}
      <line x1="14" y1="26" x2="14" y2="38" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="26" x2="32" y2="38" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="26" x2="50" y2="38" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Silver Metal Bracket Housing */}
      <rect x="8" y="10" width="49" height="18" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
      <circle cx="12" cy="19" r="1.5" fill="#475569" />
      <circle cx="53" cy="19" r="1.5" fill="#475569" />

      {/* Switch Slot */}
      <rect x="18" y="15" width="29" height="8" rx="1.5" fill="#1e293b" />

      {/* Slide Actuator Lever (Black) */}
      <rect
        x={isLeft ? 20 : 35}
        y="8"
        width="10"
        height="18"
        rx="2"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="1"
        style={{ transition: 'x 0.15s ease' }}
      />
      {/* Grip Ribs on Lever */}
      <line x1={isLeft ? 23 : 38} y1="11" x2={isLeft ? 27 : 42} y2="11" stroke="#64748b" strokeWidth="1" />
      <line x1={isLeft ? 23 : 38} y1="14" x2={isLeft ? 27 : 42} y2="14" stroke="#64748b" strokeWidth="1" />
      <line x1={isLeft ? 23 : 38} y1="17" x2={isLeft ? 27 : 42} y2="17" stroke="#64748b" strokeWidth="1" />

      {/* Pin Labels (1, C, 2) */}
      <text x="14" y="34" fontSize="6" fill="#64748b" textAnchor="middle" fontWeight="bold">1</text>
      <text x="32" y="34" fontSize="6" fill="#64748b" textAnchor="middle" fontWeight="bold">C</text>
      <text x="50" y="34" fontSize="6" fill="#64748b" textAnchor="middle" fontWeight="bold">2</text>

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
              r={isSelected ? 5.5 : 3.5}
              fill={isSelected ? '#2dc5e9' : isHighlighted ? '#eab308' : '#334155'}
              stroke="#ffffff"
              strokeWidth={isSelected ? 2 : 1.5}
            />
            {isSelected && (
              <circle cx={pin.x} cy={pin.y} r={8} fill="none" stroke="#2dc5e9" strokeWidth="1" strokeDasharray="2,2" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
