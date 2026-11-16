import React, { forwardRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SoapBubbleButton,
  SoapBubbleIconButton,
  SoapBubbleMaterial,
  SoapBubbleMenu,
  SoapBubbleSearch,
  SoapBubbleSlider,
  SoapBubbleToggle
} from '../soap-bubble';

// Approved Light Material Preset
export const LIGHT_BUBBLE_PRESET = {
  glass: 0.95,
  iridescence: 0.5,
  filmScale: 4.85,
  oilOpacity: 1,
  oilCoverage: 0.73,
  oilEdge: 18,
  oilEdgeFade: 2.33,
  clearCenter: 0.57,
  thickness: 480,
  drainage: 0.35,
  swirl: 0.5,
  reflectivity: 1.3,
  refraction: 0.15,
  dispersion: 1,
  bevel: 14,
  windowLength: 1.3,
  windowMargin: 0.85,
  windowBend: 0.75,
  windowSize: 0.75,
  windowWidth: 0.8,
  windowGradient: 0.96,
  windowHead: 0.7,
  windowTail: 0.6,
  glintSize: 1.65,
  glintIntensity: 0,
  glintDistance: -0.45,
  glintHeight: 0.65,
  windowIntensity: 0.85,
  windowTwin: false,
  bottomShadeColor: '#ffffff'
};

// Approved Rainbow Material Preset (Dark pages)
export const RAINBOW_BUBBLE_PRESET = {
  glass: 0.95,
  iridescence: 2,
  filmScale: 4.85,
  oilOpacity: 1,
  oilCoverage: 1,
  oilEdge: 18,
  oilEdgeFade: 1,
  clearCenter: 0.73,
  thickness: 480,
  drainage: 0.35,
  swirl: 0.5,
  reflectivity: 1.3,
  refraction: 0.15,
  dispersion: 1,
  bevel: 14,
  windowLength: 1.3,
  windowMargin: 0.85,
  windowBend: 0.75,
  windowSize: 0.75,
  windowWidth: 0.8,
  windowGradient: 0.96,
  windowHead: 0.7,
  windowTail: 0.6,
  glintSize: 1.65,
  glintIntensity: 0,
  glintDistance: -0.45,
  glintHeight: 0.65,
  windowIntensity: 0.85,
  windowTwin: false,
  bottomShadeColor: '#071831'
};

class BubbleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('SoapBubble WebGL fallback triggered:', err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

/**
 * Material container wrapping controls with the approved light/rainbow preset
 */
export function TracewiseBubbleArea({ children, theme = 'light', backdropRef, style = {}, className = '' }) {
  const preset = theme === 'dark' ? RAINBOW_BUBBLE_PRESET : LIGHT_BUBBLE_PRESET;

  return (
    <BubbleErrorBoundary fallback={<div style={style} className={className}>{children}</div>}>
      <SoapBubbleMaterial
        backdrop={backdropRef}
        {...preset}
      >
        <div style={style} className={className}>
          {children}
        </div>
      </SoapBubbleMaterial>
    </BubbleErrorBoundary>
  );
}

/**
 * Universal Tracewise Bubble Button
 * Wraps the ReactDrops SoapBubbleButton with variant styles, sizes, and navigation support.
 */
export const TracewiseBubbleButton = forwardRef(function TracewiseBubbleButton(
  {
    children,
    to,
    onClick,
    variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    className = '',
    style = {},
    radius = 9999,
    disabled = false,
    type = 'button',
    active = false,
    ...props
  },
  ref
) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
    if (to && !e.defaultPrevented) {
      navigate(to);
    }
  };

  // Size styling
  const sizeStyles = {
    sm: {
      padding: '5px 12px',
      fontSize: '0.8rem',
      minHeight: '2rem',
      fontWeight: 600,
      gap: '6px'
    },
    md: {
      padding: '8px 18px',
      fontSize: '0.88rem',
      minHeight: '2.5rem',
      fontWeight: 600,
      gap: '8px'
    },
    lg: {
      padding: '12px 26px',
      fontSize: '0.98rem',
      minHeight: '3rem',
      fontWeight: 700,
      gap: '10px'
    }
  };

  // Variant styling
  const variantStyles = {
    primary: {
      color: '#ffffff',
      background: 'rgba(30, 63, 216, 0.92)',
      boxShadow: '0 8px 24px rgba(30, 63, 216, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.35)'
    },
    secondary: {
      color: 'var(--tw-text)',
      background: 'rgba(255, 255, 255, 0.75)',
      border: '1px solid rgba(213, 228, 240, 0.85)',
      boxShadow: '0 4px 16px rgba(15, 54, 99, 0.08)'
    },
    accent: {
      color: '#071831',
      background: 'rgba(45, 197, 233, 0.92)',
      boxShadow: '0 8px 22px rgba(45, 197, 233, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.5)'
    },
    danger: {
      color: '#dc2626',
      background: 'rgba(254, 226, 226, 0.85)',
      border: '1px solid rgba(248, 113, 113, 0.4)'
    },
    success: {
      color: '#166534',
      background: 'rgba(220, 252, 231, 0.85)',
      border: '1px solid rgba(134, 239, 172, 0.5)'
    },
    ghost: {
      color: 'var(--tw-text-secondary)',
      background: 'rgba(255, 255, 255, 0.35)',
      border: '1px solid transparent'
    }
  };

  const selectedSize = sizeStyles[size] || sizeStyles.md;
  const selectedVariant = variantStyles[variant] || variantStyles.secondary;

  const combinedStyle = {
    fontFamily: 'var(--font-ui)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    textDecoration: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transition: 'transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
    ...selectedSize,
    ...selectedVariant,
    ...(active ? { border: '2px solid var(--tw-brand)', background: 'var(--tw-brand-soft)', color: 'var(--tw-brand)' } : {}),
    ...style
  };

  return (
    <SoapBubbleButton
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      radius={radius}
      className={`tw-bubble-btn ${className}`}
      style={combinedStyle}
      {...props}
    >
      {children}
    </SoapBubbleButton>
  );
});

/**
 * Circular/Pill Icon Button for toolbars, actions, and controls
 */
export const TracewiseBubbleIconButton = forwardRef(function TracewiseBubbleIconButton(
  {
    children,
    onClick,
    to,
    title,
    variant = 'secondary',
    size = 'md', // 'sm' (28px), 'md' (36px), 'lg' (44px)
    className = '',
    style = {},
    disabled = false,
    active = false,
    ...props
  },
  ref
) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
    if (to) navigate(to);
  };

  const iconSizes = {
    sm: { width: 34, height: 34, minWidth: 34, minHeight: 34, maxWidth: 34, maxHeight: 34 },
    md: { width: 40, height: 40, minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40 },
    lg: { width: 48, height: 48, minWidth: 48, minHeight: 48, maxWidth: 48, maxHeight: 48 }
  };

  const currentSize = iconSizes[size] || iconSizes.md;

  return (
    <TracewiseBubbleButton
      ref={ref}
      onClick={handleClick}
      title={title}
      aria-label={title || props['aria-label'] || 'Button'}
      variant={variant}
      disabled={disabled}
      active={active}
      style={{
        ...currentSize,
        padding: 0,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        aspectRatio: '1 / 1',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style
      }}
      className={`tw-bubble-icon-btn ${className}`}
      {...props}
    >
      {children}
    </TracewiseBubbleButton>
  );
});

export {
  SoapBubbleButton,
  SoapBubbleIconButton,
  SoapBubbleMenu,
  SoapBubbleSearch,
  SoapBubbleSlider,
  SoapBubbleToggle,
  SoapBubbleMaterial
};
