import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const runtime = await read('assets/compare-slider-runtime.js');

test('canonical runtime is the single mobile Pointer Events owner with window fallback', () => {
  assert.match(runtime, /pointerdown/);
  assert.match(runtime, /pointermove/);
  assert.match(runtime, /pointerup/);
  assert.match(runtime, /setPointerCapture/);
  assert.match(runtime, /releasePointerCapture/);
  assert.match(runtime, /window\.addEventListener\('pointermove'/);
  assert.match(runtime, /window\.addEventListener\('pointerup'/);
  assert.match(runtime, /getBoundingClientRect\(\)/);
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(r\.width,\s*clientX\s*-\s*r\.left\)\)/);
  assert.match(runtime, /\(x\s*\/\s*r\.width\)\s*\*\s*100/);
  assert.match(runtime, /data-bg-pointer-owner-ready/);
  assert.match(runtime, /data-bg-pointer-listeners/);
  assert.doesNotMatch(runtime, /touchstart/);
  assert.doesNotMatch(runtime, /touchmove/);
  assert.doesNotMatch(runtime, /touchend/);
  assert.doesNotMatch(runtime, /bg-compare-range/);
  assert.doesNotMatch(runtime, /type=['\"]range['\"]/);
});

test('fallback contains no native range or touch owner that can fight the canonical runtime', () => {
  assert.doesNotMatch(fixer, /touchstart/);
  assert.doesNotMatch(fixer, /touchmove/);
  assert.doesNotMatch(fixer, /touchend/);
  assert.doesNotMatch(fixer, /bg-compare-range/);
  assert.doesNotMatch(fixer, /ensureNativeRange/);
  assert.doesNotMatch(fixer, /data-bg-native-range-ready/);
  assert.doesNotMatch(fixer, /type=['\"]range['\"]/);
});

test('gegenereerde pagina laadt de canonieke runtime plus pointer fallback zonder native range', () => {
  const html = applyHomepageContextSliderReadability('<!doctype html><html><head></head><body><div id="compareSlider"><div class="compare-before"></div><div class="compare-after"></div><div class="compare-handle"><button class="compare-knob"></button></div></div></body></html>');
  assert.equal((html.match(/compare-slider-runtime\.js/g) || []).length, 1);
  assert.match(html, /data-bg-pointer-owner-ready/);
  assert.doesNotMatch(html, /bg-compare-range/);
  assert.doesNotMatch(html, /data-bg-native-range-ready/);
  assert.doesNotMatch(html, /ensureNativeRange/);
});
