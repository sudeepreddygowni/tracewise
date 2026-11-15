import React, { useState } from 'react';
import { COMPONENT_CATALOG } from '../../data/componentCatalog';
import { Search, Plus, Cpu, ToggleRight, Sparkles } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';

export function ComponentLibrary({ onAddComponent }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Microcontrollers', 'Output', 'Passive', 'Input', 'Prototyping'];

  const filteredComponents = COMPONENT_CATALOG.filter((comp) => {
    const matchesSearch = comp.name.toLowerCase().includes(search.toLowerCase()) ||
                          comp.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || comp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
            Components
          </h3>
          
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--tw-text-muted)' }} />
            <input
              type="text"
              placeholder="Search parts (LED, resistor)..."
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

          {/* Category Pills */}
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
        </div>

        {/* Catalog List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredComponents.map((comp) => (
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
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
                    {comp.category}
                  </span>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--tw-text)' }}>
                    {comp.name}
                  </h4>
                </div>
                <TracewiseBubbleButton
                  onClick={() => onAddComponent(comp)}
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
              <p style={{ fontSize: '0.75rem', color: 'var(--tw-text-muted)', lineHeight: 1.4 }}>
                {comp.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
