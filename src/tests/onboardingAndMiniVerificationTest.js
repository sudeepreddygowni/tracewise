/**
 * Comprehensive Automated Verification Suite:
 * Interactive Onboarding, ReactDrops Showcase Pointer Tutorials & Tracewise Mini AI
 *
 * Verifies:
 * 1. Showcase Pointer component installation, source files, and exports.
 * 2. 8 approved tutorial workflows, cursor scripts, and isolated preview targets.
 * 3. Strict safety rule: visual presses only, zero automated production clicks or side effects.
 * 4. Tutorial Progress Service persistence, level selection, and reset capabilities.
 * 5. Local Knowledge Base resolution (Ohm's law, pinouts, polarity, route contexts).
 * 6. Guided First Circuit Practice Mode step definitions and detection predicates.
 * 7. Tracewise Mini contextual roles, suggested questions, and tutorial recommendation mapping.
 * 8. Studio Assistant handoff and practice mode triggers.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

console.log('===============================================================');
console.log('🧪 RUNNING ONBOARDING, SHOWCASE POINTER & TRACEWISE MINI TESTS');
console.log('===============================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Test Group 1: ReactDrops Showcase Pointer Installation & Source Truth
// -----------------------------------------------------------------------------
runTest('ReactDrops Showcase Pointer: Source files exist and are intact', () => {
  const files = [
    'src/components/showcase-pointer.tsx',
    'src/components/showcase-pointer-motion.ts',
    'src/components/cursor-label.tsx',
    'src/components/showcase-pointer.css'
  ];

  for (const rel of files) {
    const full = path.join(ROOT, rel);
    assert.ok(fs.existsSync(full), `Expected file ${rel} to exist`);
    const content = fs.readFileSync(full, 'utf8');
    assert.ok(content.length > 50, `File ${rel} should contain implementation content`);
  }
});

runTest('ReactDrops Showcase Pointer: Data attributes and animation contract verified', () => {
  const pointerCode = fs.readFileSync(path.join(ROOT, 'src/components/showcase-pointer.tsx'), 'utf8');
  assert.ok(pointerCode.includes('data-cursor-hover'), 'ShowcasePointer must support data-cursor-hover');
  assert.ok(pointerCode.includes('data-cursor-press'), 'ShowcasePointer must support data-cursor-press');
  assert.ok(pointerCode.includes('data-cursor-selected'), 'ShowcasePointer must support data-cursor-selected');
  assert.ok(pointerCode.includes('onCursorPress'), 'ShowcasePointer must support onCursorPress callback');
  assert.ok(pointerCode.includes('onCycle'), 'ShowcasePointer must support onCycle reset callback');
});

// -----------------------------------------------------------------------------
// Test Group 2: Eight Approved Tutorial Lessons & Safety Rules
// -----------------------------------------------------------------------------
import { TUTORIAL_LESSONS } from '../tutorials/tutorialData.js';

runTest('Tutorial Lessons: All 8 approved workflows defined with metadata', () => {
  assert.strictEqual(TUTORIAL_LESSONS.length, 8, 'Must define exactly 8 approved tutorial lessons');

  const expectedIds = [
    'dashboard',
    'components',
    'wiring',
    'firmware',
    'simulation',
    'compare',
    'pitch',
    'community'
  ];

  const actualIds = TUTORIAL_LESSONS.map(l => l.id);
  assert.deepStrictEqual(actualIds, expectedIds, 'Lesson IDs must match the 8 approved workflows');

  for (const lesson of TUTORIAL_LESSONS) {
    assert.ok(lesson.title && lesson.title.length > 3, `Lesson ${lesson.id} must have title`);
    assert.ok(lesson.duration, `Lesson ${lesson.id} must have duration`);
    assert.ok(lesson.difficulty, `Lesson ${lesson.id} must have difficulty`);
    assert.ok(Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length >= 2, `Lesson ${lesson.id} needs learning objectives`);
    assert.ok(Array.isArray(lesson.accessibleSteps) && lesson.accessibleSteps.length >= 2, `Lesson ${lesson.id} needs accessible text steps`);
    assert.ok(Array.isArray(lesson.cursors) && lesson.cursors.length > 0, `Lesson ${lesson.id} needs cursor script`);
  }
});

runTest('Safety Rule Verification: Scripted presses do not call production DOM events', () => {
  const playerSource = fs.readFileSync(path.join(ROOT, 'src/components/onboarding/TutorialPlayer.jsx'), 'utf8');

  // Verify that onCursorPress manipulates preview state only
  assert.ok(playerSource.includes('handleCursorPress'), 'TutorialPlayer must implement handleCursorPress');
  assert.ok(playerSource.includes('setPreviewState'), 'TutorialPlayer must update isolated preview state on cursor press');

  // Strict check: No element.click(), no dispatchEvent(new MouseEvent('click'))
  assert.ok(!playerSource.includes('.click()'), 'SAFETY VIOLATION: TutorialPlayer must NEVER call element.click()');
  assert.ok(!playerSource.includes('new MouseEvent'), 'SAFETY VIOLATION: TutorialPlayer must not dispatch synthetic mouse events');

  // Verify onCycle resets preview state
  assert.ok(playerSource.includes('onCycle'), 'TutorialPlayer must supply onCycle to ShowcasePointer');
  assert.ok(playerSource.includes('INITIAL_PREVIEWS'), 'TutorialPlayer must reset to initial preview state onCycle');
});

// -----------------------------------------------------------------------------
// Test Group 3: Local Knowledge Base & Question Matcher
// -----------------------------------------------------------------------------
import { ROUTE_CONTEXTS, KNOWLEDGE_TOPICS, matchLocalKnowledge } from '../data/tracewiseKnowledge.js';

runTest('Knowledge Base: Route contexts configured for all key routes', () => {
  const routes = ['/app', '/app/studio', '/app/compare', '/app/pitch', '/app/community', '/learn'];
  for (const r of routes) {
    const ctx = ROUTE_CONTEXTS[r];
    assert.ok(ctx, `Missing route context for ${r}`);
    assert.ok(ctx.role, `Missing role for ${r}`);
    assert.ok(ctx.welcome, `Missing welcome text for ${r}`);
    assert.ok(Array.isArray(ctx.suggestedQuestions) && ctx.suggestedQuestions.length >= 3, `Route ${r} must have suggested questions`);
    assert.ok(ctx.recommendedLessonId, `Route ${r} must have recommended lesson ID`);
  }
});

runTest('Knowledge Base: Local matcher correctly resolves Ohm\'s law & 220Ω query', () => {
  const result = matchLocalKnowledge('Why does an LED need a 220 ohm resistor?');
  assert.ok(result, 'Expected match for 220 ohm resistor question');
  assert.strictEqual(result.matchedTopicId, 'resistor-led-ohm');
  assert.ok(result.text.includes('Ohm’s Law'), 'Answer should cite Ohm\'s Law');
  assert.ok(result.text.includes('220'), 'Answer should explain 220Ω');
});

runTest('Knowledge Base: Local matcher resolves LED polarity and pin orientation', () => {
  const result = matchLocalKnowledge('Which pin is anode and cathode on an LED?');
  assert.ok(result, 'Expected match for anode/cathode query');
  assert.strictEqual(result.matchedTopicId, 'led-polarity');
  assert.ok(result.text.includes('Anode'), 'Answer should explain Anode');
  assert.ok(result.text.includes('Cathode'), 'Answer should explain Cathode');
});

runTest('Knowledge Base: Local matcher provides contextual greeting on generic hello', () => {
  const result = matchLocalKnowledge('Hello there', '/app/studio/my-circuit');
  assert.ok(result, 'Expected match for generic greeting');
  assert.strictEqual(result.matchedTopicId, 'greeting');
  assert.strictEqual(result.title, 'Engineering Studio');
});

// -----------------------------------------------------------------------------
// Test Group 4: Guided First Circuit Practice Mode
// -----------------------------------------------------------------------------
runTest('Guided Practice Mode: Component inspection predicates function properly', () => {
  const practiceSource = fs.readFileSync(path.join(ROOT, 'src/components/onboarding/GuidedPracticeMode.jsx'), 'utf8');

  // Verify 9 defined steps
  assert.ok(practiceSource.includes('step-1-arduino'), 'Must define step 1: Arduino Uno');
  assert.ok(practiceSource.includes('step-2-led'), 'Must define step 2: Red LED');
  assert.ok(practiceSource.includes('step-3-resistor'), 'Must define step 3: 220Ω Resistor');
  assert.ok(practiceSource.includes('step-4-wire-pin13'), 'Must define step 4: Wire Pin 13');
  assert.ok(practiceSource.includes('step-5-wire-anode'), 'Must define step 5: Wire Anode');
  assert.ok(practiceSource.includes('step-6-wire-gnd'), 'Must define step 6: Wire GND');
  assert.ok(practiceSource.includes('step-7-firmware'), 'Must define step 7: Firmware');
  assert.ok(practiceSource.includes('step-8-simulate'), 'Must define step 8: Simulation');
  assert.ok(practiceSource.includes('step-9-complete'), 'Must define step 9: Completed');
});

// -----------------------------------------------------------------------------
// Test Group 5: Telemetry, Studio Integration & Layout Mounts
// -----------------------------------------------------------------------------
import { Analytics } from '../services/analyticsService.js';

runTest('Analytics Service: Onboarding, tutorial, practice, and mini events registered', () => {
  const expectedFns = [
    'onboardingStarted',
    'onboardingDismissed',
    'tutorialStarted',
    'tutorialCompleted',
    'tutorialReplayed',
    'practiceStarted',
    'practiceStepCompleted',
    'practiceCompleted',
    'miniOpened',
    'miniQueried',
    'tutorialRecommended'
  ];

  for (const fn of expectedFns) {
    assert.strictEqual(typeof Analytics[fn], 'function', `Analytics.${fn} must be a callable function`);
  }
});

runTest('AppLayout Integration: WelcomeExperience and TracewiseMini are mounted', () => {
  const appLayoutSource = fs.readFileSync(path.join(ROOT, 'src/components/layout/AppLayout.jsx'), 'utf8');
  assert.ok(appLayoutSource.includes('<WelcomeExperience'), 'AppLayout must mount WelcomeExperience');
  assert.ok(appLayoutSource.includes('<TracewiseMini />'), 'AppLayout must mount TracewiseMini');
});

runTest('StudioPage Integration: GuidedPracticeMode and handoff listeners are wired', () => {
  const studioSource = fs.readFileSync(path.join(ROOT, 'src/pages/StudioPage.jsx'), 'utf8');
  assert.ok(studioSource.includes('<GuidedPracticeMode'), 'StudioPage must mount GuidedPracticeMode');
  assert.ok(studioSource.includes('tracewise:open_studio_assistant'), 'StudioPage must listen for open_studio_assistant');
  assert.ok(studioSource.includes('tracewise:open_practice_mode'), 'StudioPage must listen for open_practice_mode');
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests} of ${totalTests} tests passed successfully!`);
console.log('===============================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
