import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
test('historical replay: exactly one signup button matches the booking pattern and gets a booking link', () => {
  const re = /<button class="secondary v18-btn-ghost bgx-magneet" data-view="signup">([^<]*)<\/button>/g;
  const fixture = '<div><button class="secondary v18-btn-ghost bgx-magneet" data-view="signup">Aanmelden</button></div>';
  assert.equal((fixture.match(re) || []).length, 1);
  assert.match(src, /SCAN_BOOK_RE/);
  assert.match(src, /calendly\.com\/arthur-prinsen/);
});
test('shadow: the build fails when the pattern is not unique', () => {
  assert.match(src, /scan result booking anchor not unique/);
});
test('canary: the integrity checks run before the booking replacement', () => {
  const integrity = src.indexOf('payload integrity mismatch');
  const booking = src.indexOf('SCAN_BOOK_RE');
  assert.ok(integrity > 0 && booking > integrity);
});
