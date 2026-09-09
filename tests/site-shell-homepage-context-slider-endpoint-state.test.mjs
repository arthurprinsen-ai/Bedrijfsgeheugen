import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/compare-slider-runtime.js','utf8');

test('canonical runtime owns the mobile readable endpoint state', () => {
  assert.match(runtime, /matchMedia\([^)]*max-width:720px/);
  assert.match(runtime, /value\s*<=\s*20[^\n;]*setAttribute\('data-bg-readable-side','after'\)/);
  assert.match(runtime, /value\s*>=\s*80[^\n;]*setAttribute\('data-bg-readable-side','before'\)/);
  assert.match(runtime, /removeAttribute\('data-bg-readable-side'\)/);
});
