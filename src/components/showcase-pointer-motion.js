/** Minimum-jerk position profile, the velocity curve of an unhurried human reach. */
export function minimumJerk(t) {
  const p = Math.min(1, Math.max(0, t));
  return p * p * p * (10 + p * (6 * p - 15));
}

/** Deterministic pseudo-random sequence so a script replays the same arcs every loop. */
export function createRandom(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const defaultCursorMotion = {
  reachTime: 240,
  reachScale: 150,
  maxReach: 1500,
  curvature: 1,
  overshoot: 1,
  easing: 'human',
  landingSpread: 1,
  dragPace: 1.45,
};

const easings = {
  human: minimumJerk,
  'ease-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  'ease-out': (t) => 1 - (1 - t) ** 3,
  linear: (t) => t,
};

/**
 * A curved reach in two sub-movements: a fast primary arc that slightly
 * overshoots long moves, then a short correction onto the target. Duration
 * follows Fitts's law, so far or small targets take longer than near, large ones.
 */
export function planReach(from, to, targetSize, random, pace = 1, motion = defaultCursorMotion) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.5) return { duration: 0, at: () => to };
  const width = Math.max(18, targetSize);
  const duration = Math.min(
    motion.maxReach,
    (motion.reachTime + motion.reachScale * Math.log2(1 + distance / width)) * pace,
  );
  const ux = dx / distance;
  const uy = dy / distance;
  const ease = easings[motion.easing] ?? minimumJerk;
  // Wrist rotation bends real reaches; alternate sides with a random magnitude.
  // Draw every random number even when a rule is off, so paths stay reproducible.
  const side = random() < 0.5 ? -1 : 1;
  const bend = side * (0.06 + random() * 0.12) * distance * motion.curvature;
  const overshootJitter = 0.6 + random() * 0.4;
  const overshoot =
    distance > 160 ? Math.min(12, distance * 0.035) * overshootJitter * motion.overshoot : 0;
  const aim = { x: to.x + ux * overshoot, y: to.y + uy * overshoot };
  const control = {
    x: (from.x + aim.x) / 2 - uy * bend,
    y: (from.y + aim.y) / 2 + ux * bend,
  };
  const split = overshoot > 0.01 ? 0.84 : 1;
  return {
    duration,
    at(progress) {
      if (progress < split) {
        const t = ease(progress / split);
        const a = 1 - t;
        return {
          x: a * a * from.x + 2 * a * t * control.x + t * t * aim.x,
          y: a * a * from.y + 2 * a * t * control.y + t * t * aim.y,
        };
      }
      if (split === 1) return { ...to };
      const t = ease((progress - split) / (1 - split));
      return { x: aim.x + (to.x - aim.x) * t, y: aim.y + (to.y - aim.y) * t };
    },
  };
}

/** Smooth, bounded idle sway built from incommensurate sines. */
export function idleSway(time, phase) {
  const t = time / 1000 + phase;
  return {
    x: Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.9 + 1.7) * 0.3 + Math.sin(t * 0.7 + 4.1) * 0.4,
    y: Math.sin(t * 1.1 + 2.3) * 0.55 + Math.sin(t * 2.3 + 0.4) * 0.3 + Math.sin(t * 0.5) * 0.35,
  };
}

/** Critically damped spring step toward a target (exact for a constant target). */
export function springStep(
  value,
  velocity,
  target,
  omega,
  dt,
) {
  const x = value - target;
  const exp = Math.exp(-omega * dt);
  const nextX = (x + (velocity + omega * x) * dt) * exp;
  const nextV = (velocity - omega * (velocity + omega * x) * dt) * exp;
  return [target + nextX, nextV];
}

/** White or near-black text for a cursor color, by WCAG relative luminance. */
export function readableTextColor(color) {
  const hex = color.trim().replace(/^#/, '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(hex)) return '#ffffff';
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const channel = (offset) => {
    const value = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  // Like collaboration tools, keep white text on saturated colors and switch to dark
  // only where white falls below 2.2:1 (yellows, limes, pale tints).
  return 1.05 / (luminance + 0.05) >= 2.2 ? '#ffffff' : '#141414';
}
