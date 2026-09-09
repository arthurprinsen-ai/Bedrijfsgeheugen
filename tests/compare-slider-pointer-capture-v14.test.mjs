import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => { try { return await readFile(new URL(`../${path}`, import.meta.url),'utf8'); } catch { return ''; } };
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const pointerRuntime = await read('assets/compare-slider-pointer-capture-v14.js');
const browserCheck = await read('tools/site-shell/homepage-context-slider-browser-check.mjs');

test('compare slider gebruikt pointer capture als primaire mobiele transportlaag', () => {
  assert.match(fixer, /compare-slider-pointer-capture-v14\.js/);
  assert.match(pointerRuntime, /pointerdown/);
  assert.match(pointerRuntime, /pointermove/);
  assert.match(pointerRuntime, /pointerup/);
  assert.match(pointerRuntime, /pointercancel/);
  assert.match(pointerRuntime, /setPointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime, /releasePointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime, /getBoundingClientRect\(\)/);
  assert.match(pointerRuntime, /event\.clientX\s*-\s*rect\.left/);
  assert.match(pointerRuntime, /Math\.max\(0,\s*Math\.min\(rect\.width/);
  assert.match(pointerRuntime, /x\s*\/\s*rect\.width\s*\*\s*100/);
  assert.doesNotMatch(pointerRuntime, /type\s*=\s*['"]range['"]/);
  assert.doesNotMatch(pointerRuntime, /bg-compare-range/);
});

test('één pointerwaarde stuurt reveal divider handle en aria exact naar 0 en 100', () => {
  assert.match(pointerRuntime, /--bg-compare-split/);
  assert.match(pointerRuntime, /--split/);
  assert.match(pointerRuntime, /clip-path/);
  assert.match(pointerRuntime, /divider\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime, /handle\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime, /aria-valuemin/);
  assert.match(pointerRuntime, /aria-valuemax/);
  assert.match(pointerRuntime, /aria-valuenow/);
  assert.match(pointerRuntime, /value\s*===\s*0\s*\?\s*'start'/);
  assert.match(pointerRuntime, /value\s*===\s*100\s*\?\s*'end'/);
});

test('slider behoudt verticale pagina-scroll maar eigent horizontale drag toe', () => {
  assert.match(fixer, /touch-action:pan-y!important/);
  assert.doesNotMatch(fixer, /\.bg-compare-range\{/);
});

test('browsercheck bewijst echte pointerdrag buiten beide randen', () => {
  assert.match(browserCheck, /pointerdown/);
  assert.match(browserCheck, /pointermove/);
  assert.match(browserCheck, /pointerup/);
  assert.match(browserCheck, /slider\.getBoundingClientRect\(\)/);
  assert.match(browserCheck, /rect\.left\s*-\s*40/);
  assert.match(browserCheck, /rect\.right\s*\+\s*40/);
  assert.match(browserCheck, /split\s*>\s*\.01/);
  assert.match(browserCheck, /split\s*<\s*99\.99/);
  assert.match(browserCheck, /divider\.left/);
  assert.match(browserCheck, /divider\.right/);
});
