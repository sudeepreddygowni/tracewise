import React from 'react';

export function PushButtonSvg({
  width = 65,
  height = 65,
  isPressed = false,
  onButtonDown,
  onButtonUp,
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
      preserveAspectRatio="xMidYMid meet"
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

      {/* Central Round Black Button Plunger with Interactive Press */}
      <g
        onPointerDown={(e) => {
          e.stopPropagation();
          onButtonDown && onButtonDown();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onButtonUp && onButtonUp();
        }}
        onPointerLeave={() => {
          if (isPressed && onButtonUp) onButtonUp();
        }}
        style={{ cursor: 'pointer' }}
        title="Click or press and hold to actuate button"
      >
        <circle
          cx="33"
          cy={isPressed ? 33.5 : 32}
          r={isPressed ? 8 : 9}
          fill="url(#btnActuatorGrad)"
          stroke={isPressed ? '#2dc5e9' : '#1e293b'}
          strokeWidth={isPressed ? 1.5 : 1}
        />
        {isPressed && (
          <circle cx="33" cy="33.5" r="12" fill="none" stroke="rgba(45, 197, 233, 0.4)" strokeWidth="1" />
        )}
      </g>

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
