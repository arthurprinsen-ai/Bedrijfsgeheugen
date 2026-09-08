import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const runtime = await read('assets/compare-slider-runtime.js');
const browserCheck = await read('tools/site-shell/homepage-context-slider-browser-check.mjs');

test('mobiele compare-slider heeft één pointer-event eigenaar zonder native range overlay', () => {
  assert.match(runtime, /pointerdown/);
  assert.match(runtime, /pointermove/);
  assert.match(runtime, /pointerup/);
  assert.match(runtime, /setPointerCapture/);
  assert.match(runtime, /releasePointerCapture/);
  assert.match(runtime, /clientX\s*-\s*r\.left/);
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(r\.width/);
  assert.doesNotMatch(runtime, /touchstart/);
  assert.doesNotMatch(runtime, /touchmove/);
  assert.doesNotMatch(runtime, /touchend/);
  assert.doesNotMatch(fixer, /ensureNativeRange/);
  assert.doesNotMatch(fixer, /bg-compare-range/);
  assert.doesNotMatch(fixer, /type=['"]range['"]/);
});

test('dezelfde pointerwaarde bestuurt reveal, gele lijn en ARIA over exact 0-100', () => {
  assert.match(runtime, /--bg-compare-split/);
  assert.match(runtime, /--split/);
  assert.match(runtime, /clip-path/);
  assert.match(runtime, /handle\.style\.setProperty\('left', pct, 'important'\)/);
  assert.match(runtime, /aria-valuemin['"],?\s*['"]0['"]/);
  assert.match(runtime, /aria-valuemax['"],?\s*['"]100['"]/);
  assert.match(runtime, /SNAP_THRESHOLD\s*=\s*8/);
  assert.match(runtime, /value\s*<=\s*SNAP_THRESHOLD\s*\?\s*0/);
  assert.match(runtime, /value\s*>=\s*100\s*-\s*SNAP_THRESHOLD\s*\?\s*100/);
  assert.match(fixer, /touch-action:pan-y/);
});

test('browsergate blijft echte touch-input naar de fysieke linker- en rechterrand sturen', () => {
  assert.match(browserCheck, /Input\.dispatchTouchEvent/);
  assert.match(browserCheck, /box\.x \+ 1/);
  assert.match(browserCheck, /box\.x \+ box\.width - 1/);
  assert.match(browserCheck, /split\s*<=\s*1/);
  assert.match(browserCheck, /split\s*>=\s*99/);
  assert.doesNotMatch(browserCheck, /native range moet actief/);
});
