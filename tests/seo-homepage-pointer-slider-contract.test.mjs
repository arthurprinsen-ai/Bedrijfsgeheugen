import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = await read('assets/compare-slider-pointer-runtime.js');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');

test('compare slider heeft exact één pointer-event bron van waarheid en geen native range overlay', () => {
  assert.doesNotThrow(() => new Script(runtime));
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

test('oude native range fallback wordt uit gegenereerde pagina verwijderd en pointer runtime laadt als laatste eigenaar', () => {
  const stale = '<!doctype html><html><head><style data-bg-context-slider-readable>oud</style></head><body><div id="compareSlider"><div class="compare-before"></div><div class="compare-after"></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-aria-fallback>oud</script></body></html>';
  const upgraded = applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded, /data-bg-context-slider-aria-fallback/);
  assert.doesNotMatch(upgraded, /bg-compare-range/);
  const legacy = upgraded.indexOf('/assets/compare-slider-runtime.js');
  const pointer = upgraded.indexOf('/assets/compare-slider-pointer-runtime.js');
  assert.ok(legacy >= 0 && pointer > legacy);
});
