/**
 * TraceWise — Production Readiness & Release Verification Test Suite
 */

import { COMPONENT_CATALOG, getComponentDefinition } from '../data/componentCatalog.js';
import { validateCircuit } from '../domain/circuitRules.js';
import { validateBuildPlan } from '../domain/projectBuilder/buildPlanSchema.js';
import {
  createDiscoLightBuildPlan,
  createRgbMoodLightBuildPlan,
  createPotentiometerDimmerBuildPlan,
  createBuzzerAlarmBuildPlan
} from '../domain/projectBuilder/projectTemplates.js';
import { compileBuildPlan } from '../domain/projectBuilder/catalogCompiler.js';
import { answerAssistantQuery } from '../domain/assistant/deterministicAssistantEngine.js';
import { detectUnsupportedHardware, planProjectFromPrompt } from '../domain/projectBuilder/projectPlanner.js';
import { searchCommunity, getCommunityGroups, getPublishedProjects } from '../services/communityService.js';

console.log('=== TRACEWISE PRODUCTION READINESS VERIFICATION ===\n');

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

// -------------------------------------------------------------
// TEST SUITE 1: COMPONENT CATALOG EXPANSION
// -------------------------------------------------------------
console.log('1. Verifying Component Catalog (10 components total)...');
const requiredTypes = [
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

assert(COMPONENT_CATALOG.length >= 10, `Catalog contains at least 10 components (found ${COMPONENT_CATALOG.length})`);

requiredTypes.forEach(type => {
  const def = getComponentDefinition(type);
  assert(!!def, `Component definition exists for "${type}"`);
  assert(Array.isArray(def?.pins) && def.pins.length > 0, `Component "${type}" has valid pins defined (${def?.pins?.length} pins)`);
  assert(Array.isArray(def?.aliases) && def.aliases.length > 0, `Component "${type}" has search aliases`);
});

// -------------------------------------------------------------
// TEST SUITE 2: BUILD PLAN COMPILATION & TEMPLATES
// -------------------------------------------------------------
console.log('\n2. Verifying Build Plans & Template Compilation...');

const discoPlan = createDiscoLightBuildPlan();
const valDisco = validateBuildPlan(discoPlan);
assert(valDisco.valid, 'Disco Light build plan adheres to strict schema');
const compDisco = compileBuildPlan(discoPlan);
assert(compDisco.project.components.length === 11, `Disco Light compiles 11 components (got ${compDisco.project.components.length})`);
assert(compDisco.project.connections.length === 15, `Disco Light compiles 15 wires (got ${compDisco.project.connections.length})`);

const rgbPlan = createRgbMoodLightBuildPlan();
const valRgb = validateBuildPlan(rgbPlan);
assert(valRgb.valid, 'RGB Mood Light build plan is schema-valid');
const compRgb = compileBuildPlan(rgbPlan);
assert(compRgb.project.components.some(c => c.type === 'rgb-led'), 'RGB Mood Light contains rgb-led');

const potPlan = createPotentiometerDimmerBuildPlan();
const valPot = validateBuildPlan(potPlan);
assert(valPot.valid, 'Potentiometer Dimmer build plan is schema-valid');

const buzzerPlan = createBuzzerAlarmBuildPlan();
const valBuzzer = validateBuildPlan(buzzerPlan);
assert(valBuzzer.valid, 'Buzzer Alarm build plan is schema-valid');

// -------------------------------------------------------------
// TEST SUITE 3: STATIC CIRCUIT VALIDATION RULES
// -------------------------------------------------------------
console.log('\n3. Verifying Circuit Validation Rules...');

const valDiscoCircuit = validateCircuit(compDisco.project);
assert(valDiscoCircuit.overallStatus === 'STRUCTURALLY_VALID', 'Disco Light passes circuit validation');

const valRgbCircuit = validateCircuit(compRgb.project);
assert(valRgbCircuit.overallStatus === 'STRUCTURALLY_VALID', 'RGB Mood Light passes circuit validation');

// -------------------------------------------------------------
// TEST SUITE 4: GROUNDED ASSISTANT RESPONSES
// -------------------------------------------------------------
console.log('\n4. Verifying Grounded Assistant Reasoning...');

// Query A: "Hi" / "Hello"
const greetingRes = answerAssistantQuery({ queryText: 'Hi', project: compDisco.project, validation: valDiscoCircuit });
assert(greetingRes.includes('Hello! Welcome to Tracewise') && !greetingRes.includes('Ohm\'s Law Calculation'), 'Greeting returns friendly introduction without unsolicited dumps');

// Query B: "How many LEDs are in this project?"
const countLedsRes = answerAssistantQuery({ queryText: 'How many LEDs are in this project?', project: compDisco.project, validation: valDiscoCircuit });
assert(countLedsRes.includes('3 standard 5mm LEDs') && !countLedsRes.includes('Ohm\'s Law Calculation'), `LED counting returns exact 3 LEDs (output: "${countLedsRes.split('\n')[0]}")`);

// Query C: "Explain the connections"
const connRes = answerAssistantQuery({ queryText: 'Explain the connections in my circuit', project: compDisco.project, validation: valDiscoCircuit });
assert(connRes.includes('Circuit Wiring Netlist') && connRes.includes('15 active connections'), 'Connections returns structured pin-to-pin netlist');

// Query D: "What does my code do?"
const codeRes = answerAssistantQuery({ queryText: 'What does my code do?', project: compDisco.project, validation: valDiscoCircuit });
assert(codeRes.includes('Firmware Code Analysis') && codeRes.includes('setup()') && codeRes.includes('loop()'), 'Firmware query explains Arduino code structure');

// Query E: Unsupported hardware detection
const unsupp = detectUnsupportedHardware('Can you build an ultrasonic sensor rover with servo motors?');
assert(unsupp.includes('Servo Motor') && unsupp.includes('Ultrasonic Distance Sensor (HC-SR04)'), 'Unsupported hardware correctly flags Servo and Ultrasonic');

const plannerUnsupp = planProjectFromPrompt('build servo motor circuit');
assert(plannerUnsupp.status === 'CANNOT_BUILD' && plannerUnsupp.message.includes('not available in the current component library'), 'Planner rejects unsupported hardware with honest message');

// Query F: Buzzer is supported!
const unsuppBuzzer = detectUnsupportedHardware('build an alarm with a buzzer');
assert(unsuppBuzzer.length === 0, 'Active Buzzer is NOT flagged as unsupported (it is now in catalog)');

// -------------------------------------------------------------
// TEST SUITE 5: UNIFIED SEARCH & COMMUNITY GROUPS
// -------------------------------------------------------------
console.log('\n5. Verifying Unified Search & Community Groups...');

async function testCommunity() {
  const groups = await getCommunityGroups();
  assert(groups.length >= 3, `Community groups loaded (${groups.length} groups)`);

  const projects = await getPublishedProjects();
  assert(projects.length >= 2, `Published educational projects loaded (${projects.length} projects)`);

  const searchAll = await searchCommunity({ query: 'robotics', type: 'all' });
  assert(searchAll.groups.length > 0 || searchAll.posts.length > 0, 'Unified search returns results for "robotics"');

  const searchPeople = await searchCommunity({ query: 'Sudeep', type: 'people' });
  assert(searchPeople.people.length > 0, 'People search finds profile without exposing email');
  assert(!searchPeople.people.some(p => p.email), 'People search preserves privacy: 0 emails exposed');

  console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL PRODUCTION READINESS CHECKS PASSED SUCCESSFULLY!\n');
  }
}

testCommunity();
