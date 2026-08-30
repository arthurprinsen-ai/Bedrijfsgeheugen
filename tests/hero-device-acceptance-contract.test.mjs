import { readFile } from 'node:fs/promises';

const fail = message => { throw new Error(`Hero device acceptance contract: ${message}`); };
const manifest = JSON.parse(await readFile('assets/openart-hero-production.json', 'utf8'));
const docs = await readFile('docs/hero-video-device-acceptance.md', 'utf8');

const requiredManifestFields = [
  'derivative_sha256',
  'physical_iphone_runtime',
  'physical_iphone_runtime_derivative_sha256',
  'physical_iphone_runtime_evidence',
  'promotion_state'
];
for (const field of requiredManifestFields) {
  if (!(field in manifest)) fail(`manifest missing ${field}`);
}

if (!['PENDING', 'PASS'].includes(manifest.physical_iphone_runtime)) {
  fail(`unsupported runtime status ${manifest.physical_iphone_runtime}`);
}

if (manifest.physical_iphone_runtime === 'PASS') {
  if (manifest.physical_iphone_runtime_derivative_sha256 !== manifest.derivative_sha256) {
    fail('PASS is not content-addressed to exact derivative SHA');
  }
  if (typeof manifest.physical_iphone_runtime_evidence !== 'string' || !manifest.physical_iphone_runtime_evidence.trim()) {
    fail('PASS is missing physical-device evidence');
  }
} else {
  if (manifest.physical_iphone_runtime_derivative_sha256 !== null) {
    fail('PENDING candidate must not carry an accepted derivative SHA');
  }
  if (manifest.physical_iphone_runtime_evidence !== null) {
    fail('PENDING candidate must not carry inherited runtime evidence');
  }
  if (manifest.promotion_state !== 'MEDIA_PENDING_IPHONE_ACCEPTANCE') {
    fail('PENDING candidate has an unsafe promotion state');
  }
}

for (const token of [
  'physical_iphone_runtime_derivative_sha256',
  'derivative_sha256',
  'content-addressed',
  'PENDING',
  'fysieke iPhone'
]) {
  if (!docs.includes(token)) fail(`device acceptance memory missing token: ${token}`);
}

console.log(`Hero device acceptance contract PASS: ${manifest.derivative_sha256} (${manifest.physical_iphone_runtime})`);
