import React, { Component, useRef } from 'react';
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

// Approved Rainbow Material Preset
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
export function TracewiseBubbleArea({ children, theme = 'light', backdropRef, style = {} }) {
  const preset = theme === 'dark' ? RAINBOW_BUBBLE_PRESET : LIGHT_BUBBLE_PRESET;

  return (
    <BubbleErrorBoundary fallback={<div style={style}>{children}</div>}>
      <SoapBubbleMaterial
        backdrop={backdropRef}
        {...preset}
      >
        <div style={style}>
          {children}
        </div>
      </SoapBubbleMaterial>
    </BubbleErrorBoundary>
  );
}

export {
  SoapBubbleButton,
  SoapBubbleIconButton,
  SoapBubbleMenu,
  SoapBubbleSearch,
  SoapBubbleSlider,
  SoapBubbleToggle
};
