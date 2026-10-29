import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
test('historical replay: the build adds exactly one booking link next to the scan result signup', () => {
  const ANCHOR = '<button class="secondary v18-btn-ghost bgx-magneet" data-view="signup">Aanmelden</button>';
  const fixture = '<div>' + ANCHOR + '</div>';
  assert.equal(fixture.split(ANCHOR).length, 2);
  assert.match(src, /SCAN_BOOK_ANCHOR/);
  assert.match(src, /calendly\.com\/arthur-prinsen/);
});
test('shadow: the guard fails the build when the anchor is not unique', () => {
  assert.match(src, /scan result booking anchor not unique/);
});
test('canary: the payload integrity checks run before the new replacement', () => {
  const integrity = src.indexOf('payload integrity mismatch');
  const booking = src.indexOf('SCAN_BOOK_ANCHOR');
  assert.ok(integrity > 0 && booking > integrity);
});
