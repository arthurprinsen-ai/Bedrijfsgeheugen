import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production locale readback waits for DOM-ready route navigation', () => {
  const verifier = readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  const injector = readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(verifier, /waitUntil:'domcontentloaded'/);
  assert.match(verifier, /timeout:30_000/);
  assert.match(verifier, /path === expected/);
  assert.match(injector, /cms-i18n-20260929-5/);
});
