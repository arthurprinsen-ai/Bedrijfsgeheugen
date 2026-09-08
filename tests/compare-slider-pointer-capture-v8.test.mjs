import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = await read('assets/compare-slider-runtime.js');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');

test('compare slider has one Pointer Events implementation with window fallback and no touch/native-range owner', () => {
  for (const source of [runtime, fixer]) {
    assert.match(source, /pointerdown/);
    assert.match(source, /setPointerCapture/);
    assert.match(source, /window\.addEventListener\('pointermove'/);
    assert.match(source, /window\.addEventListener\('pointerup'/);
    assert.match(source, /getBoundingClientRect\(\)/);
    assert.doesNotMatch(source, /touchstart/);
    assert.doesNotMatch(source, /touchmove/);
    assert.doesNotMatch(source, /touchend/);
    assert.doesNotMatch(source, /bg-compare-range/);
  }
});

test('clientX is clamped to the physical card bounds before converting to exact 0-100 percent', () => {
  for (const source of [runtime, fixer]) {
    assert.match(source, /Math\.max\(0,\s*Math\.min\(r\.width,\s*clientX\s*-\s*r\.left\)\)/);
    assert.match(source, /\(x\s*\/\s*r\.width\)\s*\*\s*100/);
  }
});
