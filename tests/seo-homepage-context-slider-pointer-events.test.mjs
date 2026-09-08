import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const pointerRuntime = await read('assets/compare-slider-pointer-runtime.js');
const browserCheck = await read('tools/site-shell/homepage-context-slider-browser-check.mjs');

test('mobiele compare-slider heeft één pointer-event eigenaar zonder native range overlay', () => {
  assert.match(pointerRuntime, /pointerdown/);
  assert.match(pointerRuntime, /pointermove/);
  assert.match(pointerRuntime, /pointerup/);
  assert.match(pointerRuntime, /setPointerCapture/);
  assert.match(pointerRuntime, /releasePointerCapture/);
  assert.match(pointerRuntime, /clientX\s*-\s*r\.left/);
  assert.match(pointerRuntime, /Math\.max\(0,\s*Math\.min\(r\.width/);
  assert.doesNotMatch(pointerRuntime, /touchstart/);
  assert.doesNotMatch(pointerRuntime, /touchmove/);
  assert.doesNotMatch(pointerRuntime, /touchend/);
  assert.doesNotMatch(fixer, /ensureNativeRange/);
  assert.doesNotMatch(fixer, /bg-compare-range/);
  assert.doesNotMatch(fixer, /type=['"]range['"]/);
});

test('dezelfde pointerwaarde bestuurt reveal, gele lijn en ARIA over exact 0-100', () => {
  assert.match(pointerRuntime, /--bg-compare-split/);
  assert.match(pointerRuntime, /--split/);
  assert.match(pointerRuntime, /clip-path/);
  assert.match(pointerRuntime, /handle\.style\.setProperty\('left', pct, 'important'\)/);
  assert.match(pointerRuntime, /aria-valuemin['"],?\s*['"]0['"]/);
  assert.match(pointerRuntime, /aria-valuemax['"],?\s*['"]100['"]/);
  assert.match(pointerRuntime, /SNAP_THRESHOLD\s*=\s*8/);
  assert.match(pointerRuntime, /value\s*<=\s*SNAP_THRESHOLD\s*\?\s*0/);
  assert.match(pointerRuntime, /value\s*>=\s*100\s*-\s*SNAP_THRESHOLD\s*\?\s*100/);
  assert.match(fixer, /touch-action:pan-y/);
});

test('browsergate blijft echte touch-input naar de fysieke linker- en rechterrand sturen', () => {
  assert.match(browserCheck, /Input\.dispatchTouchEvent/);
  assert.match(browserCheck, /box\.x \+ 1/);
  assert.match(browserCheck, /box\.x \+ box\.width - 1/);
  assert.match(browserCheck, /split\s*<=\s*1/);
  assert.match(browserCheck, /split\s*>=\s*99/);
});
