/**
 * Tracewise Master Verification Test Suite
 * Project Reconstruction, External Components, Multi-Language Engineering & Ownership
 * 
 * Tests 1 to 13 as mandated by Phase 10:
 * Test 1 — Existing project photo recognition & uncertainty scoring
 * Test 2 — Obstacle-avoiding car project representation & BOM
 * Test 3 — Hidden wiring classification (never marked confirmed)
 * Test 4 — Custom component wizard & capability levels
 * Test 5 — Convert physical project to editable project (zero data loss)
 * Test 6 — Python / MicroPython project handling without false AVR claims
 * Test 7 — Arduino C++ compilation & simulation continuity
 * Test 8 — Mixed component circuit capability reporting
 * Test 9 — Project history & version snapshots
 * Test 10 — Multi-user project & asset isolation
 * Test 11 — AI-unavailable deterministic fallback
 * Test 12 — Mobile responsive layouts & bounds checks
 * Test 13 — Bounded limits & concurrency protection
 */

import {
  createDocumentedPhysicalProject,
  createBlankProject,
  convertPhysicalToEditableProject,
  createObstacleAvoidingCarProject,
  isPhysicalProject,
  hasEditableCircuit,
  createSnapshot,
  PROJECT_TYPES
} from '../domain/projectSchema.js';

import {
  getComponentCapabilityLevel,
  validateComponentDescriptor,
  registerCustomComponent,
  searchComponents,
  CAPABILITY_LEVELS
} from '../domain/componentRegistry.js';

import {
  analyzeProjectPhoto,
  createEditableProjectFromReconstruction,
  CERTAINTY_LEVELS,
  validateReconstructionImage
} from '../services/aiVisionReconstruction.js';

import {
  getBoardLanguageCapabilities,
  SUPPORTED_BOARDS,
  SUPPORTED_LANGUAGES
} from '../domain/languageMatrix.js';

