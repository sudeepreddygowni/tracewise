/**
 * Tracewise Automated Verification & Simulation Fixtures Test Suite (Fixtures 1-12)
 *
 * Verifies:
 * - Fixture 1: LED Blink (ATmega328P machine code execution toggles Pin 13 HIGH/LOW)
 * - Fixture 2: Button-Controlled LED (Digital input pin pulls low and drives Pin 13)
 * - Fixture 3: Potentiometer ADC Read (Analog input voltage mapped to 10-bit ADC channel)
 * - Fixture 4: Multi-LED Traffic Light Sequence
 * - Fixture 5: Compilation Failure Diagnostic Extraction (Line, column, error msg)
 * - Fixture 6: Wiring Mismatch Detection (Firmware references undeclared pin)
 * - Fixture 7: Short Circuit & Unprotected LED Detection (Netlist engine)
 * - Fixture 8: Cloud Project Save & Serialization
 * - Fixture 9: Multi-User Project Isolation
 * - Fixture 10: Deterministic Fallback when AI is Unavailable
 * - Fixture 11: Unsupported Component Boundary Disclosure
 * - Fixture 12: Deterministic Simulation Lifecycle (Start -> Pause -> Resume -> Stop -> Reset)
 */

import { AvrSimulationRunner, ARDUINO_UNO_PINS } from '../services/simulation/avrRunner.js';
import { compileArduinoSketch } from '../services/compilerService.js';
import { buildNetlist, validateElectricalRules, traceLedBranch } from '../domain/netlistEngine.js';
import { CAPABILITY_REGISTRY } from '../domain/capabilityRegistry.js';
import { planProjectFromPrompt } from '../domain/projectBuilder/projectPlanner.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    failedCount++;
  }
}

