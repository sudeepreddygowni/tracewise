import React from 'react';
import { getComponentDefinition } from '../../data/componentCatalog';
import { Trash2, Link2, Sliders, Info } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function ComponentInspector({
  selectedComponent,
  project,
  onUpdateProps,
  onDeleteComponent
}) {
  if (!selectedComponent) {
    return (
      <div
        style={{
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          color: 'var(--tw-text-muted)'
        }}
      >
        <Info size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--tw-text)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
          No Component Selected
        </h4>
        <p style={{ fontSize: '0.82rem', maxWidth: '200px' }}>
          Click any component on the canvas to inspect its pin mappings and modify properties.
        </p>
      </div>
    );
  }

  const def = getComponentDefinition(selectedComponent.type);

  // Find all wires attached to this component
  const attachedWires = (project.connections || []).filter(
    w => w.from?.componentId === selectedComponent.id || w.to?.componentId === selectedComponent.id
  );

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
        {/* Component Title & Delete */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
              {def?.category || 'Component'}
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
              {selectedComponent.name || def?.name}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', fontFamily: 'var(--font-code)' }}>
              ID: {selectedComponent.id}
            </span>
          </div>

          {selectedComponent.type !== 'arduino-uno' && (
            <TracewiseBubbleIconButton
              onClick={() => onDeleteComponent(selectedComponent.id)}
              title="Delete Component"
              variant="danger"
              size="sm"
            >
              <Trash2 size={14} />
            </TracewiseBubbleIconButton>
          )}
        </div>

        {/* Editable Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text-secondary)' }}>
            Properties
          </h4>

          {/* LED Color selector */}
          {selectedComponent.type === 'led' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', display: 'block', marginBottom: '6px' }}>
                LED Color:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['red', 'yellow', 'green', 'blue'].map((color) => {
                  const isActive = (selectedComponent.props?.color || 'red') === color;
                  return (
                    <TracewiseBubbleButton
                      key={color}
                      onClick={() => onUpdateProps({ color })}
                      variant={isActive ? 'primary' : 'ghost'}
                      size="sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.74rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {color}
                    </TracewiseBubbleButton>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resistor resistance selector */}
          {selectedComponent.type === 'resistor' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)', display: 'block', marginBottom: '6px' }}>
                Resistance Value:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['220Ω', '1kΩ', '10kΩ'].map((val) => {
                  const isActive = (selectedComponent.props?.resistance || '220Ω') === val;
                  return (
                    <TracewiseBubbleButton
                      key={val}
                      onClick={() => onUpdateProps({ resistance: val })}
                      variant={isActive ? 'primary' : 'ghost'}
                      size="sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.74rem'
                      }}
                    >
                      {val}
                    </TracewiseBubbleButton>
                  );
                })}
              </div>
            </div>
          )}

          {/* Canvas Position */}
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
            <span>X: <b>{selectedComponent.x}px</b></span>
            <span>Y: <b>{selectedComponent.y}px</b></span>
          </div>
        </div>

        {/* Connected Wires List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tw-text-secondary)' }}>
              Attached Connections ({attachedWires.length})
            </h4>
          </div>

          {attachedWires.length === 0 ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--tw-text-muted)' }}>
              No wires connected yet. Click any pin to draw a jumper wire.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {attachedWires.map((wire) => {
                const isFrom = wire.from?.componentId === selectedComponent.id;
                const myPin = isFrom ? wire.from?.pinId : wire.to?.pinId;
                const otherCompId = isFrom ? wire.to?.componentId : wire.from?.componentId;
                const otherPin = isFrom ? wire.to?.pinId : wire.from?.pinId;
                const otherComp = (project.components || []).find(c => c.id === otherCompId);

                return (
                  <div
                    key={wire.id}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--tw-bg)',
                      border: '1px solid var(--tw-border)',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: wire.color || '#2DC5E9'
                        }}
                      />
                      <span>Pin <b>{myPin}</b> → {otherComp?.name || otherCompId}: <b>{otherPin}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
