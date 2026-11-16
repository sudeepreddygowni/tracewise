import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArduinoUnoSvg } from './svg/ArduinoUnoSvg';
import { BreadboardSvg } from './svg/BreadboardSvg';
import { LedSvg } from './svg/LedSvg';
import { ResistorSvg } from './svg/ResistorSvg';
import { PushButtonSvg } from './svg/PushButtonSvg';
import { RgbLedSvg } from './svg/RgbLedSvg';
import { PotentiometerSvg } from './svg/PotentiometerSvg';
import { PhotoresistorSvg } from './svg/PhotoresistorSvg';
import { SlideSwitchSvg } from './svg/SlideSwitchSvg';
import { BuzzerSvg } from './svg/BuzzerSvg';
import { WireSvg } from './svg/WireSvg';
import { getComponentDefinition, getComponentPinCanvasCoords, WIRE_COLORS } from '../../data/componentCatalog';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Palette,
  Grid,
  Move,
  CheckCircle2,
  Maximize2,
  X
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function CircuitCanvas({
  project,
  selectedComponentId,
  onSelectComponent,
  onMoveComponent,
  onAddConnection,
  onRemoveConnection,
  onCommitHistory,
  onViewportChange
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [draggingCompId, setDraggingCompId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState(null);
  const [pendingWireStart, setPendingWireStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedWireId, setSelectedWireId] = useState(null);
  const [activeWireColor, setActiveWireColor] = useState(WIRE_COLORS[2].hex); // Default Cyan
  const [showGrid, setShowGrid] = useState(true);

  const containerRef = useRef(null);

  // Active pointers tracker for unified pointer events and multitouch pinch
  const activePointersRef = useRef(new Map());
  const dragInfoRef = useRef({
    compId: null,
    offset: { x: 0, y: 0 },
    target: null,
    pointerId: null,
    moved: false
  });
  const panningPointerIdRef = useRef(null);
  const pinchStateRef = useRef({
    active: false,
    initialDist: 0,
    initialZoom: 1,
    initialMidpoint: { x: 0, y: 0 },
    initialPan: { x: 0, y: 0 }
  });

  // Notify parent of viewport changes for smart center-of-view component placement
  useEffect(() => {
    if (onViewportChange && containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      onViewportChange({
        pan,
        zoom,
        width: clientWidth || 800,
        height: clientHeight || 600
      });
    }
  }, [pan, zoom, onViewportChange]);

  // Track space bar state for pan cursor & drag
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Compute absolute coordinate for any pin on the canvas in world space
  // using centralized SVG viewBox-to-viewport coordinate mapping
  const getPinCanvasCoords = useCallback((componentId, pinId) => {
    const comp = (project.components || []).find(c => c.id === componentId);
    if (!comp) return { x: 0, y: 0 };
    return getComponentPinCanvasCoords(comp, pinId);
  }, [project.components]);

  // Trackpad 2-finger pan & pinch zoom (ctrlKey) centered on cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();

      if (e.ctrlKey) {
        // Pinch-to-zoom centered on mouse position
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;

        const factor = Math.pow(0.992, e.deltaY);
        const newZoom = Math.min(Math.max(zoom * factor, 0.35), 2.5);

        setZoom(newZoom);
        setPan({
          x: mouseX - worldX * newZoom,
          y: mouseY - worldY * newZoom
        });
      } else {
        // 2-finger trackpad panning
        setPan(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, pan]);

  // Unified Pointer Down on Canvas Container (Empty Space or Background)
  const handleContainerPointerDown = (e) => {
    // Ignore clicks on floating UI cards or buttons
    if (e.target.closest && (e.target.closest('.glass-card') || e.target.closest('button'))) {
      return;
    }

    // Ignore if clicked on a pin (pins handle wiring)
    if (e.target.closest && e.target.closest('[data-pin="true"]')) {
      return;
    }

    // Record pointer
    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    // Multitouch gesture handling (2 fingers)
    if (activePointersRef.current.size === 2) {
      // Abort any ongoing component drag immediately
      abortComponentDrag();

      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].clientX - pts[0].clientX, pts[1].clientY - pts[0].clientY);
      const midX = (pts[0].clientX + pts[1].clientX) / 2;
      const midY = (pts[0].clientY + pts[1].clientY) / 2;

      pinchStateRef.current = {
        active: true,
        initialDist: dist || 1,
        initialZoom: zoom,
        initialMidpoint: { x: midX, y: midY },
        initialPan: { ...pan }
      };
      setIsPanning(false);
      return;
    }

    // 1-pointer pan on background (Middle click, Spacebar, or empty canvas click)
    const isBackgroundTarget = e.target === containerRef.current || e.target.getAttribute('data-canvas-bg') === 'true';
    if (e.button === 1 || isSpacePressed || isBackgroundTarget) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      panningPointerIdRef.current = e.pointerId;
      try {
        containerRef.current?.setPointerCapture(e.pointerId);
      } catch (err) {
        // Safe fallback
      }
    }
  };

  // Helper to cleanly abort component dragging
  const abortComponentDrag = () => {
    if (dragInfoRef.current.compId) {
      try {
        if (dragInfoRef.current.target && dragInfoRef.current.pointerId != null) {
          dragInfoRef.current.target.releasePointerCapture(dragInfoRef.current.pointerId);
        }
      } catch (err) {
        // Safe fallback
      }
      if (dragInfoRef.current.moved && onCommitHistory) {
        onCommitHistory();
      }
      dragInfoRef.current = {
        compId: null,
        offset: { x: 0, y: 0 },
        target: null,
        pointerId: null,
        moved: false
      };
      setDraggingCompId(null);
    }
  };

  // Unified Pointer Down on a Component
  const handleCompPointerDown = (e, comp) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Pin clicks must NOT trigger component dragging
    if (e.target.closest && e.target.closest('[data-pin="true"]')) {
      return;
    }

    e.stopPropagation();
    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    // If 2 or more fingers are on screen, abort dragging and switch to multitouch pinch-zoom
    if (activePointersRef.current.size >= 2) {
      abortComponentDrag();
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].clientX - pts[0].clientX, pts[1].clientY - pts[0].clientY);
      const midX = (pts[0].clientX + pts[1].clientX) / 2;
      const midY = (pts[0].clientY + pts[1].clientY) / 2;

      pinchStateRef.current = {
        active: true,
        initialDist: dist || 1,
        initialZoom: zoom,
        initialMidpoint: { x: midX, y: midY },
        initialPan: { ...pan }
      };
      setIsPanning(false);
      return;
    }

    // Select component
    onSelectComponent(comp.id);
    setSelectedWireId(null);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = (e.clientX - rect.left - pan.x) / zoom;
    const curY = (e.clientY - rect.top - pan.y) / zoom;
    const offset = {
      x: curX - comp.x,
      y: curY - comp.y
    };

    setDraggingCompId(comp.id);
    setDragOffset(offset);

    dragInfoRef.current = {
      compId: comp.id,
      offset,
      target: e.currentTarget,
      pointerId: e.pointerId,
      moved: false
    };

    // Capture pointer so fast movements on touchscreens or trackpads stay bound
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Safe fallback
    }
  };

  // Unified Pointer Move
  const handlePointerMove = (e) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // 1. Two-finger pinch-zoom and pan
    if (activePointersRef.current.size >= 2 && pinchStateRef.current.active) {
      const pts = Array.from(activePointersRef.current.values());
      const curDist = Math.hypot(pts[1].clientX - pts[0].clientX, pts[1].clientY - pts[0].clientY);
      const curMidX = (pts[0].clientX + pts[1].clientX) / 2;
      const curMidY = (pts[0].clientY + pts[1].clientY) / 2;

      if (pinchStateRef.current.initialDist > 0) {
        const scale = curDist / pinchStateRef.current.initialDist;
        const newZoom = Math.min(Math.max(pinchStateRef.current.initialZoom * scale, 0.35), 2.5);

        const worldMidX = (pinchStateRef.current.initialMidpoint.x - rect.left - pinchStateRef.current.initialPan.x) / pinchStateRef.current.initialZoom;
        const worldMidY = (pinchStateRef.current.initialMidpoint.y - rect.top - pinchStateRef.current.initialPan.y) / pinchStateRef.current.initialZoom;

        const newPanX = curMidX - rect.left - worldMidX * newZoom;
        const newPanY = curMidY - rect.top - worldMidY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
      return;
    }

    // 2. Component Dragging with 1 pointer
    if (dragInfoRef.current.compId && dragInfoRef.current.pointerId === e.pointerId) {
      const curX = (e.clientX - rect.left - pan.x) / zoom;
      const curY = (e.clientY - rect.top - pan.y) / zoom;
      setMousePos({ x: curX, y: curY });

      const newX = Math.round(curX - dragInfoRef.current.offset.x);
      const newY = Math.round(curY - dragInfoRef.current.offset.y);

      // Clamp so components cannot be dragged off into negative coordinates
      const clampedX = Math.max(10, newX);
      const clampedY = Math.max(10, newY);

      dragInfoRef.current.moved = true;
      onMoveComponent(dragInfoRef.current.compId, clampedX, clampedY);
      return;
    }

    // 3. Canvas Background Panning
    if (isPanning && panningPointerIdRef.current === e.pointerId) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // 4. Default cursor tracking for pending wire rubberband
    const curX = (e.clientX - rect.left - pan.x) / zoom;
    const curY = (e.clientY - rect.top - pan.y) / zoom;
    setMousePos({ x: curX, y: curY });
  };

  // Unified Pointer Up / End
  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId);

    // If finished dragging component
    if (dragInfoRef.current.pointerId === e.pointerId) {
      try {
        if (dragInfoRef.current.target) {
          dragInfoRef.current.target.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Safe fallback
      }

      if (dragInfoRef.current.moved && onCommitHistory) {
        onCommitHistory();
      }

      dragInfoRef.current = {
        compId: null,
        offset: { x: 0, y: 0 },
        target: null,
        pointerId: null,
        moved: false
      };
      setDraggingCompId(null);
    }

    // If finished panning background
    if (panningPointerIdRef.current === e.pointerId) {
      setIsPanning(false);
      panningPointerIdRef.current = null;
      try {
        containerRef.current?.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe fallback
      }
    }

    if (activePointersRef.current.size < 2) {
      pinchStateRef.current.active = false;
    }
  };

  // Unified Pointer Cancel or Lost Capture
  const handlePointerCancel = (e) => {
    handlePointerUp(e);
  };

  // Keyboard shortcut to delete selected wire or cancel rubberband
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWireId && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          onRemoveConnection(selectedWireId);
          setSelectedWireId(null);
        }
      } else if (e.key === 'Escape') {
        setPendingWireStart(null);
        setSelectedWireId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, onRemoveConnection]);

  // Handle Pin Click (Starting or Finishing a Wire)
  const handlePinClick = (comp, pin) => {
    if (!pendingWireStart) {
      // Start wire
      const coords = getPinCanvasCoords(comp.id, pin.id);
      setPendingWireStart({
        componentId: comp.id,
        pinId: pin.id,
        x: coords.x,
        y: coords.y
      });
      setSelectedWireId(null);
    } else {
      // Finish wire if different component or pin
      if (pendingWireStart.componentId !== comp.id || pendingWireStart.pinId !== pin.id) {
        onAddConnection(
          { componentId: pendingWireStart.componentId, pinId: pendingWireStart.pinId },
          { componentId: comp.id, pinId: pin.id },
          activeWireColor,
          `${pin.id} Wire`
        );
      }
      setPendingWireStart(null);
    }
  };

  // Fit Circuit to View calculation
  const handleFitToView = () => {
    const comps = project.components || [];
    if (comps.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    comps.forEach(c => {
      const def = getComponentDefinition(c.type);
      const w = def?.width || 180;
      const h = def?.height || 140;
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x + w > maxX) maxX = c.x + w;
      if (c.y + h > maxY) maxY = c.y + h;
    });

    const circuitWidth = Math.max(maxX - minX, 100);
    const circuitHeight = Math.max(maxY - minY, 100);

    const padding = 70;
    const availableWidth = Math.max(clientWidth - padding * 2, 200);
    const availableHeight = Math.max(clientHeight - padding * 2, 200);

    const fitZoom = Math.min(
      Math.max(Math.min(availableWidth / circuitWidth, availableHeight / circuitHeight), 0.45),
      1.5
    );

    const centerX = minX + circuitWidth / 2;
    const centerY = minY + circuitHeight / 2;

    const targetPanX = clientWidth / 2 - centerX * fitZoom;
    const targetPanY = clientHeight / 2 - centerY * fitZoom;

    setZoom(fitZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  const getCursor = () => {
    if (draggingCompId) return 'grabbing';
    if (isPanning) return 'grabbing';
    if (isSpacePressed) return 'grab';
    if (pendingWireStart) return 'crosshair';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleContainerPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(e) => {
        if (e.target === containerRef.current || e.target.getAttribute('data-canvas-bg') === 'true') {
          setPendingWireStart(null);
          setSelectedWireId(null);
          onSelectComponent(null);
        }
      }}
      data-canvas-bg="true"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        backgroundImage: showGrid
          ? `radial-gradient(circle, #cbd5e1 ${Math.max(1, 1.2 * zoom)}px, transparent ${Math.max(1, 1.2 * zoom)}px)`
          : 'none',
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        overflow: 'hidden',
        cursor: getCursor(),
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Top Floating Canvas Toolbar (Touch Targets >= 38px) */}
      <TracewiseBubbleArea theme="light">
        <div
          className="glass-card canvas-floating-toolbar"
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--tw-radius-pill)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            touchAction: 'auto'
          }}
        >
          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.15, 2.2)); }}
            title="Zoom In"
            variant="ghost"
            size="sm"
            style={{ width: 38, height: 38, minWidth: 38, minHeight: 38 }}
          >
            <ZoomIn size={16} />
          </TracewiseBubbleIconButton>

          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text-muted)', minWidth: '38px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.15, 0.4)); }}
            title="Zoom Out"
            variant="ghost"
            size="sm"
            style={{ width: 38, height: 38, minWidth: 38, minHeight: 38 }}
          >
            <ZoomOut size={16} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
            title="Reset View (100%)"
            variant="ghost"
            size="sm"
            style={{ width: 38, height: 38, minWidth: 38, minHeight: 38 }}
          >
            <RotateCcw size={15} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); handleFitToView(); }}
            title="Fit Circuit to View"
            variant="ghost"
            size="sm"
            style={{ width: 38, height: 38, minWidth: 38, minHeight: 38 }}
          >
            <Maximize2 size={15} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setShowGrid(!showGrid); }}
            title="Toggle Grid"
            variant="ghost"
            size="sm"
            style={{
              width: 38,
              height: 38,
              minWidth: 38,
              minHeight: 38,
              color: showGrid ? 'var(--tw-brand)' : 'var(--tw-text-muted)'
            }}
          >
            <Grid size={16} />
          </TracewiseBubbleIconButton>
        </div>

        {/* Wire Color Palette Picker (Top Right) */}
        <div
          className="glass-card canvas-color-toolbar"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--tw-radius-pill)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            touchAction: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-muted)', marginRight: '2px' }}>
            Wire:
          </span>
          {WIRE_COLORS.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveWireColor(col.hex)}
              title={col.name}
              style={{
                width: 24,
                height: 24,
                minWidth: 24,
                minHeight: 24,
                borderRadius: '50%',
                backgroundColor: col.hex,
                border: activeWireColor === col.hex ? '3px solid #071831' : '1.5px solid rgba(0,0,0,0.2)',
                transform: activeWireColor === col.hex ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            />
          ))}

          {selectedWireId && (
            <TracewiseBubbleButton
              onClick={() => {
                onRemoveConnection(selectedWireId);
                setSelectedWireId(null);
              }}
              title="Delete Selected Wire (Del)"
              variant="danger"
              size="sm"
              style={{
                marginLeft: '4px',
                padding: '6px 12px',
                minHeight: '36px',
                fontSize: '0.75rem',
                gap: '4px'
              }}
            >
              <Trash2 size={13} />
              <span>Delete Wire</span>
            </TracewiseBubbleButton>
          )}
        </div>
      </TracewiseBubbleArea>

      {/* Touch-Friendly Pending Wire Helper Banner with Cancel Button */}
      {pendingWireStart && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            background: 'rgba(7, 24, 49, 0.96)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 'var(--tw-radius-pill)',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '92vw',
            border: '1px solid rgba(45, 197, 233, 0.35)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2dc5e9', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', lineHeight: 1.3 }}>
            Tap destination pin to complete wire
          </span>
          <button
            onClick={() => setPendingWireStart(null)}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <X size={12} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Main Scaled Coordinate Space */}
      <div
        data-canvas-bg="true"
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          touchAction: 'none'
        }}
      >
        <svg
          data-canvas-bg="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4000px',
            height: '3000px',
            pointerEvents: 'none'
          }}
        >
          {/* Permanent Committed Wires */}
          <g style={{ pointerEvents: 'auto' }}>
            {(project.connections || []).map((wire) => {
              const startCoords = getPinCanvasCoords(wire.from?.componentId, wire.from?.pinId);
              const endCoords = getPinCanvasCoords(wire.to?.componentId, wire.to?.pinId);

              return (
                <WireSvg
                  key={wire.id}
                  id={wire.id}
                  x1={startCoords.x}
                  y1={startCoords.y}
                  x2={endCoords.x}
                  y2={endCoords.y}
                  color={wire.color || '#2DC5E9'}
                  label={wire.label || ''}
                  isSelected={selectedWireId === wire.id}
                  onClick={(wireId) => setSelectedWireId(wireId)}
                />
              );
            })}

            {/* Elastic Pending Wire Following Mouse/Touch Position */}
            {pendingWireStart && (
              <line
                x1={pendingWireStart.x}
                y1={pendingWireStart.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke={activeWireColor}
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            )}
          </g>
        </svg>

        {/* Placed Circuit Components */}
        {(project.components || []).map((comp) => {
          const isSelected = selectedComponentId === comp.id;
          const def = getComponentDefinition(comp.type);
          if (!def) return null;

          return (
            <div
              key={comp.id}
              data-component="true"
              data-component-id={comp.id}
              onPointerDown={(e) => handleCompPointerDown(e, comp)}
              style={{
                position: 'absolute',
                left: comp.x,
                top: comp.y,
                cursor: draggingCompId === comp.id ? 'grabbing' : 'grab',
                zIndex: isSelected ? 30 : 10,
                touchAction: 'none',
                transition: draggingCompId === comp.id ? 'none' : 'filter 0.15s ease'
              }}
            >
              {/* Component selection indicator bounding box */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    right: -8,
                    bottom: -8,
                    border: '2px dashed var(--tw-brand)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    background: 'rgba(30, 63, 216, 0.04)'
                  }}
                />
              )}

              {/* Specific SVG component based on catalog type */}
              {comp.type === 'arduino-uno' && (
                <ArduinoUnoSvg
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'breadboard-half' && (
                <BreadboardSvg
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'led' && (
                <LedSvg
                  color={comp.props?.color || 'red'}
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'resistor' && (
                <ResistorSvg
                  resistance={comp.props?.resistance || '220Ω'}
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'push-button' && (
                <PushButtonSvg
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'rgb-led' && (
                <RgbLedSvg
                  red={comp.props?.red ?? 255}
                  green={comp.props?.green ?? 0}
                  blue={comp.props?.blue ?? 128}
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'potentiometer' && (
                <PotentiometerSvg
                  value={comp.props?.value ?? 512}
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'photoresistor' && (
                <PhotoresistorSvg
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'slide-switch' && (
                <SlideSwitchSvg
                  state={comp.props?.state || 'left'}
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}

              {comp.type === 'buzzer' && (
                <BuzzerSvg
                  pins={def.pins}
                  activePinId={hoveredPin?.comp?.id === comp.id ? hoveredPin.pin.id : null}
                  onPinClick={(pin) => handlePinClick(comp, pin)}
                  onPinHover={(pin) => setHoveredPin(pin ? { comp, pin } : null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}