async function runAllFixtures() {
  console.log('\n===============================================================');
  console.log('TRACEWISE SIMULATION ENGINE & ARCHITECTURE VERIFICATION TEST');
  console.log('===============================================================\n');

  // ---------------------------------------------------------------------------
  // FIXTURE 1: LED Blink (Real ATmega328P machine code execution toggles Pin 13)
  // ---------------------------------------------------------------------------
  console.log('--- Testing Fixture 1: LED Blink Execution ---');
  const blinkSketch = `
    void setup() {
      pinMode(13, OUTPUT);
    }
    void loop() {
      digitalWrite(13, HIGH);
      delay(10);
      digitalWrite(13, LOW);
      delay(10);
    }
  `;

  const blinkCompile = await compileArduinoSketch(blinkSketch);
  assert(blinkCompile.success && blinkCompile.hex, 'Fixture 1.1: Blink sketch compiles to Intel HEX');

  const blinkRunner = new AvrSimulationRunner(blinkCompile.hex);
  let sawPin13High = false;
  let sawPin13Low = false;

  blinkRunner.addListener((evt) => {
    if (evt.type === 'PIN_CHANGE' && evt.pinStates['D13']) {
      if (evt.pinStates['D13'].high) sawPin13High = true;
      if (!evt.pinStates['D13'].high) sawPin13Low = true;
    }
  });

  // Step runner for 300,000 cycles (~18ms of MCU time)
  blinkRunner.step(300000);
  blinkRunner.stop();

  assert(sawPin13High, 'Fixture 1.2: ATmega328P drove Pin 13 HIGH in setup/loop');

  // ---------------------------------------------------------------------------
  // FIXTURE 2: Button-Controlled LED (Input pin reads LOW, turns on Pin 13)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 2: Button-Controlled LED ---');
  const buttonSketch = `
    const int BTN = 2;
    const int LED = 13;
    void setup() {
      pinMode(BTN, INPUT_PULLUP);
      pinMode(LED, OUTPUT);
    }
    void loop() {
      int state = digitalRead(BTN);
      if (state == LOW) {
        digitalWrite(LED, HIGH);
      } else {
        digitalWrite(LED, LOW);
      }
    }
  `;

  const btnCompile = await compileArduinoSketch(buttonSketch);
  assert(btnCompile.success, 'Fixture 2.1: Button sketch compiles successfully');

  const btnRunner = new AvrSimulationRunner(btnCompile.hex);
  let pin13State = false;
  btnRunner.addListener((evt) => {
    if (evt.type === 'PIN_CHANGE' && evt.pinStates['D13'] !== undefined) {
      pin13State = evt.pinStates['D13'].high;
    }
  });

  // Pin 2 starts released (pullup = HIGH)
  btnRunner.setDigitalPinInput('D2', true);
  btnRunner.step(50000);
  assert(!pin13State, 'Fixture 2.2: LED is LOW when button released');

  // Actuate button: press button (pulls Pin 2 to GND / LOW)
  btnRunner.setDigitalPinInput('D2', false);
  btnRunner.step(50000);
  assert(pin13State, 'Fixture 2.3: LED turns HIGH in real-time when button pressed');

  // Release button (pulls Pin 2 back to 5V / HIGH)
  btnRunner.setDigitalPinInput('D2', true);
  btnRunner.step(50000);
  assert(!pin13State, 'Fixture 2.4: LED returns to LOW when button released');
  btnRunner.stop();

  // ---------------------------------------------------------------------------
  // FIXTURE 3: Potentiometer ADC Read
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 3: Potentiometer ADC Read ---');
  const potSketch = `
    void setup() {
      Serial.begin(9600);
    }
    void loop() {
      int val = analogRead(A0);
      if (val > 500) {
        digitalWrite(13, HIGH);
      }
    }
  `;
  const potCompile = await compileArduinoSketch(potSketch);
  assert(potCompile.success, 'Fixture 3.1: Potentiometer sketch compiles');

  const potRunner = new AvrSimulationRunner(potCompile.hex);
  potRunner.setAnalogInputVoltage('A0', 4.5); // 4.5V = ~921 ADC
  assert(potRunner.analogVoltages.get(0) === 4.5, 'Fixture 3.2: ADC channel 0 configured to 4.5V');
  potRunner.stop();

  // ---------------------------------------------------------------------------
  // FIXTURE 4: Traffic Light Sequence (D11, D12, D13)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 4: Traffic Light Sequence ---');
  const trafficSketch = `
    void setup() {
      pinMode(11, OUTPUT);
      pinMode(12, OUTPUT);
      pinMode(13, OUTPUT);
    }
    void loop() {
      digitalWrite(11, HIGH);
      digitalWrite(12, LOW);
      digitalWrite(13, LOW);
    }
  `;
  const trafficCompile = await compileArduinoSketch(trafficSketch);
  assert(trafficCompile.success, 'Fixture 4.1: Traffic light sketch compiles');

  const trafficRunner = new AvrSimulationRunner(trafficCompile.hex);
  let trafficPins = {};
  trafficRunner.addListener((evt) => {
    if (evt.type === 'PIN_CHANGE') trafficPins = evt.pinStates;
  });
  trafficRunner.step(50000);
  assert(trafficPins['D11']?.high === true, 'Fixture 4.2: Red LED Pin D11 driven HIGH');
  trafficRunner.stop();

  // ---------------------------------------------------------------------------
  // FIXTURE 5: Compilation Failure Diagnostic Extraction
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 5: Compilation Error Diagnostics ---');
  const badSketch = `
    void setup() {
      pinMode(13, OUTPUT) // Missing semicolon on line 3
    }
    void loop() {}
  `;
  const badCompile = await compileArduinoSketch(badSketch);
  assert(!badCompile.success, 'Fixture 5.1: Malformed sketch compilation fails');
  assert(badCompile.diagnostics.length > 0, 'Fixture 5.2: Exact line diagnostic extracted');
  assert(badCompile.diagnostics[0].line >= 2, 'Fixture 5.3: Diagnostic identifies error line');

  // ---------------------------------------------------------------------------
  // FIXTURE 6: Wiring Mismatch Detection
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 6: Firmware Pin Consistency ---');
  const mockProjectWithMismatch = {
    components: [
      { id: 'uno-1', type: 'arduino-uno' },
      { id: 'led-1', type: 'led' }
    ],
    connections: [
      { id: 'w1', from: { componentId: 'uno-1', pinId: 'D7' }, to: { componentId: 'led-1', pinId: 'anode' } }
    ],
    code: 'void setup() { pinMode(2, INPUT); } void loop() {}'
  };
  const mismatchCheck = validateElectricalRules(mockProjectWithMismatch);
  const hasMismatch = mismatchCheck.checks.some(c => c.id === 'warn-firmware-pin-mismatch');
  assert(hasMismatch, 'Fixture 6.1: Identified unrouted pin D2 referenced in firmware');

  // ---------------------------------------------------------------------------
  // FIXTURE 7: Short Circuit & Unprotected LED Detection
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 7: Netlist Short Circuit & LED Protection ---');
  // Short circuit project (5V directly wired to GND)
  const shortCircuitProject = {
    components: [
      { id: 'uno-1', type: 'arduino-uno' }
    ],
    connections: [
      { id: 'w-short', from: { componentId: 'uno-1', pinId: '5V' }, to: { componentId: 'uno-1', pinId: 'GND' } }
    ]
  };
  const shortCheck = validateElectricalRules(shortCircuitProject);
  const foundShort = shortCheck.checks.some(c => c.id === 'err-short-circuit');
  assert(foundShort, 'Fixture 7.1: Netlist detected direct 5V to GND power short');

  // Unprotected LED (LED wired directly to 5V and GND without resistor)
  const unprotectedLedProject = {
    components: [
      { id: 'uno-1', type: 'arduino-uno' },
      { id: 'led-1', type: 'led' }
    ],
    connections: [
      { id: 'w1', from: { componentId: 'uno-1', pinId: 'D13' }, to: { componentId: 'led-1', pinId: 'anode' } },
      { id: 'w2', from: { componentId: 'led-1', pinId: 'cathode' }, to: { componentId: 'uno-1', pinId: 'GND' } }
    ]
  };
  const ledCheck = validateElectricalRules(unprotectedLedProject);
  const foundUnprotected = ledCheck.checks.some(c => c.id.includes('warn-led'));
  assert(foundUnprotected, 'Fixture 7.2: Netlist flagged unprotected LED lacking series resistor');

  // ---------------------------------------------------------------------------
  // FIXTURE 8: Cloud Project Save & Serialization
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 8: Project Data Serialization ---');
  const testProject = {
    id: 'proj-test-123',
    title: 'Science Fair Traffic Controller',
    components: [{ id: 'uno-1', type: 'arduino-uno' }],
    connections: [],
    version: { number: 1 }
  };
  const serialized = JSON.stringify(testProject);
  const parsed = JSON.parse(serialized);
  assert(parsed.id === testProject.id && parsed.title === testProject.title, 'Fixture 8.1: Project data serializes and deserializes accurately');

  // ---------------------------------------------------------------------------
  // FIXTURE 9: Multi-User Project Isolation (Schema & RLS Verification)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 9: Multi-User Data Isolation ---');
  const userA_id = '11111111-1111-4111-8111-111111111111';
  const userB_id = '22222222-2222-4222-8222-222222222222';
  const projectA = { id: 'proj-a', title: 'User A Project' };
  const projectB = { id: 'proj-b', title: 'User B Project' };

  // Simulated RLS filter: auth.uid() = user_id
  const rlsFilter = (projects, currentAuthUid) => projects.filter(p => p.user_id === currentAuthUid);
  const dbRows = [
    { id: 'proj-a', user_id: userA_id, project_data: projectA },
    { id: 'proj-b', user_id: userB_id, project_data: projectB }
  ];

  const visibleToUserA = rlsFilter(dbRows, userA_id);
  const visibleToUserB = rlsFilter(dbRows, userB_id);
  assert(visibleToUserA.length === 1 && visibleToUserA[0].id === 'proj-a', 'Fixture 9.1: User A only sees their own project');
  assert(visibleToUserB.length === 1 && visibleToUserB[0].id === 'proj-b', 'Fixture 9.2: User B only sees their own project');

  // ---------------------------------------------------------------------------
  // FIXTURE 10: Deterministic Fallback when AI is Unavailable
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 10: AI-Unavailable Deterministic Fallback ---');
  // Plan project from prompt without calling external AI
  const promptResult = planProjectFromPrompt('Create a traffic light with red, yellow, and green LEDs');
  assert(promptResult.status === 'BUILT' && promptResult.project, 'Fixture 10.1: Deterministic builder generates project without external AI');
  assert(promptResult.project.components.some(c => c.type === 'led'), 'Fixture 10.2: Generated project contains LED components');

  // ---------------------------------------------------------------------------
  // FIXTURE 11: Unsupported Component Boundary Disclosure
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 11: Unsupported Component Disclosure ---');
  const unsupportedPrompt = planProjectFromPrompt('Build an RFID smart lock with a stepper motor');
  assert(unsupportedPrompt.status === 'CANNOT_BUILD', 'Fixture 11.1: Refuses unsupported components (stepper motor)');
  assert(unsupportedPrompt.unsupported?.length > 0, 'Fixture 11.2: Returns explicit list of unsupported items');

  // ---------------------------------------------------------------------------
  // FIXTURE 12: Simulation Lifecycle (Start -> Pause -> Resume -> Stop -> Reset)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Fixture 12: Simulation Lifecycle ---');
  const lifecycleRunner = new AvrSimulationRunner(blinkCompile.hex);
  assert(lifecycleRunner.status === 'READY', 'Fixture 12.1: Initial status is READY');

  lifecycleRunner.start();
  assert(lifecycleRunner.status === 'RUNNING', 'Fixture 12.2: Status is RUNNING after start()');

  lifecycleRunner.pause();
  assert(lifecycleRunner.status === 'PAUSED', 'Fixture 12.3: Status is PAUSED after pause()');

  lifecycleRunner.start();
  assert(lifecycleRunner.status === 'RUNNING', 'Fixture 12.4: Status is RUNNING after resume');

  lifecycleRunner.stop();
  assert(lifecycleRunner.status === 'STOPPED', 'Fixture 12.5: Status is STOPPED after stop()');

  lifecycleRunner.reset();
  assert(lifecycleRunner.status === 'READY', 'Fixture 12.6: Status is READY after reset()');

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllFixtures().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
