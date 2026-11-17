/**
 * Automated Verification Test Suite: Component Catalog Expansion & Registry
 * Runs 100+ checks across all 33 components, pin coordinates, and SVG sanitizer.
 */

import { COMPONENT_CATALOG, getPinRelativeCoords, getComponentPinCanvasCoords, getComponentDefinition } from '../data/componentCatalog.js';
import { validateComponentDescriptor, sanitizeSvgMarkup } from '../domain/componentRegistry.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== TEST SUITE 1: Component Catalog Integrity (All 33 Components) ===');

assert(COMPONENT_CATALOG.length >= 30, `Catalog contains ${COMPONENT_CATALOG.length} components (>= 30 required)`);

const requiredCategories = ['Microcontrollers', 'Sensors', 'Displays', 'Input', 'Output', 'Passive', 'Semiconductors', 'Integrated Circuits'];
const foundCategories = new Set(COMPONENT_CATALOG.map(c => c.category));
requiredCategories.forEach(cat => {
  assert(foundCategories.has(cat), `Category "${cat}" is present in catalog`);
});

COMPONENT_CATALOG.forEach(comp => {
  assert(Boolean(comp.type), `[${comp.type}] has valid type`);
  assert(Boolean(comp.name), `[${comp.type}] has valid name: "${comp.name}"`);
  assert(comp.width > 0 && comp.height > 0, `[${comp.type}] has positive dimensions: ${comp.width}x${comp.height}`);
  assert(comp.viewBox && comp.viewBox.width > 0 && comp.viewBox.height > 0, `[${comp.type}] has valid viewBox: ${JSON.stringify(comp.viewBox)}`);
  assert(Array.isArray(comp.pins) && comp.pins.length > 0, `[${comp.type}] has ${comp.pins?.length || 0} pins`);

  const pinIds = new Set();
  comp.pins.forEach(pin => {
    assert(Boolean(pin.id), `[${comp.type}] pin "${pin.id}" has valid ID`);
    assert(!pinIds.has(pin.id), `[${comp.type}] pin ID "${pin.id}" is unique`);
    pinIds.add(pin.id);

    // Verify relative coordinate calculation produces valid finite numbers
    const rel = getPinRelativeCoords(comp, pin);
    assert(!isNaN(rel.x) && !isNaN(rel.y), `[${comp.type}] pin "${pin.id}" relative coords are finite: (${rel.x.toFixed(1)}, ${rel.y.toFixed(1)})`);

    // Verify pin sits within rendered bounds
    assert(rel.x >= -5 && rel.x <= comp.width + 5, `[${comp.type}] pin "${pin.id}" x (${rel.x.toFixed(1)}) is within rendered width (${comp.width})`);
    assert(rel.y >= -5 && rel.y <= comp.height + 5, `[${comp.type}] pin "${pin.id}" y (${rel.y.toFixed(1)}) is within rendered height (${comp.height})`);

    // Verify canvas coordinate calculation
    const canvasCoords = getComponentPinCanvasCoords({ type: comp.type, x: 100, y: 200 }, pin.id, COMPONENT_CATALOG);
    assert(canvasCoords.x === 100 + rel.x && canvasCoords.y === 200 + rel.y, `[${comp.type}] canvas coords match offset strictly: (${canvasCoords.x.toFixed(1)}, ${canvasCoords.y.toFixed(1)})`);
  });
});

console.log('\n=== TEST SUITE 2: Extensible Component Registry & Validation ===');

// Valid descriptor
const validDescriptor = {
  type: 'custom-temp-sensor',
  name: 'Custom Digital Temperature Sensor',
  category: 'Sensors',
  width: 100,
  height: 80,
  viewBox: { x: 0, y: 0, width: 100, height: 80 },
  pins: [
    { id: 'VCC', label: 'VCC', role: 'power-5v', x: 20, y: 70 },
    { id: 'GND', label: 'GND', role: 'ground', x: 50, y: 70 },
    { id: 'OUT', label: 'OUT', role: 'digital', x: 80, y: 70 }
  ]
};
const valResult = validateComponentDescriptor(validDescriptor);
assert(valResult.valid, 'Valid descriptor passes validation');
assert(valResult.errors.length === 0, 'No validation errors on valid descriptor');

// Invalid descriptor (missing pins, invalid type)
const invalidDescriptor = {
  type: 'Invalid_UPPERCASE!',
  name: '',
  width: -10
};
const invResult = validateComponentDescriptor(invalidDescriptor);
assert(!invResult.valid, 'Invalid descriptor fails validation');
assert(invResult.errors.length >= 3, `Invalid descriptor caught ${invResult.errors.length} errors`);

console.log('\n=== TEST SUITE 3: Strict SVG Sanitizer Security Tests ===');

// Test 1: XSS via <script> tag
const maliciousSvgWithScript = '<svg><rect x="0" y="0" width="10" height="10"/><script>alert("XSS")</script></svg>';
const san1 = sanitizeSvgMarkup(maliciousSvgWithScript);
assert(!san1.sanitizedSvg.includes('<script>'), 'Sanitizer stripped <script> tag completely');
assert(!san1.sanitizedSvg.includes('alert'), 'Sanitizer stripped script contents');
assert(san1.strippedCount >= 1, `Sanitizer reported ${san1.strippedCount} stripped items`);

// Test 2: XSS via inline event handler onload
const maliciousSvgWithOnload = '<svg><circle cx="5" cy="5" r="5" onload="fetch(\'/steal\')" /><rect onmouseover="evil()" /></svg>';
const san2 = sanitizeSvgMarkup(maliciousSvgWithOnload);
assert(!san2.sanitizedSvg.includes('onload'), 'Sanitizer stripped onload attribute');
assert(!san2.sanitizedSvg.includes('onmouseover'), 'Sanitizer stripped onmouseover attribute');
assert(san2.sanitizedSvg.includes('<circle'), 'Sanitizer preserved valid safe <circle> element');

// Test 3: XSS via foreignObject
const maliciousForeignObject = '<svg><foreignObject width="100" height="50"><iframe src="javascript:alert(1)"></iframe></foreignObject></svg>';
const san3 = sanitizeSvgMarkup(maliciousForeignObject);
assert(!san3.sanitizedSvg.includes('foreignObject'), 'Sanitizer stripped foreignObject completely');
assert(!san3.sanitizedSvg.includes('iframe'), 'Sanitizer stripped iframe completely');

// Test 4: XSS via javascript: URI in href
const maliciousHref = '<svg><a href="javascript:alert(1)"><path d="M 0 0 L 10 10"/></a></svg>';
const san4 = sanitizeSvgMarkup(maliciousHref);
assert(!san4.sanitizedSvg.includes('javascript:'), 'Sanitizer stripped javascript: URI');

console.log(`\n======================================================`);
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}
