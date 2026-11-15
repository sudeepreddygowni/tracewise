import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArduinoUnoSvg } from './svg/ArduinoUnoSvg';
import { BreadboardSvg } from './svg/BreadboardSvg';
import { LedSvg } from './svg/LedSvg';
import { ResistorSvg } from './svg/ResistorSvg';
import { PushButtonSvg } from './svg/PushButtonSvg';
import { WireSvg } from './svg/WireSvg';
import { getComponentDefinition, WIRE_COLORS } from '../../data/componentCatalog';
import { ZoomIn, ZoomOut, RotateCcw, Trash2, Palette, Grid, Move, CheckCircle2 } from 'lucide-react';
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
  onRemoveConnection
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingCompId, setDraggingCompId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState(null);
  const [pendingWireStart, setPendingWireStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedWireId, setSelectedWireId] = useState(null);
  const [activeWireColor, setActiveWireColor] = useState(WIRE_COLORS[2].hex); // Default Cyan
  const [showGrid, setShowGrid] = useState(true);

  const containerRef = useRef(null);

  // Compute absolute coordinate for any pin on the canvas
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

  // Handle canvas mouse move for dragging component or wire rubberband
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = (e.clientX - rect.left - pan.x) / zoom;
    const curY = (e.clientY - rect.top - pan.y) / zoom;

    setMousePos({ x: curX, y: curY });

    if (draggingCompId) {
      const newX = Math.round(curX - dragOffset.x);
      const newY = Math.round(curY - dragOffset.y);
      onMoveComponent(draggingCompId, Math.max(10, newX), Math.max(10, newY));
    }
  };

  const handleMouseUp = () => {
    if (draggingCompId) {
      setDraggingCompId(null);
    }
  };

  // Keyboard shortcut to delete selected wire
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
      // Finish wire if different component
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

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => {
        setPendingWireStart(null);
        setSelectedWireId(null);
        onSelectComponent(null);
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        backgroundImage: showGrid
          ? 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)'
          : 'none',
        backgroundSize: '24px 24px',
        overflow: 'hidden',
        cursor: draggingCompId ? 'grabbing' : pendingWireStart ? 'crosshair' : 'default',
        userSelect: 'none'
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
            gap: '4px',
            padding: '4px 8px',
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
            onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.15, 0.5)); }}
            title="Zoom Out"
            variant="ghost"
            size="sm"
          >
            <ZoomOut size={15} />
          </TracewiseBubbleIconButton>

          <TracewiseBubbleIconButton
            onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
            title="Reset View"
            variant="ghost"
            size="sm"
          >
            <RotateCcw size={14} />
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '2400px',
            height: '1800px',
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
