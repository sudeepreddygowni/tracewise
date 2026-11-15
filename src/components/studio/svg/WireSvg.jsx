import React from 'react';

/**
 * Flexible Bezier jumper wire with realistic routing curve
 */
export function WireSvg({
  id,
  x1,
  y1,
  x2,
  y2,
  color = '#2DC5E9',
  label = '',
  isSelected = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave
}) {
  // Compute Bezier control points for realistic flexible jumper wire curve
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Wire curve deflection based on distance
  const sag = Math.min(Math.max(dist * 0.22, 25), 80);

  // Normal vector for curvature
  let nx = -dy / (dist || 1);
  let ny = dx / (dist || 1);

  // Ensure curve generally bows downward/natural gravity
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }

  const cx1 = x1 + dx * 0.28 + nx * sag;
  const cy1 = y1 + dy * 0.28 + ny * sag;
  const cx2 = x1 + dx * 0.72 + nx * sag;
  const cy2 = y1 + dy * 0.72 + ny * sag;

  const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

  // Midpoint for badge / label
  const midX = (x1 + x2) / 2 + nx * (sag * 0.55);
  const midY = (y1 + y2) / 2 + ny * (sag * 0.55);

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(id);
      }}
      onMouseEnter={() => onMouseEnter && onMouseEnter(id)}
      onMouseLeave={() => onMouseLeave && onMouseLeave(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Invisible thicker stroke for easy mouse hovering / clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth="18"
      />

      {/* Selected / Hovered Glow halo */}
      {(isSelected || isHovered) && (
        <path
          d={pathData}
          fill="none"
          stroke={isSelected ? '#2dc5e9' : '#ffffff'}
          strokeWidth="7"
          strokeOpacity="0.6"
          strokeLinecap="round"
        />
      )}

      {/* Main Jumper Wire Path */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={isSelected ? 3.5 : 2.5}
        strokeLinecap="round"
      />

      {/* End Terminal Sleeves (Heat shrink tubing) */}
      <circle cx={x1} cy={y1} r="4" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <circle cx={x2} cy={y2} r="4" fill="#1e293b" stroke={color} strokeWidth="1.5" />

      {/* Wire Label pill if selected or hovered */}
      {(isSelected || isHovered) && label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-40"
            y="-10"
            width="80"
            height="20"
            rx="10"
            fill="rgba(11, 35, 72, 0.9)"
            stroke={color}
            strokeWidth="1"
          />
          <text
            x="0"
            y="4"
            fill="#ffffff"
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
