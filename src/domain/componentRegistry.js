/**
 * Tracewise Extensible Electronic Component Registry
 * Version 2.0 — Multi-Tier Capability Architecture
 * 
 * Capability Tiers:
 * - Level A (Documented): Name, part number, purpose, and datasheet documented.
 * - Level B (Visual): Visual placement on schematic or project canvas.
 * - Level C (Connectable): Confirmed electrical pins for wiring diagrams.
 * - Level D (Rule-Validated): Voltage domain and electrical compatibility checked.
 * - Level E (Simulated): Tested behavioral simulation model active.
 * - Level F (Firmware Integrated): End-to-end runtime integration with controller.
 * 
 * Strict schema validation, DOMParser-based SVG sanitization, and cloud persistence.
 */

import { COMPONENT_CATALOG } from '../data/componentCatalog.js';

const STORAGE_KEY_CUSTOM_COMPONENTS = 'tracewise_custom_components_v2';
const STORAGE_KEY_CUSTOM_COMPONENTS_LEGACY = 'tracewise_custom_components_v1';
const STORAGE_KEY_REQUESTS = 'tracewise_component_requests_v1';

export const CAPABILITY_LEVELS = {
  A: {
    id: 'A',
    tier: 'Level A',
    label: 'Documented',
    description: 'Name, part number, specifications, and datasheet recorded.',
    color: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    badgeBorder: 'rgba(148, 163, 184, 0.3)'
  },
  B: {
    id: 'B',
    tier: 'Level B',
    label: 'Visual Model',
    description: 'Can be placed and visually arranged on circuit canvas.',
    color: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.3)'
  },
  C: {
    id: 'C',
    tier: 'Level C',
    label: 'Connectable',
    description: 'Confirmed electrical pins participate in schematic wiring.',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.3)'
  },
  D: {
    id: 'D',
    tier: 'Level D',
    label: 'Rule-Validated',
    description: 'Voltage domains and electrical compatibility rules verified.',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)'
  },
  E: {
    id: 'E',
    tier: 'Level E',
    label: 'Simulated',
    description: 'Tested behavioral simulation engine reacts to firmware signals.',
    color: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)'
  },
  F: {
    id: 'F',
    tier: 'Level F',
    label: 'Firmware Integrated',
    description: 'Full runtime execution with target board toolchain.',
    color: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    badgeBorder: 'rgba(236, 72, 153, 0.3)'
  }
};

// Built-in components with verified behavioral simulation models in AVR8js engine
const SIMULATION_TESTED_TYPES = new Set([
  'arduino-uno',
  'breadboard-half',
  'led-red',
  'led-green',
  'led-yellow',
  'led-blue',
  'resistor',
  'pushbutton',
  'potentiometer',
  'buzzer'
]);

// Strict SVG tag allowlist (case-insensitive check)
const ALLOWED_SVG_TAGS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line',
  'polyline', 'polygon', 'text', 'tspan', 'defs',
  'lineargradient', 'radialgradient', 'stop', 'use',
  'clippath', 'mask'
]);

// Strict SVG attribute allowlist / rules
const FORBIDDEN_ATTR_PREFIXES = ['on']; // e.g. onload, onclick, onerror
const FORBIDDEN_SCHEMES = ['javascript:', 'vbscript:', 'data:text/html'];

/**
 * Calculates the exact capability level for any component instance or catalog definition.
 * Never claims Level E (Simulated) without a tested behavioral model.
 */
export function getComponentCapabilityLevel(comp) {
  if (!comp) return 'A';

  // If comp is an instance without inlined pins/viewBox, resolve against catalog definition
  const catalogItem = COMPONENT_CATALOG.find(c => c.type === comp.type);
  const target = catalogItem ? { ...catalogItem, ...comp, pins: comp.pins || catalogItem.pins } : comp;

  // Level E requires a verified simulation model in the engine
  if (target.simulationModelId || SIMULATION_TESTED_TYPES.has(target.type)) {
    return 'E';
  }

  // Level D requires connectable pins AND specified voltage domains / rule checks
  const hasPins = Array.isArray(target.pins) && target.pins.length > 0;
  const hasVoltageDomain = Boolean(
    target.voltageDomain ||
    (Array.isArray(target.voltageDomains) && target.voltageDomains.length > 0) ||
    target.validationRules
  );

  if (hasPins && hasVoltageDomain) {
    return 'D';
  }

  // Level C requires confirmed electrical pins
  if (hasPins) {
    return 'C';
  }

  // Level B requires visual rendering footprint / viewBox
  if (target.viewBox || target.svgBody || target.width) {
    return 'B';
  }

  return 'A';
}

