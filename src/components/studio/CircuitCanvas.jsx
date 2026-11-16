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
import { getComponentDefinition, WIRE_COLORS } from '../../data/componentCatalog';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Palette,
  Grid,
  Move,
  CheckCircle2,
  Maximize2
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
  onCommitHistory
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
  const touchStateRef = useRef({
    initialDistance: 0,
    initialZoom: 1,
    initialMidpoint: { x: 0, y: 0 },
    initialPan: { x: 0, y: 0 },
    isTouching: false
  });

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
  const getPinCanvasCoords = useCallback((componentId, pinId) => {
    const comp = (project.components || []).find(c => c.id === componentId);
    if (!comp) return { x: 0, y: 0 };
    const def = getComponentDefinition(comp.type);
    const pin = def?.pins?.find(p => p.id === pinId);
    if (!pin) return { x: comp.x, y: comp.y };

    return {
      x: comp.x + pin.x,
      y: comp.y + pin.y
    };
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
        const newZoom = Math.min(Math.max(zoom * factor, 0.4), 2.5);

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

  // Handle pointer down on background (mouse or touch)
  const handlePointerDown = (e) => {
    // If middle click (button === 1), or Space held, or clicking empty canvas background:
    if (e.button === 1 || isSpacePressed || e.target === containerRef.current || e.target.getAttribute('data-canvas-bg') === 'true') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Handle pointer move for panning, dragging component, or wire rubberband
  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const curX = (e.clientX - rect.left - pan.x) / zoom;
    const curY = (e.clientY - rect.top - pan.y) / zoom;

    setMousePos({ x: curX, y: curY });

    if (draggingCompId) {
      const newX = Math.round(curX - dragOffset.x);
      const newY = Math.round(curY - dragOffset.y);
      onMoveComponent(draggingCompId, Math.max(10, newX), Math.max(10, newY));
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingCompId) {
      setDraggingCompId(null);
      if (onCommitHistory) {
        onCommitHistory();
      }
    }
  };

  // Touch gesture handling (1-finger pan on empty canvas, 2-finger pinch/pan)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      if (e.target === containerRef.current || e.target.getAttribute('data-canvas-bg') === 'true') {
        setIsPanning(true);
        setPanStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y
        });
      }
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      touchStateRef.current = {
        initialDistance: dist,
        initialZoom: zoom,
        initialMidpoint: { x: midX, y: midY },
        initialPan: { ...pan },
        isTouching: true
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isPanning) {
      setPan({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    } else if (e.touches.length === 2 && touchStateRef.current.isTouching) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      const scale = dist / touchStateRef.current.initialDistance;
      const newZoom = Math.min(Math.max(touchStateRef.current.initialZoom * scale, 0.4), 2.5);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const worldMidX = (touchStateRef.current.initialMidpoint.x - rect.left - touchStateRef.current.initialPan.x) / touchStateRef.current.initialZoom;
      const worldMidY = (touchStateRef.current.initialMidpoint.y - rect.top - touchStateRef.current.initialPan.y) / touchStateRef.current.initialZoom;

      setZoom(newZoom);
      setPan({
        x: midX - rect.left - worldMidX * newZoom,
        y: midY - rect.top - worldMidY * newZoom
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    touchStateRef.current.isTouching = false;
    if (draggingCompId) {
      setDraggingCompId(null);
      if (onCommitHistory) onCommitHistory();
    }
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

  // Component Drag Start
  const handleCompMouseDown = (e, comp) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text') return; // let pin click handle
    e.stopPropagation();
    onSelectComponent(comp.id);
    setSelectedWireId(null);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = (e.clientX - rect.left - pan.x) / zoom;
    const curY = (e.clientY - rect.top - pan.y) / zoom;

    setDraggingCompId(comp.id);
    setDragOffset({
      x: curX - comp.x,
      y: curY - comp.y
    });
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
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
      {/* Top Floating Canvas Toolbar */}
      <TracewiseBubbleArea theme="light">
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--tw-radius-pill)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}
        >
          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.15, 2.2)); }}
            title="Zoom In"
            variant="ghost"
            size="sm"
          >
            <ZoomIn size={15} />
          </TracewiseBubbleIconButton>

          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-text-muted)', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.15, 0.4)); }}
            title="Zoom Out"
            variant="ghost"
            size="sm"
          >
            <ZoomOut size={15} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
            title="Reset View (100%)"
            variant="ghost"
            size="sm"
          >
            <RotateCcw size={14} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); handleFitToView(); }}
            title="Fit Circuit to View"
            variant="ghost"
            size="sm"
          >
            <Maximize2 size={14} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setShowGrid(!showGrid); }}
            title="Toggle Grid"
            variant="ghost"
            size="sm"
            style={{
              color: showGrid ? 'var(--tw-brand)' : 'var(--tw-text-muted)'
            }}
          >
            <Grid size={15} />
          </TracewiseBubbleIconButton>
        </div>

        {/* Wire Color Palette Picker (Top Right) */}
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--tw-radius-pill)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
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
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: col.hex,
                border: activeWireColor === col.hex ? '2.5px solid #071831' : '1px solid rgba(0,0,0,0.15)',
                transform: activeWireColor === col.hex ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
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
                marginLeft: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                gap: '4px'
              }}
            >
              <Trash2 size={12} />
              <span>Delete Wire</span>
            </TracewiseBubbleButton>
          )}
        </div>
      </TracewiseBubbleArea>

      {/* Pending Wire Helper Prompt Bar */}
      {pendingWireStart && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            background: 'var(--tw-dark)',
            color: '#ffffff',
            padding: '8px 20px',
            borderRadius: 'var(--tw-radius-pill)',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2dc5e9', display: 'inline-block' }} />
          <span>Click destination pin to complete wire • Press <b>Esc</b> to cancel</span>
        </div>
      )}

      {/* Main SVG Scaled Coordinate Space */}
      <div
        data-canvas-bg="true"
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0
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

            {/* Elastic Pending Wire Following Mouse Cursor */}
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
              onMouseDown={(e) => handleCompMouseDown(e, comp)}
              style={{
                position: 'absolute',
                left: comp.x,
                top: comp.y,
                cursor: draggingCompId === comp.id ? 'grabbing' : 'grab',
                zIndex: isSelected ? 30 : 10,
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
