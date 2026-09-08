import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url),'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const runtime = await read('assets/compare-slider-runtime.js');

test('mobile compare sliders hebben exact één pointer-events gesture owner en geen native range overlay',()=>{
  assert.doesNotMatch(fixer,/bg-compare-range/);
  assert.doesNotMatch(fixer,/ensureNativeRange/);
  assert.doesNotMatch(fixer,/createElement\(['"]input['"]\)/);
  assert.doesNotMatch(fixer,/type=['"]range['"]/);
  assert.doesNotMatch(runtime,/touchstart|touchmove|touchend|touchcancel/);
  assert.match(runtime,/pointerdown/);
  assert.match(runtime,/pointermove/);
  assert.match(runtime,/pointerup/);
  assert.match(runtime,/pointercancel/);
  assert.match(runtime,/setPointerCapture/);
  assert.match(runtime,/releasePointerCapture/);
});

test('pointerpositie wordt rechtstreeks van de volledige sliderbreedte naar exact 0-100 gemapt',()=>{
  assert.match(runtime,/getBoundingClientRect\(\)/);
  assert.match(runtime,/clientX\s*-\s*r\.left/);
  assert.match(runtime,/Math\.max\(0,\s*Math\.min\(r\.width/);
  assert.match(runtime,/\(x\s*\/\s*r\.width\)\s*\*\s*100/);
  assert.match(runtime,/handle\.style\.setProperty\(['"]left['"],\s*pct,\s*['"]important['"]\)/);
  assert.match(runtime,/aria-valuenow/);
});

test('mobiel laat horizontale slidergesture aan pointer-events en verticale scroll aan de browser',()=>{
  assert.match(fixer,/\[data-bg-compare-slider\]\{[^}]*touch-action:pan-y/s);
  assert.doesNotMatch(fixer,/touch-action:none!important/);
});
