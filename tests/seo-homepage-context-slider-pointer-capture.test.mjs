import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = await read('assets/compare-slider-runtime.js');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');

test('compare slider gebruikt één Pointer Events pad zonder verborgen native range of dubbele touch-runtime', () => {
  assert.match(runtime, /pointerdown/);
  assert.match(runtime, /pointermove/);
  assert.match(runtime, /pointerup/);
  assert.match(runtime, /setPointerCapture/);
  assert.match(runtime, /releasePointerCapture/);
  assert.match(runtime, /getBoundingClientRect\(\)/);
  assert.match(runtime, /clientX\s*-\s*r\.left/);
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(100/);

  assert.doesNotMatch(runtime, /touchstart/);
  assert.doesNotMatch(runtime, /touchmove/);
  assert.doesNotMatch(runtime, /touchend/);
  assert.doesNotMatch(fixer, /bg-compare-range/);
  assert.doesNotMatch(fixer, /ensureNativeRange/);
  assert.doesNotMatch(fixer, /data-bg-native-range-ready/);
  assert.doesNotMatch(fixer, /type=['\"]range['\"]/);
});

test('gegenereerde pagina laadt alleen de canonieke slider-runtime als interactie-eigenaar', () => {
  const html = applyHomepageContextSliderReadability('<!doctype html><html><head></head><body><div id="compareSlider"><div class="compare-before"></div><div class="compare-after"></div><div class="compare-handle"><button class="compare-knob"></button></div></div></body></html>');
  assert.equal((html.match(/compare-slider-runtime\.js/g) || []).length, 1);
  assert.doesNotMatch(html, /bg-compare-range/);
  assert.doesNotMatch(html, /data-bg-native-range-ready/);
  assert.doesNotMatch(html, /ensureNativeRange/);
});
