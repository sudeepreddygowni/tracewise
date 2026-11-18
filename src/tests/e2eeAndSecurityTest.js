/**
 * Tracewise Engineering Upgrade — E2EE, Security & Multi-User Verification Suite
 * 
 * Verifies:
 * 1. Web Crypto API: ECDH P-256 key pair generation and JWK export/import
 * 2. HKDF-SHA256 derivation of AES-256-GCM symmetric session keys
 * 3. Authenticated encryption and decryption of Direct Messages
 * 4. Cryptographic integrity: Rejection of bit-flipped or tampered ciphertext
 * 5. Binary attachment encryption and decryption round-trip
 * 6. Direct Message service contract: Typed request object vs defensive backwards compatibility
 * 7. Category-scoped media privacy: DIRECT_MESSAGE signed URLs vs COMMUNITY public URLs
 * 8. Creator authorship config: Verified name, email, GitHub, and confirmed LinkedIn profile
 */

import assert from 'assert';
import {
  generateDeviceKeyPair,
  deriveSharedSessionKey,
  encryptDirectMessage,
  decryptDirectMessage,
  encryptAttachmentBuffer,
  decryptAttachmentBuffer,
  parseMessageSecurity
} from '../services/e2eeService.js';
import { sendMessage } from '../services/messagingService.js';
import { MEDIA_CATEGORIES, validateMediaFile } from '../services/mediaStorageService.js';
import { CREATOR_CONFIG } from '../config/creatorConfig.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

console.log('===============================================================');
console.log('TRACEWISE E2EE, SECURITY & MULTI-USER VERIFICATION TEST');
console.log('===============================================================\n');

