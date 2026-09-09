import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/compare-slider-runtime.js','utf8');
const finalizer = fs.readFileSync('tools/site-shell/fix-homepage-context-slider.mjs','utf8');

test('mobile compare slider owns true 0 and 100 visual endpoints', () => {
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(100/);
  assert.match(runtime, /value\s*<=\s*SNAP_THRESHOLD\s*\?\s*0/);
  assert.match(runtime, /value\s*>=\s*100\s*-\s*SNAP_THRESHOLD\s*\?\s*100/);
  assert.match(runtime, /handle\.style\.setProperty\('left',\s*pct,\s*'important'\)/);
  assert.match(runtime, /beforeSide\.style\.setProperty\('clip-path',\s*'inset\(0 '\s*\+\s*\(100\s*-\s*value\)/);
  assert.match(runtime, /afterSide\.style\.setProperty\('clip-path',\s*'inset\(0 0 0 '\s*\+\s*value/);
});

test('mobile endpoint states fully hide the opposite copy and expose the selected copy', () => {
  assert.match(finalizer, /data-bg-readable-side="before"/);
  assert.match(finalizer, /data-bg-readable-side="after"/);
  assert.match(finalizer, /\.compare-after\s*\.compare-copy\{opacity:0!important;visibility:hidden!important/);
  assert.match(finalizer, /\.compare-before\s*\.compare-copy\{opacity:0!important;visibility:hidden!important/);
  assert.match(finalizer, /\.compare-before\s*\.compare-copy,\[data-bg-compare-slider\]\[data-bg-readable-side="after"\]\s*\.compare-after\s*\.compare-copy\{opacity:1!important;visibility:visible!important/);
});

test('pointer capture keeps dragging active beyond the card so iOS can reach both edges', () => {
  assert.match(runtime, /setPointerCapture/);
  assert.match(runtime, /window\.addEventListener\('pointermove'/);
  assert.match(runtime, /window\.addEventListener\('pointerup'/);
  assert.match(runtime, /Math\.max\(0,\s*Math\.min\(r\.width,\s*clientX\s*-\s*r\.left\)\)/);
});
