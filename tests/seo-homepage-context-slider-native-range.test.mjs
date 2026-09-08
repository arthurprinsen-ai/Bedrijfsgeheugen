import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const browserCheck = await read('tools/site-shell/homepage-context-slider-browser-check.mjs');

test('alle compare-sliders krijgen na legacy listeners één native range gesture-control', () => {
  assert.match(fixer, /ensureNativeRange/);
  assert.match(fixer, /createElement\(['"]input['"]\)/);
  assert.match(fixer, /\.type=['"]range['"]/);
  assert.match(fixer, /\.min=['"]0['"]/);
  assert.match(fixer, /\.max=['"]100['"]/);
  assert.match(fixer, /\.step=['"]1['"]/);
  assert.match(fixer, /bg-compare-range/);
  assert.match(fixer, /addEventListener\(['"]input['"]/);
  assert.match(fixer, /addEventListener\(['"]change['"]/);
  assert.match(fixer, /cloneNode\(true\)/);
  assert.match(fixer, /data-bg-native-range-ready/);
  assert.match(fixer, /data-bg-compare-owner','canonical/);
  assert.doesNotMatch(fixer, /removeAttribute\('data-bg-compare-version'\)/);
});

test('native range bestrijkt de volle sliderbreedte zonder visuele randclamp', () => {
  assert.match(fixer, /\.bg-compare-range\{/);
  assert.match(fixer, /left:0!important/);
  assert.match(fixer, /right:0!important/);
  assert.match(fixer, /width:100%!important/);
  assert.match(fixer, /opacity:0!important/);
  assert.match(fixer, /z-index:40!important/);
  assert.match(fixer, /touch-action:none!important/);
  assert.doesNotMatch(fixer, /\.bg-compare-range[^}]*clamp\(/s);
});

test('browsertest bewaakt de echte native range en fysieke 0-100 eindstanden', () => {
  assert.match(browserCheck, /bg-compare-range/);
  assert.match(browserCheck, /range:\s*\{/);
  assert.match(browserCheck, /g\.range\.min\s*!==\s*0/);
  assert.match(browserCheck, /g\.range\.max\s*!==\s*100/);
  assert.match(browserCheck, /g\.range\.tabIndex\s*<\s*0/);
  assert.match(browserCheck, /g\.range\.value\s*>\s*1/);
  assert.match(browserCheck, /g\.range\.value\s*<\s*99/);
  assert.match(browserCheck, /split\s*<=\s*1/);
  assert.match(browserCheck, /split\s*>=\s*99/);
  assert.match(browserCheck, /handleLeft\s*>\s*1\.5/);
  assert.match(browserCheck, /handleLeft\s*<\s*g\.slider\.width - 1\.5/);
  assert.match(browserCheck, /Input\.dispatchTouchEvent/);
});
