import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = await read('assets/compare-slider-runtime.js');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');

test('compare slider heeft exact één pointer-event bron van waarheid en geen native range overlay', () => {
  assert.doesNotMatch(fixer, /bg-compare-range/);
  assert.doesNotMatch(fixer, /ensureNativeRange/);
  assert.doesNotMatch(fixer, /createElement\(['"]input['"]\)/);
  assert.doesNotMatch(runtime, /touchstart/);
  assert.doesNotMatch(runtime, /touchmove/);
  assert.doesNotMatch(runtime, /touchend/);
  assert.match(runtime, /pointerdown/);
  assert.match(runtime, /pointermove/);
  assert.match(runtime, /pointerup/);
  assert.match(runtime, /setPointerCapture/);
});

test('pointerpositie wordt rechtstreeks op de volledige sliderbreedte geclampt naar fysieke 0 en 100', () => {
  assert.match(runtime, /getBoundingClientRect\(\)/);
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(r\.width,\s*clientX\s*-\s*r\.left\)\)/);
  assert.match(runtime, /\(x\s*\/\s*r\.width\)\s*\*\s*100/);
  assert.match(runtime, /handle\.style\.setProperty\(['"]left['"],\s*pct,\s*['"]important['"]\)/);
  assert.match(runtime, /aria-valuemin['"],?\s*['"]0['"]/);
  assert.match(runtime, /aria-valuemax['"],?\s*['"]100['"]/);
});

test('mobiel bewaart verticale scroll maar laat horizontale slider door pointer events afhandelen', () => {
  assert.match(fixer, /\[data-bg-compare-slider\][^{]*\{[^}]*touch-action:pan-y/s);
  assert.doesNotMatch(fixer, /touch-action:none!important/);
});
