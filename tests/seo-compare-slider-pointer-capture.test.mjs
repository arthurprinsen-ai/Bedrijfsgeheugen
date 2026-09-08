import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = await read('assets/compare-slider-runtime.js');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');

test('mobile compare sliders use one pointer-capture interaction path with physical 0/100 edges', () => {
  assert.match(runtime, /setPointerCapture\(e\.pointerId\)/);
  assert.match(runtime, /clientX\s*-\s*r\.left/);
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(100/);
  assert.match(runtime, /releasePointerCapture\(e\.pointerId\)/);
  assert.match(fixer, /touch-action:pan-y/);
  assert.doesNotMatch(fixer, /bg-compare-range/);
  assert.doesNotMatch(fixer, /ensureNativeRange/);
  assert.doesNotMatch(fixer, /type=['"]range['"]/);
  assert.doesNotMatch(fixer, /left:-28px/);
  assert.doesNotMatch(fixer, /right:-28px/);
});