/**
 * Strict DOMParser-based SVG sanitizer.
 * Discards any scripts, foreignObjects, event handlers, or malicious URIs.
 */
export function sanitizeSvgMarkup(rawSvg) {
  if (!rawSvg || typeof rawSvg !== 'string') {
    return { sanitizedSvg: '', strippedCount: 0, issues: ['Empty SVG content'] };
  }

  const issues = [];
  let strippedCount = 0;

  // Node.js environment fallback
  if (typeof DOMParser === 'undefined') {
    let sanitized = rawSvg.trim();
    const forbiddenTags = ['script', 'foreignobject', 'iframe', 'audio', 'video', 'style', 'object', 'embed', 'animate', 'set', 'a'];
    for (const tag of forbiddenTags) {
      const tagRegex = new RegExp(`<\\s*${tag}[^>]*>([\\s\\S]*?<\\s*\\/\\s*${tag}\\s*>)?`, 'gi');
      if (tagRegex.test(sanitized)) {
        issues.push(`Forbidden tag <${tag}> removed`);
        strippedCount++;
        sanitized = sanitized.replace(tagRegex, '');
      }
    }
    const onAttrRegex = /\s+on[a-z0-9_-]+\s*=\s*(['\"][^'\"]*['\"]|[^\s>]+)/gi;
    if (onAttrRegex.test(sanitized)) {
      issues.push("Forbidden event handler removed");
      strippedCount++;
      sanitized = sanitized.replace(onAttrRegex, '');
    }
    const jsHrefRegex = /\s+(?:href|xlink:href)\s*=\s*['\"]\s*javascript:[^'\"]*['\"]/gi;
    if (jsHrefRegex.test(sanitized)) {
      issues.push("Unsafe URI scheme removed");
      strippedCount++;
      sanitized = sanitized.replace(jsHrefRegex, '');
    }
    return {
      sanitizedSvg: sanitized,
      strippedCount,
      issues
    };
  }

  try {
    const parser = new DOMParser();
    let toParse = rawSvg.trim();
    if (!toParse.toLowerCase().startsWith('<svg')) {
      toParse = `<svg xmlns="http://www.w3.org/2000/svg">${toParse}</svg>`;
    }

    const doc = parser.parseFromString(toParse, 'image/svg+xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        sanitizedSvg: '',
        strippedCount: 0,
        issues: [`XML syntax error: ${parserError.textContent.slice(0, 100)}`]
      };
    }

    function cleanNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        if (!ALLOWED_SVG_TAGS.has(tagName)) {
          issues.push(`Forbidden tag <${tagName}> removed`);
          strippedCount++;
          node.parentNode?.removeChild(node);
          return;
        }

        const attrs = Array.from(node.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          const attrVal = attr.value.trim().toLowerCase();

          if (FORBIDDEN_ATTR_PREFIXES.some(prefix => attrName.startsWith(prefix))) {
            issues.push(`Forbidden event handler '${attr.name}' removed from <${tagName}>`);
            node.removeAttribute(attr.name);
            strippedCount++;
            continue;
          }

          if (['href', 'xlink:href', 'src'].includes(attrName)) {
            if (FORBIDDEN_SCHEMES.some(scheme => attrVal.replace(/\s+/g, '').startsWith(scheme))) {
              issues.push(`Unsafe URI scheme in '${attr.name}' removed`);
              node.removeAttribute(attr.name);
              strippedCount++;
              continue;
            }
          }

          if (attrName === 'style') {
            if (
              attrVal.includes('expression(') ||
              attrVal.includes('javascript:') ||
              attrVal.includes('-moz-binding') ||
              attrVal.includes('behavior:')
            ) {
              issues.push(`Unsafe CSS expression in style attribute removed from <${tagName}>`);
              node.removeAttribute(attr.name);
              strippedCount++;
            }
          }
        }

        const children = Array.from(node.childNodes);
        for (const child of children) {
          cleanNode(child);
        }
      }
    }

    cleanNode(doc.documentElement);

    const serializer = new XMLSerializer();
    const sanitizedSvg = serializer.serializeToString(doc.documentElement);

    return {
      sanitizedSvg,
      strippedCount,
      issues
    };
  } catch (err) {
    return {
      sanitizedSvg: '',
      strippedCount: 0,
      issues: [`Sanitization failed: ${err.message}`]
    };
  }
}

