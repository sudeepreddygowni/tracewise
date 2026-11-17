import React, { useState, useMemo, useEffect } from 'react';
import { COMPONENT_CATALOG } from '../../data/componentCatalog';
import { getAllComponents, getComponentCapabilityLevel, CAPABILITY_LEVELS } from '../../domain/componentRegistry';
import { RequestComponentModal } from './RequestComponentModal';
import { CustomComponentWizardModal } from './CustomComponentWizardModal';
import { Search, Plus, Cpu, Check, Layers, AlertCircle, X, Sparkles, Filter, Wrench } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function ComponentLibrary({ onAddComponent, onClose }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [lastAddedName, setLastAddedName] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [catalogList, setCatalogList] = useState(COMPONENT_CATALOG);

  // Load all components including locally registered imports
  useEffect(() => {
    try {
      const all = getAllComponents();
      setCatalogList(all);
    } catch (e) {
      setCatalogList(COMPONENT_CATALOG);
    }
  }, []);

  const handleComponentImported = (newComp) => {
    try {
      const all = getAllComponents();
      setCatalogList(all);
      setLastAddedName(newComp.name);
      setTimeout(() => setLastAddedName(null), 2400);
    } catch (e) {}
  };

  // Dynamically compute categories from catalog
  const categories = useMemo(() => {
    const set = new Set(catalogList.map(c => c.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [catalogList]);

  const filteredComponents = useMemo(() => {
    const term = search.toLowerCase().trim();
    return catalogList.filter((comp) => {
      const matchesSearch = !term ||
        comp.name.toLowerCase().includes(term) ||
        comp.description.toLowerCase().includes(term) ||
        (comp.partNumber && comp.partNumber.toLowerCase().includes(term)) ||
        (comp.aliases && comp.aliases.some(a => a.toLowerCase().includes(term)));
      const matchesCategory = selectedCategory === 'All' || comp.category === selectedCategory;
      const compLevel = getComponentCapabilityLevel(comp);
      const matchesLevel = selectedLevel === 'All' || compLevel === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [search, selectedCategory, selectedLevel, catalogList]);

  const handleAdd = (comp) => {
    onAddComponent(comp);
    setLastAddedName(comp.name);
    setTimeout(() => setLastAddedName(null), 2400);
  };

  return (
    <TracewiseBubbleArea
      theme="light"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 0,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header (fixed at top, never shrinks) */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--tw-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--tw-brand)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                Component Library
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
                {filteredComponents.length} parts
              </span>
              <TracewiseBubbleButton
                onClick={() => setIsWizardOpen(true)}
                variant="primary"
                size="sm"
                title="Create a Custom Component visually"
                style={{ fontSize: '0.74rem', padding: '4px 10px', minHeight: '32px' }}
              >
                <Plus size={13} />
                <span>+ Custom Part</span>
              </TracewiseBubbleButton>
              <TracewiseBubbleButton
                onClick={() => setIsRequestModalOpen(true)}
                variant="ghost"
                size="sm"
                title="Request or Import Hardware"
                style={{ fontSize: '0.74rem', padding: '4px 10px', minHeight: '32px' }}
              >
                <Sparkles size={13} color="var(--tw-brand)" />
                <span>Import JSON</span>
              </TracewiseBubbleButton>
              {onClose && (
                <TracewiseBubbleIconButton
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  title="Close Library"
                  style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
                >
                  <X size={16} />
                </TracewiseBubbleIconButton>
              )}
            </div>
          </div>
          
          {/* Search input with alias support */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--tw-text-muted)' }} />
            <input
              type="text"
              placeholder="Search (e.g. OLED, servo, nano, esp32, dht11)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 10px 9px 32px',
                borderRadius: '8px',
                border: '1px solid var(--tw-border)',
                fontSize: '0.84rem',
                backgroundColor: 'var(--tw-bg)'
              }}
            />
          </div>

          {/* Dynamic Category Pills with smooth horizontal scrolling */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              marginTop: '10px',
              paddingBottom: '4px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none'
            }}
          >
            {categories.map((cat) => (
              <TracewiseBubbleButton
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? 'primary' : 'ghost'}
                size="sm"
                style={{
                  fontSize: '0.74rem',
                  padding: '5px 11px',
                  whiteSpace: 'nowrap',
                  minHeight: '34px',
                  flexShrink: 0
                }}
              >
                {cat}
              </TracewiseBubbleButton>
            ))}
          </div>

          {/* Capability Tier Filter Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              marginTop: '6px',
              paddingBottom: '2px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none'
            }}
          >
            <span style={{ fontSize: '0.68rem', color: 'var(--tw-text-muted)', fontWeight: 600, flexShrink: 0, marginRight: '2px' }}>
              Capability:
            </span>
            {[
              { id: 'All', label: 'All Levels' },
              { id: 'E', label: 'Level E (Simulated)' },
              { id: 'D', label: 'Level D (Rule-Validated)' },
              { id: 'C', label: 'Level C (Connectable)' },
              { id: 'A', label: 'Level A (Documented)' }
            ].map(lvl => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id)}
                style={{
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: selectedLevel === lvl.id ? '1px solid var(--tw-brand)' : '1px solid var(--tw-border)',
                  backgroundColor: selectedLevel === lvl.id ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: selectedLevel === lvl.id ? 'var(--tw-brand)' : 'var(--tw-text-muted)',
                  fontWeight: selectedLevel === lvl.id ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Placement Feedback Banner */}
          {lastAddedName && (
            <div
              style={{
                marginTop: '10px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#059669',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.2s ease-in'
              }}
            >
              <Check size={14} />
              <span>Added <b>{lastAddedName}</b> to canvas center</span>
            </div>
          )}
        </div>

        {/* Catalog List - Independently scrollable */}
        <div
          onWheel={(e) => e.stopPropagation()}
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >
          {filteredComponents.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tw-text-muted)' }}>
              <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--tw-text-secondary)', marginBottom: '4px' }}>
                No components found
              </p>
              <p style={{ fontSize: '0.76rem', marginBottom: '12px' }}>
                No catalog items match "{search}".
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <TracewiseBubbleButton
                  onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                  variant="ghost"
                  size="sm"
                  style={{ fontSize: '0.76rem', minHeight: '36px' }}
                >
                  Reset Search
                </TracewiseBubbleButton>
                <TracewiseBubbleButton
                  onClick={() => setIsRequestModalOpen(true)}
                  variant="primary"
                  size="sm"
                  style={{ fontSize: '0.76rem', minHeight: '36px' }}
                >
                  <Sparkles size={13} />
                  <span>Request "{search}"</span>
                </TracewiseBubbleButton>
              </div>
            </div>
          ) : (
            filteredComponents.map((comp) => {
              const capLevel = getComponentCapabilityLevel(comp);
              const capMeta = CAPABILITY_LEVELS[capLevel] || CAPABILITY_LEVELS.A;

              return (
              <div
                key={comp.type}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--tw-border)',
                  backgroundColor: 'var(--tw-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                className="component-catalog-item"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {comp.category}
                      </span>

                      {/* Verified Capability Level Badge */}
                      <span
                        style={{
                          fontSize: '0.64rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: capMeta.badgeBg,
                          color: capMeta.color,
                          border: `1px solid ${capMeta.badgeBorder}`,
                          fontWeight: 700
                        }}
                      >
                        {capMeta.tier}: {capMeta.label}
                      </span>

                      {comp.isCustom && (
                        <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.18)', color: '#b45309', fontWeight: 700 }}>
                          Custom
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--tw-text)', marginTop: '2px', margin: 0 }}>
                      {comp.name}
                    </h4>
                  </div>
                  <TracewiseBubbleButton
                    onClick={() => handleAdd(comp)}
                    title={`Add ${comp.name} to Canvas`}
                    variant="secondary"
                    size="sm"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      gap: '4px',
                      minHeight: '36px',
                      flexShrink: 0
                    }}
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </TracewiseBubbleButton>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {comp.description}
                </p>

                {/* Pin badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                  {comp.pins.slice(0, 6).map(p => (
                    <span
                      key={p.id}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--tw-bg)',
                        border: '1px solid var(--tw-border)',
                        color: 'var(--tw-text-secondary)',
                        fontFamily: 'var(--font-code)'
                      }}
                    >
                      {p.label || p.id}
                    </span>
                  ))}
                  {comp.pins.length > 6 && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--tw-text-muted)', alignSelf: 'center' }}>
                      +{comp.pins.length - 6} pins
                    </span>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Component Request / Import Modal */}
      <RequestComponentModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onComponentImported={handleComponentImported}
      />

      {/* Visual Custom Component Wizard Modal */}
      <CustomComponentWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComponentCreated={handleComponentImported}
      />
    </TracewiseBubbleArea>
  );
}
