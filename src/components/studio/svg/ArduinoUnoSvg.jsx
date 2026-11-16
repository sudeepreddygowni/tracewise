import React from 'react';

/**
 * Highly detailed, authentic 2D vector representation of the Arduino Uno R3
 */
export function ArduinoUnoSvg({
  width = 300,
  height = 220,
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
      viewBox="0 0 380 280"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        {/* PCB Board Gradient */}
        <linearGradient id="unoPcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#144d75" />
          <stop offset="60%" stopColor="#0d3f66" />
          <stop offset="100%" stopColor="#082946" />
        </linearGradient>

        {/* Silver Jack Metal */}
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d5dbe1" />
          <stop offset="50%" stopColor="#8d99ae" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* ATmega IC Chip Body */}
        <linearGradient id="icChipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Gold Pin Terminal */}
        <radialGradient id="pinGoldGrad">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </radialGradient>

        <filter id="unoShadow" x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#071831" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* PCB Base Outline with Uno Contour */}
      <path
        d="M 20 20
           L 360 20
           A 6 6 0 0 1 366 26
           L 366 254
           A 6 6 0 0 1 360 260
           L 40 260
           L 40 240
           L 20 240
           Z"
        fill="url(#unoPcbGrad)"
        stroke="#1e3fd8"
        strokeWidth="1.5"
        filter="url(#unoShadow)"
      />

      {/* PCB Mounting Holes */}
      <circle cx="36" cy="48" r="7" fill="#071831" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="350" cy="38" r="7" fill="#071831" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="350" cy="242" r="7" fill="#071831" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="140" cy="242" r="7" fill="#071831" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* USB Type-B Port */}
      <rect x="6" y="32" width="56" height="48" rx="3" fill="url(#metalGrad)" stroke="#64748b" strokeWidth="1" />
      <rect x="2" y="38" width="8" height="36" rx="2" fill="#475569" />
      <rect x="20" y="44" width="28" height="24" fill="#0f172a" rx="2" />

      {/* DC Barrel Jack */}
      <rect x="6" y="180" width="54" height="44" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <rect x="2" y="188" width="6" height="28" fill="#1e293b" />
      <circle cx="34" cy="202" r="6" fill="#cbd5e1" />
      <circle cx="34" cy="202" r="2.5" fill="#475569" />

      {/* Reset Button */}
      <rect x="74" y="28" width="22" height="22" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
      <circle cx="85" cy="39" r="6" fill="#dc2626" />
      <text x="85" y="58" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">RESET</text>

      {/* 16MHz Crystal Oscillator */}
      <rect x="110" y="74" width="22" height="10" rx="3" fill="url(#metalGrad)" stroke="#64748b" />
      <text x="121" y="82" fill="#1e293b" fontSize="6" fontWeight="bold" textAnchor="middle">16.000</text>

      {/* ATmega328P DIP-28 Microcontroller Chip */}
      <g transform="translate(180, 110)">
        <rect x="0" y="0" width="135" height="36" rx="2" fill="url(#icChipGrad)" stroke="#334155" strokeWidth="1" />
        {/* Notch on left */}
        <circle cx="0" cy="18" r="4" fill="#071831" />
        {/* Chip Pins */}
        {[...Array(14)].map((_, i) => (
          <React.Fragment key={i}>
            <rect x={10 + i * 8.6} y="-5" width="4" height="6" fill="#cbd5e1" />
            <rect x={10 + i * 8.6} y="35" width="4" height="6" fill="#cbd5e1" />
          </React.Fragment>
        ))}
        <text x="68" y="22" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle" letterSpacing="0.08em">
          ATMEGA328P-PU
        </text>
      </g>

      {/* Onboard Status LEDs: ON, L, TX, RX */}
      <circle cx="95" cy="115" r="3.5" fill="#22c55e" stroke="#15803d" />
      <text x="88" y="117" fill="#cbd5e1" fontSize="7" fontWeight="bold">ON</text>

      <circle cx="120" cy="115" r="3.5" fill="#eab308" stroke="#a16207" />
      <text x="128" y="117" fill="#cbd5e1" fontSize="7" fontWeight="bold">L</text>

      <circle cx="120" cy="132" r="3" fill="#eab308" />
      <text x="128" y="134" fill="#94a3b8" fontSize="6.5">TX</text>
      <circle cx="120" cy="144" r="3" fill="#eab308" />
      <text x="128" y="146" fill="#94a3b8" fontSize="6.5">RX</text>

      {/* Official Branding Silkscreen on Board */}
      <text x="210" y="85" fill="#f8fafc" fontSize="18" fontWeight="800" letterSpacing="-0.03em">
        ARDUINO
      </text>
      <text x="302" y="85" fill="#2dc5e9" fontSize="13" fontWeight="800">
        UNO
      </text>
      <text x="235" y="98" fill="#94a3b8" fontSize="8" fontWeight="bold" letterSpacing="0.08em">
        ITALY DESIGN • R3
      </text>

      {/* TOP HEADER PIN BAR (Digital Pins 0-13, GND, AREF) */}
      <rect x="110" y="8" width="250" height="20" rx="2" fill="#0f172a" stroke="#1e293b" />

      {/* BOTTOM HEADER PIN BAR (Power & Analog) */}
      <rect x="140" y="242" width="220" height="20" rx="2" fill="#0f172a" stroke="#1e293b" />

      {/* Render All Labeled Pins with Interactive Click/Hover */}
      {pins.map((pin) => {
        const isSelected = activePinId === pin.id;
        const isHighlighted = highlightedPins.includes(pin.id);

        return (
          <g
            key={pin.id}
            data-pin="true"
            data-pin-id={pin.id}
            onClick={(e) => {
              e.stopPropagation();
              onPinClick && onPinClick(pin);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onMouseEnter={() => onPinHover && onPinHover(pin)}
            onMouseLeave={() => onPinHover && onPinHover(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Enlarged invisible touch hit area (minimum 30px target) */}
            <rect
              x={pin.x - 15}
              y={pin.y - 15}
              width="30"
              height="30"
              fill="transparent"
              style={{ pointerEvents: 'all' }}
            />

            {/* Header Socket Hole */}
            <rect
              x={pin.x - 5}
              y={pin.y - 5}
              width="10"
              height="10"
              rx="1.5"
              fill="#071831"
              stroke={isSelected ? '#2dc5e9' : isHighlighted ? '#eab308' : '#334155'}
              strokeWidth={isSelected || isHighlighted ? 2 : 1}
            />

            {/* Inner Gold Contact */}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isSelected ? 4 : 2.5}
              fill={isSelected ? '#2dc5e9' : isHighlighted ? '#eab308' : 'url(#pinGoldGrad)'}
            />

            {/* Pin Text Label */}
            <text
              x={pin.x}
              y={pin.y > 100 ? pin.y - 8 : pin.y + 16}
              fill={isSelected ? '#2dc5e9' : isHighlighted ? '#fef08a' : '#cbd5e1'}
              fontSize="7"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {pin.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
