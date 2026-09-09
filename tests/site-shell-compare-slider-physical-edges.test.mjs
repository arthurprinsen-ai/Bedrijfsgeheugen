import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/compare-slider-runtime.js','utf8');
const fixer = fs.readFileSync('tools/site-shell/fix-homepage-context-slider.mjs','utf8');

test('compare slider owns a visible divider that reaches the physical card edges', () => {
  assert.match(runtime, /data-bg-compare-endpoint/);
  assert.match(runtime, /value\s*===\s*0[^\n;]*['"]start['"]/);
  assert.match(runtime, /value\s*===\s*100[^\n;]*['"]end['"]/);
  assert.match(fixer, /data-bg-compare-slider[^\n]*::after/);
  assert.match(fixer, /data-bg-compare-endpoint=[\\"']start[\\"']/);
  assert.match(fixer, /data-bg-compare-endpoint=[\\"']end[\\"']/);
  assert.match(fixer, /translateX\(0\)/);
  assert.match(fixer, /translateX\(-100%\)/);
});
