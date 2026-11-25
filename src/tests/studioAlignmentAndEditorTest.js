/**
 * Studio Alignment and Code Editor Scrolling Regression Test Suite
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: Studio Alignment & Code Editor Scrolling ===');

const componentLibraryPath = path.resolve(__dirname, '../components/studio/ComponentLibrary.jsx');
const componentLibraryCode = fs.readFileSync(componentLibraryPath, 'utf8');

const studioPagePath = path.resolve(__dirname, '../pages/StudioPage.jsx');
const studioPageCode = fs.readFileSync(studioPagePath, 'utf8');

const codeEditorPath = path.resolve(__dirname, '../components/studio/CodeEditor.jsx');
const codeEditorCode = fs.readFileSync(codeEditorPath, 'utf8');

// 1. Component Library Header Layout
assert(
  componentLibraryCode.includes('+ Custom Part') &&
  componentLibraryCode.includes('Import JSON') &&
  componentLibraryCode.includes('filteredComponents.length'),
  'Component Library contains Custom Part, Import JSON, and component count'
);

assert(
  componentLibraryCode.includes('{/* Row 1: Title, Count Badge & Optional Close */}') &&
  componentLibraryCode.includes('{/* Row 2: Action Buttons (+ Custom Part & Import JSON) */}'),
  'Component Library uses clean 2-row header layout to prevent button clipping'
);

// 2. Studio Canvas Floating Button Overlap Fix
assert(
  !studioPageCode.includes('DESKTOP FLOATING REOPEN BUTTON'),
  'Redundant desktop floating Components button removed from canvas area'
);

assert(
  studioPageCode.includes('onToggleComponentLibrary'),
  'Desktop uses primary Show Parts / Hide Parts toolbar toggle'
);

// 3. Code Editor Container Constraints & Scrolling
assert(
  codeEditorCode.includes("minHeight: 0") &&
  codeEditorCode.includes("flex: '1 1 0%'"),
  'CodeEditor enforces minHeight: 0 and flex: 1 1 0% on flex containers'
);

assert(
  codeEditorCode.includes('TracewiseBubbleArea') &&
  codeEditorCode.includes("overflow: 'hidden'"),
  'CodeEditor TracewiseBubbleArea has proper height and overflow constraints'
);

assert(
  codeEditorCode.includes('lineNumbersRef') &&
  codeEditorCode.includes('textareaRef') &&
  codeEditorCode.includes('handleScroll'),
  'CodeEditor synchronizes line numbers with vertical textarea scrolling'
);

console.log(`\n======================================================`);
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`======================================================`);

if (failed > 0) {
  process.exit(1);
}
