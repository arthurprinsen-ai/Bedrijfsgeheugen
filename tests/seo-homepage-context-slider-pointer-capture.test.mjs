import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const runtime = await read('assets/compare-slider-runtime.js');

test('compare slider gebruikt één finale Pointer Events eigenaar zonder verborgen native range', () => {
  for (const source of [fixer, runtime]) {
    assert.match(source, /pointerdown/);
    assert.match(source, /pointermove/);
    assert.match(source, /pointerup/);
    assert.match(source, /setPointerCapture/);
    assert.match(source, /getBoundingClientRect\(\)/);
    assert.match(source, /window\.addEventListener\('pointermove'/);
    assert.match(source, /window\.addEventListener\('pointerup'/);
    assert.doesNotMatch(source, /touchstart/);
    assert.doesNotMatch(source, /touchmove/);
    assert.doesNotMatch(source, /touchend/);
    assert.doesNotMatch(source, /bg-compare-range/);
    assert.doesNotMatch(source, /ensureNativeRange/);
    assert.doesNotMatch(source, /data-bg-native-range-ready/);
    assert.doesNotMatch(source, /type=['\"]range['\"]/);
  }
  assert.match(fixer, /releasePointerCapture/);
  assert.match(fixer, /clientX-r\.left/);
  assert.match(fixer, /Math\.max\(0,Math\.min\(r\.width,clientX-r\.left\)\)/);
  assert.match(fixer, /data-bg-pointer-owner-ready/);
});

test('gegenereerde pagina laadt de canonieke runtime plus één pointer-owner zonder native range', () => {
  const html = applyHomepageContextSliderReadability('<!doctype html><html><head></head><body><div id="compareSlider"><div class="compare-before"></div><div class="compare-after"></div><div class="compare-handle"><button class="compare-knob"></button></div></div></body></html>');
  assert.equal((html.match(/compare-slider-runtime\.js/g) || []).length, 1);
  assert.match(html, /data-bg-pointer-owner-ready/);
  assert.doesNotMatch(html, /bg-compare-range/);
  assert.doesNotMatch(html, /data-bg-native-range-ready/);
  assert.doesNotMatch(html, /ensureNativeRange/);
});
