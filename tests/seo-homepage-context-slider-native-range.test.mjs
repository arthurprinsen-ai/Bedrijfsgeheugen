import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = await read('assets/compare-slider-runtime.js');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const browserCheck = await read('tools/site-shell/homepage-context-slider-browser-check.mjs');

test('alle compare-sliders krijgen een native range als primaire iOS drag-control', () => {
  assert.match(runtime, /ensureNativeRange/);
  assert.match(runtime, /createElement\(['"]input['"]\)/);
  assert.match(runtime, /type\s*=\s*['"]range['"]/);
  assert.match(runtime, /min\s*=\s*['"]0['"]/);
  assert.match(runtime, /max\s*=\s*['"]100['"]/);
  assert.match(runtime, /step\s*=\s*['"]1['"]/);
  assert.match(runtime, /bg-compare-range/);
  assert.match(runtime, /addEventListener\(['"]input['"]/);
  assert.match(runtime, /addEventListener\(['"]change['"]/);
});

test('native range bestrijkt de volle sliderbreedte zonder visuele randclamp', () => {
  assert.match(fixer, /\.bg-compare-range\{/);
  assert.match(fixer, /left:0!important/);
  assert.match(fixer, /right:0!important/);
  assert.match(fixer, /width:100%!important/);
  assert.match(fixer, /opacity:0!important/);
  assert.match(fixer, /z-index:40!important/);
  assert.doesNotMatch(fixer, /\.bg-compare-range[^}]*clamp\(/s);
});

test('browsercheck verifieert ook native range endpoints 0 en 100', () => {
  assert.match(browserCheck, /bg-compare-range/);
  assert.match(browserCheck, /rangeValue/);
  assert.match(browserCheck, /rangeValue\s*!==\s*0/);
  assert.match(browserCheck, /rangeValue\s*!==\s*100/);
});
