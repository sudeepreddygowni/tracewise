/**
 * TraceWise — Pre-Recording Bug Fixes Verification Test Suite
 * Validates:
 * 1. Centralized Pin-to-Canvas Coordinate Conversion & SVG viewBox Scaling across all 10 components.
 * 2. Component Library independent scrollability, overscroll isolation, and minHeight containment.
 * 3. Modern favicon suite (favicon.ico, favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png).
 * 4. Recording-ready demonstration project (Arduino Uno + 5mm LED + 220Ω Resistor + Blink C++ firmware).
 */

import fs from 'fs';
import path from 'path';
import {
  COMPONENT_CATALOG,
  getComponentDefinition,
  getPinRelativeCoords,
  getComponentPinCanvasCoords
} from '../data/componentCatalog.js';
import { STARTER_PROJECTS } from '../data/starterProjects.js';
import { validateCircuit } from '../domain/circuitRules.js';

console.log('=== TRACEWISE PRE-RECORDING BUG FIXES VERIFICATION ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------
// TEST SUITE 1: CENTRALIZED PIN COORDINATE MAPPING ACROSS ALL 10 COMPONENTS
// ---------------------------------------------------------------------
console.log('1. Verifying Pin Coordinate Conversion & SVG viewBox Scaling...');

assert(typeof getPinRelativeCoords === 'function', 'getPinRelativeCoords helper function is exported');
assert(typeof getComponentPinCanvasCoords === 'function', 'getComponentPinCanvasCoords helper function is exported');

const allTypes = [
  'arduino-uno',
  'breadboard-half',
  'led',
  'resistor',
  'push-button',
  'rgb-led',
  'potentiometer',
  'photoresistor',
  'slide-switch',
  'buzzer'
];

allTypes.forEach(type => {
  const def = getComponentDefinition(type);
  assert(!!def, `Catalog entry exists for "${type}"`);
  assert(!!def?.viewBox, `Component "${type}" has explicit viewBox definition`);
  assert(typeof def?.viewBox?.width === 'number' && typeof def?.viewBox?.height === 'number', `Component "${type}" viewBox has width/height numbers`);
});

// Deep check for Arduino Uno viewBox scaling (380x280 viewBox mapped to 300x220 rendered viewport)
const unoDef = getComponentDefinition('arduino-uno');
const unoComp = { id: 'uno-test', type: 'arduino-uno', x: 60, y: 120 };

// Expected scale = min(300/380, 220/280) = 220/280 = 0.7857142857142857
// Expected alignX = (300 - 380 * (220/280)) / 2 = 0.7142857142857143
// Expected alignY = 0

// Test pin D13 (viewBox x: 150, y: 14)
const d13Pin = unoDef.pins.find(p => p.id === 'D13');
const d13Rel = getPinRelativeCoords(unoDef, d13Pin);
const d13Canvas = getComponentPinCanvasCoords(unoComp, 'D13');

const expectedD13LocalX = 0.7142857142857143 + 150 * (220 / 280); // ~118.57
const expectedD13LocalY = 14 * (220 / 280); // 11.00

assert(Math.abs(d13Rel.x - expectedD13LocalX) < 0.01, `Arduino D13 local X correctly scaled: ${d13Rel.x.toFixed(2)}px (expected ~${expectedD13LocalX.toFixed(2)}px)`);
assert(Math.abs(d13Rel.y - expectedD13LocalY) < 0.01, `Arduino D13 local Y correctly scaled: ${d13Rel.y.toFixed(2)}px (expected ~${expectedD13LocalY.toFixed(2)}px)`);
assert(Math.abs(d13Canvas.x - (60 + expectedD13LocalX)) < 0.01, `Arduino D13 canvas X anchored to visible pin center: ${d13Canvas.x.toFixed(2)}px`);
assert(Math.abs(d13Canvas.y - (120 + expectedD13LocalY)) < 0.01, `Arduino D13 canvas Y anchored to visible pin center: ${d13Canvas.y.toFixed(2)}px`);

// Test pin D2 (viewBox x: 320, y: 14)
const d2Pin = unoDef.pins.find(p => p.id === 'D2');
const d2Rel = getPinRelativeCoords(unoDef, d2Pin);
const expectedD2LocalX = 0.7142857142857143 + 320 * (220 / 280); // ~252.14
assert(Math.abs(d2Rel.x - expectedD2LocalX) < 0.01, `Arduino D2 local X correctly scaled: ${d2Rel.x.toFixed(2)}px (expected ~${expectedD2LocalX.toFixed(2)}px)`);

// Test pin GND_TOP (viewBox x: 135, y: 14)
const gndTopPin = unoDef.pins.find(p => p.id === 'GND_TOP');
const gndTopRel = getPinRelativeCoords(unoDef, gndTopPin);
const expectedGndTopLocalX = 0.7142857142857143 + 135 * (220 / 280); // ~106.79
assert(Math.abs(gndTopRel.x - expectedGndTopLocalX) < 0.01, `Arduino GND_TOP local X correctly scaled: ${gndTopRel.x.toFixed(2)}px`);

// Test 1:1 mapping on 5mm LED
const ledDef = getComponentDefinition('led');
const ledComp = { id: 'led-test', type: 'led', x: 480, y: 120 };
const anodePin = ledDef.pins.find(p => p.id === 'anode');
const anodeRel = getPinRelativeCoords(ledDef, anodePin);
const anodeCanvas = getComponentPinCanvasCoords(ledComp, 'anode');
assert(anodeRel.x === 18 && anodeRel.y === 60, `LED Anode local coordinates match 1:1: (${anodeRel.x}, ${anodeRel.y})`);
assert(anodeCanvas.x === 498 && anodeCanvas.y === 180, `LED Anode canvas coordinates match: (498, 180)`);

// Test 1:1 mapping on 220Ω Resistor
const resDef = getComponentDefinition('resistor');
const resComp = { id: 'res-test', type: 'resistor', x: 580, y: 135 };
const lead1Pin = resDef.pins.find(p => p.id === 'lead1');
const lead1Canvas = getComponentPinCanvasCoords(resComp, 'lead1');
assert(lead1Canvas.x === 586 && lead1Canvas.y === 153, `Resistor lead1 canvas coordinates match: (586, 153)`);

// ---------------------------------------------------------------------
// TEST SUITE 2: COMPONENT LIBRARY SCROLL CHAIN & CONTAINMENT
// ---------------------------------------------------------------------
console.log('\n2. Verifying Component Library Scroll Chain & Containment...');

const compLibCode = fs.readFileSync(path.resolve('src/components/studio/ComponentLibrary.jsx'), 'utf-8');
const studioPageCode = fs.readFileSync(path.resolve('src/pages/StudioPage.jsx'), 'utf-8');

assert(compLibCode.includes('overflowY: \'auto\''), 'ComponentLibrary catalog list specifies overflowY: "auto"');
assert(compLibCode.includes('flex: \'1 1 0%\''), 'ComponentLibrary catalog list specifies flex: "1 1 0%" for bounded height');
assert(compLibCode.includes('overscrollBehavior: \'contain\''), 'ComponentLibrary catalog list specifies overscrollBehavior: "contain" to prevent canvas scroll leakage');
assert(compLibCode.includes('onWheel={(e) => e.stopPropagation()}'), 'ComponentLibrary stops wheel event propagation so mouse wheel never pans/zooms canvas');
assert(compLibCode.includes('minHeight: 0'), 'ComponentLibrary includes minHeight: 0 in flex height chain');

assert(studioPageCode.includes('minHeight: 0'), 'StudioPage studio-col-left specifies minHeight: 0');
assert(studioPageCode.includes('overflow: \'hidden\''), 'StudioPage studio-col-left specifies overflow: "hidden"');

// ---------------------------------------------------------------------
// TEST SUITE 3: FAVICON ASSETS & HTML HEAD REFERENCES
// ---------------------------------------------------------------------
console.log('\n3. Verifying Favicon Assets & HTML Head References...');

assert(fs.existsSync(path.resolve('public/favicon.ico')), 'public/favicon.ico exists');
assert(fs.existsSync(path.resolve('public/favicon-32x32.png')), 'public/favicon-32x32.png exists');
assert(fs.existsSync(path.resolve('public/favicon-16x16.png')), 'public/favicon-16x16.png exists');
assert(fs.existsSync(path.resolve('public/apple-touch-icon.png')), 'public/apple-touch-icon.png exists');
assert(fs.existsSync(path.resolve('public/assets/brand/tracewise-mark.png')), 'public/assets/brand/tracewise-mark.png exists');

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
assert(indexHtml.includes('/favicon.ico'), 'index.html references /favicon.ico');
assert(indexHtml.includes('/favicon-32x32.png'), 'index.html references /favicon-32x32.png');
assert(indexHtml.includes('/apple-touch-icon.png'), 'index.html references /apple-touch-icon.png');
assert(indexHtml.includes('?v='), 'index.html includes cache-busting query parameter for favicons');

// ---------------------------------------------------------------------
// TEST SUITE 4: RECORDING-READY DEMONSTRATION PROJECT
// ---------------------------------------------------------------------
console.log('\n4. Verifying Recording-Ready Demonstration Project...');

const blinkProject = STARTER_PROJECTS.find(p => p.id === 'starter-led-blink');
assert(!!blinkProject, 'starter-led-blink project exists in starterProjects');
assert(blinkProject.components.some(c => c.type === 'arduino-uno'), 'Demo project contains Arduino Uno R3');
assert(blinkProject.components.some(c => c.type === 'led'), 'Demo project contains 5mm LED');
assert(blinkProject.components.some(c => c.type === 'resistor'), 'Demo project contains 220Ω current-limiting resistor');

// Check wire connections
const d13Wire = blinkProject.connections.find(w => w.from.pinId === 'D13' && w.to.pinId === 'anode');
assert(!!d13Wire, 'Wire connects Arduino pin D13 to LED Anode');

const ledResWire = blinkProject.connections.find(w => w.from.pinId === 'cathode' && w.to.pinId === 'lead1');
assert(!!ledResWire, 'Wire connects LED Cathode to Resistor lead1');

const resGndWire = blinkProject.connections.find(w => w.from.pinId === 'lead2' && (w.to.pinId === 'GND' || w.to.pinId === 'GND_TOP'));
assert(!!resGndWire, 'Wire connects Resistor lead2 to Arduino Ground');

// Check firmware
assert(blinkProject.firmware?.files?.[0]?.content?.includes('pinMode(13, OUTPUT)'), 'Firmware configures pin 13 as OUTPUT');
assert(blinkProject.firmware?.files?.[0]?.content?.includes('digitalWrite(13, HIGH)'), 'Firmware blinks pin 13 HIGH');

// Check deterministic structural validation
const validation = validateCircuit(blinkProject);
assert(validation.overallStatus === 'STRUCTURALLY_VALID', `Circuit validation status is STRUCTURALLY_VALID (got "${validation.overallStatus}")`);
const ledProtectionCheck = validation.checks.find(c => c.id === 'check-led-current');
assert(ledProtectionCheck?.status === 'PASSED', 'LED Current Protection rule check passes');

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
if (passedTests === totalTests) {
  console.log('🎉 ALL PRE-RECORDING BUG FIX CHECKS PASSED SUCCESSFULLY!\n');
} else {
  console.error('❌ SOME CHECKS FAILED!\n');
  process.exit(1);
}