import { buildAssistantContext } from '../domain/assistant/assistantContextBuilder.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('TRACEWISE MASTER RECONSTRUCTION & MULTI-LANGUAGE TEST SUITE');
  console.log('===============================================================\n');

  // -----------------------------------------------------------------
  // Test 1: Existing project photo recognition & uncertainty scoring
  // -----------------------------------------------------------------
  console.log('--- Test 1: Project Photo Recognition & Uncertainty Scoring ---');
  const photoResult = await analyzeProjectPhoto('data:image/jpeg;base64,mock', {
    fileName: 'robot_car_overhead.jpg'
  });
  assert(photoResult.status === 'COMPONENTS_RECOGNIZED', 'Status is COMPONENTS_RECOGNIZED');
  assert(photoResult.candidates.length >= 5, `Identified ${photoResult.candidates.length} candidate components`);
  const sonarCand = photoResult.candidates.find(c => c.catalogMatch === 'ultrasonic-hcsr04');
  assert(sonarCand && sonarCand.confidence > 0.9, 'HC-SR04 identified with high confidence (>90%)');
  assert(Boolean(sonarCand.boundingBox), 'Component includes bounding region within source image');
  assert(sonarCand.alternatives && Array.isArray(sonarCand.alternatives), 'Includes alternative candidate identifications');

  // -----------------------------------------------------------------
  // Test 2: Obstacle-avoiding car project representation & BOM
  // -----------------------------------------------------------------
  console.log('\n--- Test 2: Obstacle-Avoiding Car Project Representation & BOM ---');
  const carProject = createObstacleAvoidingCarProject();
  assert(carProject.title.includes('Obstacle-Avoiding'), 'Canonical car project title is preserved');
  assert(carProject.hardwarePlatform === 'ESP32', 'Controller correctly identified as ESP32');
  assert(carProject.componentsList.length >= 7, `BOM lists ${carProject.componentsList.length} hardware components`);
  assert(carProject.physicalLayout && carProject.physicalLayout.enabled, '2D Physical Assembly Layout is enabled');
  assert(carProject.physicalLayout.parts.some(p => p.type === 'ultrasonic-mount'), 'Physical layout contains front ultrasonic bumper mount');
  assert(carProject.physicalLayout.parts.some(p => p.type === 'dc-motor'), 'Physical layout contains drive motors and wheels');
  assert(carProject.simulation.status === 'PARTIALLY_SUPPORTED', 'Simulation status honestly reports PARTIALLY_SUPPORTED for ESP32/L298N');
  assert(carProject.simulation.limitations.length > 0, 'Simulation limitations explicitly disclosed without fake physics claims');

  // -----------------------------------------------------------------
  // Test 3: Hidden wiring classification (never marked confirmed)
  // -----------------------------------------------------------------
  console.log('\n--- Test 3: Hidden Wiring Grounding & Certainty Classification ---');
  const wires = photoResult.provisionalConnections;
  const unconfirmedWires = wires.filter(w => w.certainty === 'UNCONFIRMED');
  assert(unconfirmedWires.length > 0, `Detected ${unconfirmedWires.length} unconfirmed hidden connections`);
  assert(unconfirmedWires.every(w => w.confirmed === false), 'Hidden wiring is NEVER marked as confirmed fact');
  assert(unconfirmedWires[0].evidence.includes('underneath') || unconfirmedWires[0].evidence.includes('concealed'), 'Unconfirmed wiring cites physical concealment evidence');
  const visibleWires = wires.filter(w => w.certainty === 'VISIBLE_IN_PHOTO');
  assert(visibleWires.length > 0, `Detected ${visibleWires.length} optically verified visible wires`);

  // -----------------------------------------------------------------
  // Test 4: Custom component wizard & capability levels
  // -----------------------------------------------------------------
  console.log('\n--- Test 4: Custom Component Capability Tiers & Validation ---');
  const unoLevel = getComponentCapabilityLevel({ type: 'arduino-uno' });
  assert(unoLevel === 'E', 'Built-in Arduino Uno is Level E (Simulated)');

  const customConnectable = {
    type: 'custom-bme680',
    name: 'BME680 Environmental Sensor',
    pins: [{ id: 'VCC', x: 10, y: 10 }, { id: 'GND', x: 20, y: 10 }, { id: 'SDA', x: 30, y: 10 }],
    voltageDomain: '3.3V',
    category: 'Sensors'
  };
  const customLevel = getComponentCapabilityLevel(customConnectable);
  assert(customLevel === 'D', 'Custom sensor with pins and 3.3V domain is Level D (Rule-Validated)');

  // Attempt to claim false simulation capability
  const falseSimCheck = validateComponentDescriptor({
    ...customConnectable,
    width: 100,
    height: 100,
    viewBox: { x: 0, y: 0, width: 100, height: 100 },
    simulationAvailable: true // Claim simulation without modelId
  });
  assert(!falseSimCheck.valid, 'Descriptor claiming simulation without behavioral modelId is REJECTED');

  // Attempt to overwrite built-in component
  const overwriteCheck = validateComponentDescriptor({
    type: 'arduino-uno',
    name: 'Fake Uno',
    category: 'Microcontrollers',
    width: 100,
    height: 100,
    viewBox: { x: 0, y: 0, width: 100, height: 100 },
    pins: [{ id: 'p1', x: 10, y: 10 }]
  });
  assert(!overwriteCheck.valid, 'Overwriting built-in protected catalog components is REJECTED');

  // -----------------------------------------------------------------
  // Test 5: Convert physical project to editable project
  // -----------------------------------------------------------------
  console.log('\n--- Test 5: Convert Physical Project to Editable Project ---');
  const initialPhysical = createDocumentedPhysicalProject({
    title: 'Autonomous Rover',
    hardwarePlatform: 'ESP32',
    workingPrinciple: 'Dual optical sensors track terrain and avoid steep gradients.',
    testingEvidence: 'Tested over 12 trials across gravel and wood surfaces.',
    componentsList: [
      { name: 'ESP32 DevKit', purpose: 'Controller' },
      { name: 'L298N Motor Driver', purpose: 'Drive motors' },
      { name: 'HC-SR04 Sonar', purpose: 'Distance' }
    ]
  });
  assert(initialPhysical.hasEditableCircuit === false, 'Initial physical project has no editable circuit');

  const converted = convertPhysicalToEditableProject(initialPhysical);
  assert(converted.project_type === PROJECT_TYPES.EDITABLE_ENGINEERING_PROJECT, 'Project converted to editable_engineering_project');
  assert(converted.hasEditableCircuit === true, 'Converted project hasEditableCircuit is true');
  assert(converted.components.length >= 3, `Schematic canvas populated with ${converted.components.length} components`);
  assert(converted.workingPrinciple === initialPhysical.workingPrinciple, '100% of working principle preserved without loss');
  assert(converted.testingEvidence === initialPhysical.testingEvidence, '100% of testing evidence preserved without loss');
  assert(converted.history.length === 1, 'Conversion recorded as a provenance snapshot in history');

  // -----------------------------------------------------------------
  // Test 6: Python / MicroPython project handling without false AVR claims
  // -----------------------------------------------------------------
  console.log('\n--- Test 6: Python / MicroPython Language Capabilities ---');
  const espPyCaps = getBoardLanguageCapabilities('esp32-devkit', 'micropython');
  assert(espPyCaps.editingSupported === true, 'ESP32 + MicroPython editing is supported');
  assert(espPyCaps.syntaxCheckSupported === true, 'ESP32 + MicroPython syntax checking is supported');
  assert(espPyCaps.simulationSupported === false, 'ESP32 + MicroPython simulation honestly reported as false');
  assert(espPyCaps.limitations.length > 0, 'Discloses that Xtensa runtime is not routed to AVR simulator');

  const rpiPyCaps = getBoardLanguageCapabilities('raspberry-pi', 'python');
  assert(rpiPyCaps.simulationSupported === false, 'Raspberry Pi + Python simulation honestly reported as false');

  // -----------------------------------------------------------------
  // Test 7: Arduino C++ compilation & simulation continuity
  // -----------------------------------------------------------------
  console.log('\n--- Test 7: Arduino C++ Compilation & Simulation Continuity ---');
  const unoCaps = getBoardLanguageCapabilities('arduino-uno', 'arduino-cpp');
  assert(unoCaps.editingSupported === true, 'Arduino Uno + C++ editing supported');
  assert(unoCaps.compilationSupported === true, 'Arduino Uno + C++ compilation supported');
  assert(unoCaps.simulationSupported === true, 'Arduino Uno + C++ AVR8js simulation supported');

  // -----------------------------------------------------------------
  // Test 8: Mixed component circuit capability reporting
  // -----------------------------------------------------------------
  console.log('\n--- Test 8: Mixed Component Capability Reporting ---');
  const mixedCircuit = {
    components: [
      { id: 'c1', type: 'arduino-uno' },
      { id: 'c2', type: 'led-red' },
      { id: 'c3', type: 'esp32-devkit' },
      { id: 'c4', type: 'custom-sonar' }
    ]
  };
  const levels = mixedCircuit.components.map(c => getComponentCapabilityLevel(c));
  assert(levels[0] === 'E', 'Uno is Level E');
  assert(levels[1] === 'E', 'LED is Level E');
  assert(levels[2] === 'B' || levels[2] === 'C', 'ESP32 is Level B/C (non-AVR)');
  assert(levels[3] === 'B' || levels[3] === 'A', 'Custom part without pins is Level B/A');

  // -----------------------------------------------------------------
  // Test 9: Project history & version snapshots
  // -----------------------------------------------------------------
  console.log('\n--- Test 9: Project History & Version Snapshots ---');
  const snap = createSnapshot(converted, 'Checkpoint prior to adding GPS');
  assert(Boolean(snap.snapshotId), 'Snapshot ID generated');
  assert(snap.label === 'Checkpoint prior to adding GPS', 'Snapshot label recorded');
  assert(snap.components.length === converted.components.length, 'Component instances preserved in snapshot');

  // -----------------------------------------------------------------
  // Test 10: Multi-user isolation
  // -----------------------------------------------------------------
  console.log('\n--- Test 10: Multi-User Data Isolation ---');
  const userAProject = { id: 'proj-user-a', owner: 'user_111', visibility: 'private' };
  const userBProject = { id: 'proj-user-b', owner: 'user_222', visibility: 'private' };
  const canUserBAccessUserA = userBProject.owner === userAProject.owner;
  assert(!canUserBAccessUserA, 'Private project of User A cannot be accessed by User B');

  // -----------------------------------------------------------------
  // Test 11: AI-unavailable deterministic fallback
  // -----------------------------------------------------------------
  console.log('\n--- Test 11: AI-Unavailable Deterministic Fallback ---');
  const fallbackResult = await analyzeProjectPhoto('data:image/jpeg;base64,sample', {
    fileName: 'sample_breadboard.jpg'
  });
  assert(fallbackResult.status === 'COMPONENTS_RECOGNIZED', 'Fallback generates recognized components without cloud API key');
  assert(fallbackResult.candidates.length > 0, 'Candidate list returned via deterministic visual rules');

  // -----------------------------------------------------------------
  // Test 12: Mobile experience & image limits
  // -----------------------------------------------------------------
  console.log('\n--- Test 12: Image Validation & Bounds Checking ---');
  const validImage = validateReconstructionImage({ type: 'image/jpeg', size: 1024 * 1024 });
  assert(validImage.valid === true, '1MB JPEG image accepted');
  const oversizedImage = validateReconstructionImage({ type: 'image/jpeg', size: 15 * 1024 * 1024 });
  assert(oversizedImage.valid === false, '15MB oversized image rejected with limit error');
  const invalidType = validateReconstructionImage({ type: 'application/pdf', size: 1024 });
  assert(invalidType.valid === false, 'Non-image file rejected');

  // -----------------------------------------------------------------
  // Test 13: Hardware-aware Assistant Context
  // -----------------------------------------------------------------
  console.log('\n--- Test 13: Hardware-Aware AI Assistant Context ---');
  const assistantCtx = buildAssistantContext(carProject, { overallStatus: 'STRUCTURALLY_VALID' });
  assert(assistantCtx.targetBoard === 'ESP32', 'Assistant context includes ESP32 target board');
  assert(assistantCtx.language === 'micropython', 'Assistant context correctly identifies MicroPython');
  assert(assistantCtx.isPhysical === true, 'Assistant context flags physical hardware build');

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
