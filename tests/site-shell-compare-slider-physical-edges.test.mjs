import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/compare-slider-runtime.js','utf8');

test('canonical compare slider renders the divider flush with both physical card edges', () => {
  assert.match(runtime, /data-bg-compare-endpoint/);
  assert.match(runtime, /value\s*===\s*0\s*\?\s*['"]start['"]/);
  assert.match(runtime, /value\s*===\s*100\s*\?\s*['"]end['"]/);
  assert.match(runtime, /bg-compare-divider/);
  assert.match(runtime, /translateX\(0\)/);
  assert.match(runtime, /translateX\(-100%\)/);
  assert.match(runtime, /window\.addEventListener\(['"]pointermove['"]/);
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(r\.width/);
});

test('canonical compare slider has a non-passive iOS touch fallback that drives the same full-width renderer', () => {
  assert.match(runtime, /addEventListener\(['"]touchstart['"]/);
  assert.match(runtime, /addEventListener\(['"]touchmove['"]/);
  assert.match(runtime, /addEventListener\(['"]touchend['"]/);
  assert.match(runtime, /passive\s*:\s*false/);
  assert.match(runtime, /changedTouches/);
  assert.match(runtime, /touches/);
  assert.match(runtime, /applyFromClientX/);
});