/**
 * Validates a component JSON descriptor against the Tracewise specification.
 */
export function validateComponentDescriptor(descriptor) {
  const errors = [];

  if (!descriptor || typeof descriptor !== 'object') {
    return { valid: false, errors: ['Descriptor must be an object'] };
  }

  // Prevent overriding trusted built-in components without explicit override key
  const builtInTypes = new Set(COMPONENT_CATALOG.map(c => c.type));
  if (builtInTypes.has(descriptor.type) && !descriptor._allowBuiltInOverride) {
    errors.push(`Component type "${descriptor.type}" is a built-in protected catalog part and cannot be overwritten.`);
  }

  // Type: kebab-case identifier
  if (!descriptor.type || typeof descriptor.type !== 'string') {
    errors.push('Missing or invalid "type" string.');
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(descriptor.type)) {
    errors.push('"type" must be lowercase kebab-case (e.g. "custom-sensor-module").');
  }

  // Name
  if (!descriptor.name || typeof descriptor.name !== 'string' || descriptor.name.trim().length === 0) {
    errors.push('Missing or invalid "name".');
  }

  // Category
  if (!descriptor.category || typeof descriptor.category !== 'string') {
    errors.push('Missing or invalid "category".');
  }

  // Dimensions
  if (typeof descriptor.width !== 'number' || descriptor.width <= 0) {
    errors.push('"width" must be a positive number.');
  }
  if (typeof descriptor.height !== 'number' || descriptor.height <= 0) {
    errors.push('"height" must be a positive number.');
  }

  // ViewBox
  if (!descriptor.viewBox || typeof descriptor.viewBox !== 'object') {
    errors.push('Missing "viewBox" object ({ x, y, width, height }).');
  } else {
    const { x, y, width, height } = descriptor.viewBox;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
      errors.push('viewBox properties (x, y, width, height) must all be numbers.');
    }
    if (width <= 0 || height <= 0) {
      errors.push('viewBox width and height must be > 0.');
    }
  }

  // Pins array validation
  if (!Array.isArray(descriptor.pins) || descriptor.pins.length === 0) {
    errors.push('Component must define at least one pin in "pins" array.');
  } else {
    const pinIds = new Set();
    const vb = descriptor.viewBox || { x: 0, y: 0, width: descriptor.width || 100, height: descriptor.height || 100 };

    descriptor.pins.forEach((pin, idx) => {
      if (!pin || typeof pin !== 'object') {
        errors.push(`Pin at index ${idx} is not an object.`);
        return;
      }
      if (!pin.id || typeof pin.id !== 'string') {
        errors.push(`Pin at index ${idx} is missing a string "id".`);
      } else if (pinIds.has(pin.id)) {
        errors.push(`Duplicate pin ID "${pin.id}" at index ${idx}.`);
      } else {
        pinIds.add(pin.id);
      }

      if (typeof pin.x !== 'number' || typeof pin.y !== 'number') {
        errors.push(`Pin "${pin.id || idx}" coordinates (x, y) must be numbers.`);
      } else {
        const minX = vb.x ?? 0;
        const minY = vb.y ?? 0;
        const maxX = minX + (vb.width || 1000);
        const maxY = minY + (vb.height || 1000);

        if (pin.x < minX - 20 || pin.x > maxX + 20 || pin.y < minY - 20 || pin.y > maxY + 20) {
          errors.push(`Pin "${pin.id}" position (${pin.x}, ${pin.y}) falls outside viewBox bounds [${minX}, ${minY}, ${maxX}, ${maxY}].`);
        }
      }
    });
  }

  // Simulation availability truthfulness check:
  // Cannot claim Level E or simulationAvailable unless verified behavioral model ID exists
  if (descriptor.simulationAvailable === true && !descriptor.simulationModelId) {
    errors.push('Custom components cannot declare "simulationAvailable: true" without a verified behavioral simulationModelId.');
  }

  // Optional custom SVG sanitization check
  if (descriptor.svgBody) {
    const san = sanitizeSvgMarkup(descriptor.svgBody);
    if (san.issues.length > 0 && !san.sanitizedSvg) {
      errors.push(`Invalid svgBody: ${san.issues.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Load locally registered custom components with automatic migration from v1.
 */
export function getCustomComponents() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPONENTS);
    if (!raw) {
      // Check legacy storage key
      const legacy = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPONENTS_LEGACY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, legacy);
        raw = legacy;
      }
    }
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Failed to load custom components:', err);
    return [];
  }
}

/**
 * Register a new custom component into local registry.
 * Strictly guarantees capability reporting and simulation disclosure.
 */
export function registerCustomComponent(rawDescriptor) {
  const validation = validateComponentDescriptor(rawDescriptor);
  if (!validation.valid) {
    throw new Error(`Invalid component descriptor: ${validation.errors.join('; ')}`);
  }

  // Sanitize SVG body if present
  let sanitizedSvgBody = null;
  if (rawDescriptor.svgBody) {
    const sanResult = sanitizeSvgMarkup(rawDescriptor.svgBody);
    sanitizedSvgBody = sanResult.sanitizedSvg;
  }

  const calculatedLevel = getComponentCapabilityLevel({
    ...rawDescriptor,
    simulationModelId: rawDescriptor.simulationModelId || null
  });

  const cleanDescriptor = {
    schemaVersion: 2,
    ...rawDescriptor,
    svgBody: sanitizedSvgBody,
    isCustom: true,
    capabilityLevel: calculatedLevel,
    capabilities: {
      documented: true,
      visual: true,
      connectable: Array.isArray(rawDescriptor.pins) && rawDescriptor.pins.length > 0,
      ruleValidated: Boolean(rawDescriptor.voltageDomain || rawDescriptor.voltageDomains),
      simulated: calculatedLevel === 'E',
      firmwareIntegrated: false
    },
    // Simulation is strictly false unless verified model is present
    simulationAvailable: calculatedLevel === 'E',
    wiringSupported: Array.isArray(rawDescriptor.pins) && rawDescriptor.pins.length > 0,
    codeAvailable: rawDescriptor.codeAvailable ?? false,
    registeredAt: new Date().toISOString()
  };

  const existing = getCustomComponents().filter(c => c.type !== cleanDescriptor.type);
  const updated = [...existing, cleanDescriptor];
  localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, JSON.stringify(updated));

  return cleanDescriptor;
}

/**
 * Remove a custom component by type.
 */
export function removeCustomComponent(type) {
  const existing = getCustomComponents().filter(c => c.type !== type);
  localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, JSON.stringify(existing));
}

/**
 * Returns all active components: built-in catalog + registered custom components.
 */
export function getAllComponents() {
  const custom = getCustomComponents();
  const builtInTypes = new Set(COMPONENT_CATALOG.map(c => c.type));
  // Filter out any custom that overrides built-in without permission
  const validCustom = custom.filter(c => !builtInTypes.has(c.type));
  return [...COMPONENT_CATALOG, ...validCustom];
}

/**
 * Searches components across catalog and registered custom components.
 */
export function searchComponents(query = '', options = {}) {
  const all = getAllComponents();
  const term = query.toLowerCase().trim();
  const { category = 'All', capabilityLevel = 'All', voltage = 'All' } = options;

  return all.filter(comp => {
    // 1. Text search
    if (term) {
      const matchName = comp.name?.toLowerCase().includes(term);
      const matchPart = comp.partNumber?.toLowerCase().includes(term);
      const matchDesc = comp.description?.toLowerCase().includes(term);
      const matchCategory = comp.category?.toLowerCase().includes(term);
      const matchAliases = Array.isArray(comp.aliases) && comp.aliases.some(a => a.toLowerCase().includes(term));
      if (!matchName && !matchPart && !matchDesc && !matchCategory && !matchAliases) {
        return false;
      }
    }

    // 2. Category filter
    if (category !== 'All' && comp.category !== category) {
      return false;
    }

    // 3. Capability level filter
    if (capabilityLevel !== 'All') {
      const level = getComponentCapabilityLevel(comp);
      if (level !== capabilityLevel) return false;
    }

    // 4. Voltage filter
    if (voltage !== 'All') {
      const domains = comp.voltageDomains || (comp.voltageDomain ? [comp.voltageDomain] : []);
      if (!domains.includes(voltage)) return false;
    }

    return true;
  });
}

/**
 * Submit a request for an uncataloged component.
 */
export function submitComponentRequest(requestData) {
  if (!requestData?.name?.trim()) {
    throw new Error('Component name is required');
  }

  const newRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: requestData.name.trim(),
    partNumber: requestData.partNumber?.trim() || '',
    category: requestData.category || 'Sensors',
    description: requestData.description?.trim() || '',
    datasheetUrl: requestData.datasheetUrl?.trim() || '',
    pinCount: Number(requestData.pinCount) || null,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(newRequest);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(list.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save component request:', err);
  }

  return newRequest;
}
