/**
 * Tracewise Extensible Electronic Component Registry
 * Strict schema validation, DOMParser-based SVG sanitization, and runtime registry.
 */

import { COMPONENT_CATALOG } from '../data/componentCatalog.js';

const STORAGE_KEY_CUSTOM_COMPONENTS = 'tracewise_custom_components_v1';
const STORAGE_KEY_REQUESTS = 'tracewise_component_requests_v1';

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
    // Parse wrapped in an SVG root if not already rooted
    let toParse = rawSvg.trim();
    if (!toParse.toLowerCase().startsWith('<svg')) {
      toParse = `<svg xmlns="http://www.w3.org/2000/svg">${toParse}</svg>`;
    }

    const doc = parser.parseFromString(toParse, 'image/svg+xml');

    // Check for XML parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        sanitizedSvg: '',
        strippedCount: 0,
        issues: [`XML syntax error: ${parserError.textContent.slice(0, 100)}`]
      };
    }

    // Recursively clean node tree
    function cleanNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // 1. Tag name validation
        if (!ALLOWED_SVG_TAGS.has(tagName)) {
          issues.push(`Forbidden tag <${tagName}> removed`);
          strippedCount++;
          node.parentNode?.removeChild(node);
          return;
        }

        // 2. Attribute validation
        const attrs = Array.from(node.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          const attrVal = attr.value.trim().toLowerCase();

          // Reject inline event handlers (onload, onerror, etc.)
          if (FORBIDDEN_ATTR_PREFIXES.some(prefix => attrName.startsWith(prefix))) {
            issues.push(`Forbidden event handler '${attr.name}' removed from <${tagName}>`);
            node.removeAttribute(attr.name);
            strippedCount++;
            continue;
          }

          // Reject javascript: or unsafe URI schemes in href / xlink:href / src
          if (['href', 'xlink:href', 'src'].includes(attrName)) {
            if (FORBIDDEN_SCHEMES.some(scheme => attrVal.replace(/\s+/g, '').startsWith(scheme))) {
              issues.push(`Unsafe URI scheme in '${attr.name}' removed`);
              node.removeAttribute(attr.name);
              strippedCount++;
              continue;
            }
          }

          // Sanitize style attribute
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

        // Recursively clean child elements (using childNodes snapshot)
        const children = Array.from(node.childNodes);
        for (const child of children) {
          cleanNode(child);
        }
      }
    }

    cleanNode(doc.documentElement);

    // Extract sanitized inner or outer markup
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

  // Pins array
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
        // Warning / bounds check against viewBox
        const minX = vb.x ?? 0;
        const minY = vb.y ?? 0;
        const maxX = minX + (vb.width || 1000);
        const maxY = minY + (vb.height || 1000);

        if (pin.x < minX - 10 || pin.x > maxX + 10 || pin.y < minY - 10 || pin.y > maxY + 10) {
          errors.push(`Pin "${pin.id}" position (${pin.x}, ${pin.y}) falls outside viewBox bounds [${minX}, ${minY}, ${maxX}, ${maxY}].`);
        }
      }
    });
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
 * Load locally registered custom components.
 */
export function getCustomComponents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPONENTS);
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

  const cleanDescriptor = {
    ...rawDescriptor,
    svgBody: sanitizedSvgBody,
    isCustom: true,
    wiringSupported: true,
    codeAvailable: rawDescriptor.codeAvailable ?? true,
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
  // Filter out any custom that overrides built-in, or allow custom precedence
  const validCustom = custom.filter(c => !builtInTypes.has(c.type));
  return [...COMPONENT_CATALOG, ...validCustom];
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

/**
 * Get all submitted component requests.
 */
export function getComponentRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}
