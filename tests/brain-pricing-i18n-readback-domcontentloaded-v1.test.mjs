import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production locale readback waits for DOM readiness, not full load', () => {
  const source = readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  const wait = source.match(/page\.waitForURL\([\s\S]*?\}, \{[^}]*\}\);/);
  assert.ok(wait, 'waitForURL block missing');
  assert.match(wait[0], /waitUntil:'domcontentloaded'/);
  assert.match(wait[0], /timeout:30_000/);
  assert.doesNotMatch(wait[0], /waitUntil:'load'/);
});
