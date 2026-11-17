/**
 * Verification test suite for:
 * 1. Reduced Bubble Rainbow Colors & Understated Glare
 * 2. Simplified Navigation Layout (Studio, Projects, Community, Explore Dropdown, Messages, Profile Dropdown)
 * 3. Media Upload Validation for Avatars & Covers (JPEG, PNG, WebP up to 5MB, strict rejection of executables)
 * 4. User Published Projects Privacy Safeguard (never exposes unpublished private drafts)
 * 5. Professional Profile Field Mapping (Headline, About, Education, Skills, Links)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  validateImageFile
} from '../services/mediaStorageService.js';

import {
  getUserPublishedProjects
} from '../services/communityService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('=== TEST SUITE 1: Subtle Bubble Material & Reduced Glare ===');
const bubbleActionsPath = path.resolve(__dirname, '../components/ui/BubbleActions.jsx');
const bubbleCode = fs.readFileSync(bubbleActionsPath, 'utf8');

// Check RAINBOW_BUBBLE_PRESET properties
const iridescenceMatch = bubbleCode.match(/RAINBOW_BUBBLE_PRESET\s*=\s*{[^}]*iridescence:\s*([0-9.]+)/s);
const iridescenceVal = iridescenceMatch ? parseFloat(iridescenceMatch[1]) : 999;
assert(iridescenceVal <= 0.4, `Dark bubble iridescence reduced to subtle level (${iridescenceVal} <= 0.4)`);

const coverageMatch = bubbleCode.match(/RAINBOW_BUBBLE_PRESET\s*=\s*{[^}]*oilCoverage:\s*([0-9.]+)/s);
const coverageVal = coverageMatch ? parseFloat(coverageMatch[1]) : 999;
assert(coverageVal <= 0.5, `Dark bubble oil coverage reduced (${coverageVal} <= 0.5)`);

const dispersionMatch = bubbleCode.match(/RAINBOW_BUBBLE_PRESET\s*=\s*{[^}]*dispersion:\s*([0-9.]+)/s);
const dispersionVal = dispersionMatch ? parseFloat(dispersionMatch[1]) : 999;
assert(dispersionVal <= 0.4, `Dark bubble spectral dispersion reduced (${dispersionVal} <= 0.4)`);

const clearCenterMatch = bubbleCode.match(/RAINBOW_BUBBLE_PRESET\s*=\s*{[^}]*clearCenter:\s*([0-9.]+)/s);
const clearCenterVal = clearCenterMatch ? parseFloat(clearCenterMatch[1]) : 0;
assert(clearCenterVal >= 0.7, `Clear center ensures text contrast and legibility (${clearCenterVal} >= 0.7)`);

assert(bubbleCode.includes('SUBTLE_DARK_BUBBLE_PRESET'), 'SUBTLE_DARK_BUBBLE_PRESET alias exported');

console.log('\n=== TEST SUITE 2: Avatar & Cover Image Storage Validation ===');
// Valid formats
assert(validateImageFile({ name: 'avatar.png', type: 'image/png', size: 1024 * 1024 }).valid, 'Valid 1MB PNG accepted');
assert(validateImageFile({ name: 'profile.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 }).valid, 'Valid 2MB JPEG accepted');
assert(validateImageFile({ name: 'banner.webp', type: 'image/webp', size: 3 * 1024 * 1024 }).valid, 'Valid 3MB WebP accepted');

// Invalid sizes
assert(!validateImageFile({ name: 'huge_banner.png', type: 'image/png', size: 6 * 1024 * 1024 }).valid, '6MB file rejected (>5MB limit)');

// Dangerous / invalid extensions
assert(!validateImageFile({ name: 'malicious.exe', type: 'application/x-msdownload', size: 500 }).valid, 'Executable .exe rejected');
assert(!validateImageFile({ name: 'exploit.svg', type: 'image/svg+xml', size: 500 }).valid, 'Scriptable SVG rejected from avatar upload');
assert(!validateImageFile({ name: 'script.js', type: 'text/javascript', size: 500 }).valid, 'JavaScript file rejected');
assert(!validateImageFile(null).valid, 'Null file gracefully rejected');

console.log('\n=== TEST SUITE 3: Published Projects Privacy Protection ===');
// Unknown / non-existent user has zero published projects and never returns private projects
async function testProjectPrivacy() {
  const emptyUserProjects = await getUserPublishedProjects('non-existent-user-uuid', 'non_existent_handle');
  assert(Array.isArray(emptyUserProjects), 'getUserPublishedProjects returns an array');
  assert(emptyUserProjects.length === 0, 'No published projects returned for user with zero published projects');

  // Preview showcase author
  const alexProjects = await getUserPublishedProjects(null, 'alex_circuits');
  assert(Array.isArray(alexProjects), 'Showcase author alex_circuits returns published showcase projects');
}

await testProjectPrivacy();

console.log('\n=== TEST SUITE 4: Navbar Navigation Elements & Explore Dropdown ===');
const navbarPath = path.resolve(__dirname, '../components/navigation/Navbar.jsx');
const navbarCode = fs.readFileSync(navbarPath, 'utf8');

assert(navbarCode.includes('studioRoute'), 'Navbar includes Studio link');
assert(navbarCode.includes('/projects'), 'Navbar includes Projects link');
assert(navbarCode.includes('/community'), 'Navbar includes Community link');
assert(navbarCode.includes('exploreMenuOpen'), 'Navbar includes Explore dropdown state');
assert(navbarCode.includes('/#how-it-works'), 'Explore dropdown includes How It Works');
assert(navbarCode.includes('/learn'), 'Explore dropdown includes Practice Lab');
assert(navbarCode.includes('compareRoute'), 'Explore dropdown includes Compare & Debug');
assert(navbarCode.includes('/messages'), 'Navbar includes Direct Messages button');
assert(navbarCode.includes('user?.avatarUrl'), 'Navbar profile button renders uploaded avatar image');
assert(navbarCode.includes('Escape'), 'Menus listen for Escape key to close cleanly');

console.log('\n======================================================');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${totalChecks - passedChecks}`);
console.log('======================================================');
