import React, { useState, useMemo } from 'react';
import { COMPONENT_CATALOG } from '../../data/componentCatalog';
import { Search, Plus, Cpu, Check, Layers, AlertCircle } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function ComponentLibrary({ onAddComponent }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lastAddedName, setLastAddedName] = useState(null);

  // Dynamically compute categories from catalog
  const categories = useMemo(() => {
    const set = new Set(COMPONENT_CATALOG.map(c => c.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredComponents = useMemo(() => {
    const term = search.toLowerCase().trim();
    return COMPONENT_CATALOG.filter((comp) => {
      const matchesSearch = !term ||
        comp.name.toLowerCase().includes(term) ||
        comp.description.toLowerCase().includes(term) ||
        (comp.aliases && comp.aliases.some(a => a.toLowerCase().includes(term)));
      const matchesCategory = selectedCategory === 'All' || comp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const handleAdd = (comp) => {
    onAddComponent(comp);
    setLastAddedName(comp.name);
    setTimeout(() => setLastAddedName(null), 2200);
  };

  return (
    <TracewiseBubbleArea theme="light">
      <div
        style={{
          width: '280px',
          height: '100%',
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--tw-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--tw-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
              Component Library
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
              {filteredComponents.length} parts
            </span>
          </div>
          
          {/* Search input with alias support */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--tw-text-muted)' }} />
            <input
              type="text"
              placeholder="Search (e.g. RGB, pot, buzzer)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: '8px',
                border: '1px solid var(--tw-border)',
                fontSize: '0.82rem',
                backgroundColor: 'var(--tw-bg)'
              }}
            />
          </div>

          {/* Dynamic Category Pills */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginTop: '10px', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <TracewiseBubbleButton
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? 'primary' : 'ghost'}
                size="sm"
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 9px',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </TracewiseBubbleButton>
            ))}
          </div>

          {/* Placement Feedback Banner */}
          {lastAddedName && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#059669',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={13} />
              <span>Added {lastAddedName} to canvas</span>
            </div>
          )}
        </div>

        {/* Catalog List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredComponents.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tw-text-muted)' }}>
              <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--tw-text-secondary)', marginBottom: '4px' }}>
                No components found
              </p>
              <p style={{ fontSize: '0.75rem', marginBottom: '12px' }}>
                No catalog items match "{search}".
              </p>
              <TracewiseBubbleButton
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                variant="ghost"
                size="sm"
                style={{ fontSize: '0.74rem' }}
              >
                Reset Search
              </TracewiseBubbleButton>
            </div>
          ) : (
            filteredComponents.map((comp) => (
              <div
                key={comp.type}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--tw-border)',
                  backgroundColor: 'var(--tw-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                className="component-catalog-item"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {comp.category}
                    </span>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--tw-text)', marginTop: '1px' }}>
                      {comp.name}
                    </h4>
                  </div>
                  <TracewiseBubbleButton
                    onClick={() => handleAdd(comp)}
                    title="Add to Canvas"
                    variant="secondary"
                    size="sm"
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.74rem',
                      gap: '3px'
                    }}
                  >
                    <Plus size={12} />
                    <span>Add</span>
                  </TracewiseBubbleButton>
                </div>

                <p style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', lineHeight: 1.4 }}>
                  {comp.description}
                </p>

                {/* Pin badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                  {comp.pins.slice(0, 4).map(p => (
                    <span
                      key={p.id}
                      style={{
                        fontSize: '0.66rem',
                        padding: '1px 5px',
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
                  {comp.pins.length > 4 && (
                    <span style={{ fontSize: '0.66rem', color: 'var(--tw-text-muted)', alignSelf: 'center' }}>
                      +{comp.pins.length - 4} pins
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
