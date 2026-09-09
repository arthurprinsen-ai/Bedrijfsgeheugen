import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtimePath = 'assets/compare-slider-runtime.js';
const canonicalPath = 'assets/compare-slider-runtime-canonical-v14.js';
const runtime = fs.readFileSync(runtimePath, 'utf8');
const fixer = fs.readFileSync('tools/site-shell/fix-homepage-context-slider.mjs', 'utf8');
const headers = fs.readFileSync('_headers', 'utf8');

test('canonical compare slider owns physical pointer coordinates once', () => {
  assert.match(runtime, /VERSION\s*=\s*['"]canonical-v14['"]/);
  assert.match(runtime, /data-bg-compare-owner/);
  assert.match(runtime, /getBoundingClientRect\(\)/);
  assert.match(runtime, /clientX/);
  assert.match(runtime, /clientX\s*-\s*rect\.left/);
  assert.match(runtime, /rect\.width/);
  assert.match(runtime, /Math\.max\(0\s*,\s*Math\.min\(100/);
  assert.match(runtime, /addEventListener\(['"]pointerdown['"]/);
  assert.match(runtime, /addEventListener\(['"]pointermove['"]/);
  assert.match(runtime, /addEventListener\(['"]keydown['"]/);
});

test('physical endpoint rendering is independent of handle or knob width', () => {
  assert.match(runtime, /data-bg-compare-endpoint/);
  assert.match(runtime, /value\s*===\s*0\s*\?\s*['"]start['"]/);
  assert.match(runtime, /value\s*===\s*100\s*\?\s*['"]end['"]/);
  assert.match(runtime, /bg-compare-divider/);
  assert.match(runtime, /--bg-compare-split/);
  assert.doesNotMatch(runtime, /(?:handle|knob)\.(?:offsetWidth|clientWidth)/i);
  assert.doesNotMatch(runtime, /getBoundingClientRect\(\)\.width[^\n]*(?:handle|knob)/i);
});

test('homepage shell fixer injects only canonical v14 and no second interaction owner', () => {
  assert.match(fixer, /\/assets\/compare-slider-runtime-canonical-v14\.js/);
  assert.doesNotMatch(fixer, /compare-slider-runtime-native-range-v13\.js/);
  assert.doesNotMatch(fixer, /const\s+BOOTSTRAP_TAG\s*=/);
  assert.doesNotMatch(fixer, /addEventListener\(['"](?:pointerdown|pointermove|pointerup|touchstart|touchmove|touchend|input|change)['"]/);
  assert.doesNotMatch(fixer, /(?:setPointerCapture|releasePointerCapture)\s*\(/);
});

test('immutable caching uses a new versioned canonical runtime asset', () => {
  assert.match(headers, /\/assets\/\*[^]*max-age=31536000, immutable/);
  assert.ok(fs.existsSync(canonicalPath), 'canonical v14 runtime asset must exist');
  const canonical = fs.readFileSync(canonicalPath, 'utf8');
  assert.equal(canonical, runtime, 'compatibility alias must be byte-identical to canonical runtime');
});

test('keyboard contract reaches exact endpoints on the same normalized state', () => {
  assert.match(runtime, /['"]Home['"]/);
  assert.match(runtime, /['"]End['"]/);
  assert.match(runtime, /aria-valuemin/);
  assert.match(runtime, /aria-valuemax/);
  assert.match(runtime, /aria-valuenow/);
  assert.match(runtime, /tabIndex\s*=\s*0/);
});
