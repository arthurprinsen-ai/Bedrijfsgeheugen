import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('required and production workflows fail closed on all public page visibility', async () => {
  const required = await readFile('.github/workflows/required-test.yml', 'utf8');
  const live = await readFile('.github/workflows/canonical-brand-shell-live-readback.yml', 'utf8');
  assert.match(required, /Verify all public pages are visibly rendered/);
  assert.match(required, /standalone-visibility-check\.mjs/);
  assert.match(live, /Verify every public production page is visibly rendered/);
  assert.match(live, /standalone-visibility-check\.mjs/);
});