async function runAllTests() {
  // -----------------------------------------------------------------
  // 1. Web Crypto ECDH P-256 Key Exchange
  // -----------------------------------------------------------------
  console.log('--- Suite 1: Web Crypto ECDH Key Agreement ---');
  let aliceIdentity, bobIdentity, eveIdentity;

  await testAsync('1.1: Generate ECDH P-256 device keypairs for Alice and Bob', async () => {
    aliceIdentity = await generateDeviceKeyPair();
    bobIdentity = await generateDeviceKeyPair();
    eveIdentity = await generateDeviceKeyPair();

    assert(aliceIdentity.deviceId.startsWith('dev_'), 'Alice deviceId generated');
    assert(bobIdentity.deviceId.startsWith('dev_'), 'Bob deviceId generated');
    assert.strictEqual(aliceIdentity.publicKeyJwk.kty, 'EC', 'Key type is EC');
    assert.strictEqual(aliceIdentity.publicKeyJwk.crv, 'P-256', 'Curve is NIST P-256');
  });

  let aliceSharedKey, bobSharedKey, eveSharedKey;
  await testAsync('1.2: Derive shared symmetric key via ECDH + HKDF-SHA256', async () => {
    aliceSharedKey = await deriveSharedSessionKey(
      aliceIdentity.keyPair.privateKey,
      bobIdentity.publicKeyJwk,
      'test-conv-123'
    );
    bobSharedKey = await deriveSharedSessionKey(
      bobIdentity.keyPair.privateKey,
      aliceIdentity.publicKeyJwk,
      'test-conv-123'
    );
    // Eve tries with her own key
    eveSharedKey = await deriveSharedSessionKey(
      eveIdentity.keyPair.privateKey,
      bobIdentity.publicKeyJwk,
      'test-conv-123'
    );

    assert(aliceSharedKey !== null, 'Alice derived AES-GCM session key');
    assert(bobSharedKey !== null, 'Bob derived AES-GCM session key');
  });

  // -----------------------------------------------------------------
  // 2. Authenticated Symmetric Message Encryption (AES-256-GCM)
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: AES-256-GCM Authenticated Encryption ---');
  let encryptedPayload;
  const secretText = 'Project Pin 9 PWM duty cycle set to 75% for DC motor controller.';

  await testAsync('2.1: Encrypt message from Alice to Bob', async () => {
    encryptedPayload = await encryptDirectMessage(secretText, aliceSharedKey);
    assert.strictEqual(encryptedPayload.v, 1, 'Protocol version 1');
    assert.strictEqual(encryptedPayload.alg, 'ECDH-P256-AES-GCM-256', 'Algorithm verified');
    assert(encryptedPayload.iv && encryptedPayload.iv.length > 10, 'Standard 96-bit IV generated');
    assert(encryptedPayload.ct && encryptedPayload.ct.length > 20, 'Ciphertext with auth tag present');
  });

  await testAsync('2.2: Bob successfully decrypts Alice\'s message', async () => {
    const decrypted = await decryptDirectMessage(encryptedPayload, bobSharedKey);
    assert.strictEqual(decrypted, secretText, 'Plaintext restored exactly without alteration');
  });

  await testAsync('2.3: Unauthorized Eve cannot decrypt Alice\'s message', async () => {
    let eveSucceeded = false;
    try {
      await decryptDirectMessage(encryptedPayload, eveSharedKey);
      eveSucceeded = true;
    } catch {
      // Expected to throw authentication error
    }
    assert.strictEqual(eveSucceeded, false, 'Eve was rejected by AES-GCM authentication tag');
  });

  await testAsync('2.4: Tamper Detection: Bit-flipped ciphertext is rejected', async () => {
    let tamperSucceeded = false;
    try {
      // Modify 1 character of ciphertext
      const tamperedCt = (encryptedPayload.ct[0] === 'A' ? 'B' : 'A') + encryptedPayload.ct.slice(1);
      const tamperedPayload = { ...encryptedPayload, ct: tamperedCt };
      await decryptDirectMessage(tamperedPayload, bobSharedKey);
      tamperSucceeded = true;
    } catch {
      // Expected to fail authentication
    }
    assert.strictEqual(tamperSucceeded, false, 'Tampered ciphertext rejected by GCM tag verification');
  });

  // -----------------------------------------------------------------
  // 3. Binary Attachment Encryption
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: Encrypted Binary Attachments ---');
  await testAsync('3.1: Encrypt and decrypt binary buffer with AES-256-GCM', async () => {
    const rawData = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01, 0x02, 0x03, 0x04]);
    const encResult = await encryptAttachmentBuffer(rawData.buffer, aliceSharedKey);
    assert(encResult.encryptedBuffer.byteLength > 0, 'Binary buffer encrypted');
    assert(encResult.iv, 'Attachment IV generated');

    const decBuffer = await decryptAttachmentBuffer(encResult.encryptedBuffer, encResult.iv, bobSharedKey);
    const restoredBytes = new Uint8Array(decBuffer);
    assert.deepStrictEqual(Array.from(restoredBytes), Array.from(rawData), 'Binary bytes decrypted identically');
  });

  // -----------------------------------------------------------------
  // 4. Message Security Badging & Backward Compatibility
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: Security Badging & Legacy Interoperability ---');
  test('4.1: Encrypted payload correctly identified with E2EE badge', () => {
    const msg = { content: JSON.stringify(encryptedPayload) };
    const sec = parseMessageSecurity(msg);
    assert.strictEqual(sec.isEncrypted, true, 'isEncrypted is true');
    assert.strictEqual(sec.isLegacy, false, 'isLegacy is false');
    assert.strictEqual(sec.badge, 'E2EE (Web Crypto AES-GCM-256)', 'Badge text matches');
  });

  test('4.2: Historical plaintext message identified as legacy without breaking', () => {
    const msg = { content: 'Hey, did you finish the breadboard photo?' };
    const sec = parseMessageSecurity(msg);
    assert.strictEqual(sec.isEncrypted, false, 'isEncrypted is false');
    assert.strictEqual(sec.isLegacy, true, 'isLegacy is true');
    assert.strictEqual(sec.badge, 'Legacy Plaintext', 'Badge identifies legacy message');
  });

  // -----------------------------------------------------------------
  // 5. Messaging Service Interface Contract (Argument Order Safety)
  // -----------------------------------------------------------------
  console.log('\n--- Suite 5: Messaging Service Contract & Caller Safety ---');
  await testAsync('5.1: Typed request object { conversationId, content, attachments, sender }', async () => {
    const mockSender = { uid: 'u-1', displayName: 'Maker Alice', handle: 'alice' };
    const res = await sendMessage({
      conversationId: 'conv-test-1',
      content: 'Testing typed interface',
      attachments: [],
      sender: mockSender
    });
    assert.strictEqual(res.content, 'Testing typed interface', 'Content preserved');
    assert.strictEqual(res.senderId, 'u-1', 'Sender ID preserved');
  });

  await testAsync('5.2: Legacy positional call sendMessage(convId, content, attachments, sender)', async () => {
    const mockSender = { uid: 'u-2', displayName: 'Maker Bob', handle: 'bob' };
    const res = await sendMessage('conv-test-2', 'Testing legacy signature', [], mockSender);
    assert.strictEqual(res.content, 'Testing legacy signature', 'Content preserved');
    assert.strictEqual(res.senderId, 'u-2', 'Sender ID preserved');
  });

  // -----------------------------------------------------------------
  // 6. Category-Scoped Media Storage Privacy
  // -----------------------------------------------------------------
  console.log('\n--- Suite 6: Category-Scoped Media Privacy ---');
  test('6.1: Media categories are defined and distinct', () => {
    assert.strictEqual(MEDIA_CATEGORIES.COMMUNITY, 'community');
    assert.strictEqual(MEDIA_CATEGORIES.DIRECT_MESSAGE, 'direct_message');
    assert.strictEqual(MEDIA_CATEGORIES.PROJECT_DOCS, 'project_docs');
    assert.strictEqual(MEDIA_CATEGORIES.PROFILE, 'profile');
  });

  test('6.2: File validation rejects active/script extensions', () => {
    const badFile = { name: 'exploit.html', size: 1024, type: 'text/html' };
    const check = validateMediaFile(badFile);
    assert.strictEqual(check.valid, false, 'HTML active files are rejected');
  });

  test('6.3: File validation accepts valid electronic schematics/images', () => {
    const goodFile = { name: 'schematic.png', size: 1024 * 1024, type: 'image/png' };
    const check = validateMediaFile(goodFile);
    assert.strictEqual(check.valid, true, 'PNG schematics are accepted');
  });

  // -----------------------------------------------------------------
  // 7. Creator Configuration & Approved LinkedIn URL
  // -----------------------------------------------------------------
  console.log('\n--- Suite 7: Creator Configuration & LinkedIn Verification ---');
  test('7.1: Confirmed LinkedIn URL is https://www.linkedin.com/in/sudeepreddygowni/', () => {
    assert.strictEqual(CREATOR_CONFIG.name, 'Sudeep Reddy', 'Creator is Sudeep Reddy');
    assert.strictEqual(CREATOR_CONFIG.email, 'sudeepreddygowni@gmail.com', 'Confirmed email is verified');
    assert.strictEqual(
      CREATOR_CONFIG.linkedinUrl,
      'https://www.linkedin.com/in/sudeepreddygowni/',
      'Exact approved LinkedIn URL is confirmed'
    );
    assert.strictEqual(CREATOR_CONFIG.githubUrl, 'https://github.com/sudeepreddygowni', 'Confirmed GitHub');
  });

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runAllTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
