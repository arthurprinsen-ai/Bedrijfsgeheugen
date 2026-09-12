import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const baseRuntime = fs.readFileSync('assets/compare-slider-runtime.js','utf8');
const v13Runtime = fs.readFileSync('assets/compare-slider-runtime-native-range-v13.js','utf8');
const pointerRuntime = fs.readFileSync('assets/compare-slider-pointer-capture-v14.js','utf8');
const bridge = fs.readFileSync('assets/compare-slider-pointer-bridge-v14.js','utf8');
const fixer = fs.readFileSync('tools/site-shell/fix-homepage-context-slider.mjs','utf8');
const headers = fs.readFileSync('_headers','utf8');

test('legacy v13 asset stays immutable and byte-identical to its canonical base', () => {
  assert.equal(v13Runtime, baseRuntime);
  assert.match(headers, /\/assets\/\*[^]*max-age=31536000, immutable/);
});

test('new immutable v14 bridge owns release identity and chains v13 then pointer capture', () => {
  assert.match(fixer, /\/assets\/compare-slider-pointer-bridge-v14\.js/);
  assert.match(bridge, /BASE='\/assets\/compare-slider-runtime-native-range-v13\.js'/);
  assert.match(bridge, /POINTER='\/assets\/compare-slider-pointer-capture-v14\.js'/);
  assert.match(bridge, /append\(BASE,function\(\)\{ append\(POINTER\); \}\)/);
  assert.ok(fs.existsSync('assets/compare-slider-pointer-bridge-v14.js'));
  assert.ok(fs.existsSync('assets/compare-slider-pointer-capture-v14.js'));
});

test('pointer capture maps physical card geometry directly to exact 0 and 100', () => {
  assert.match(pointerRuntime, /setPointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime, /releasePointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime, /event\.clientX - rect\.left/);
  assert.match(pointerRuntime, /Math\.max\(0, Math\.min\(rect\.width/);
  assert.match(pointerRuntime, /x \/ rect\.width \* 100/);
  assert.match(pointerRuntime, /value === 0 \? 'start' : value === 100 \? 'end' : 'middle'/);
  assert.match(pointerRuntime, /divider\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime, /handle\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime, /aria-valuenow/);
});

test('native range is no longer the primary mobile gesture owner under v14', () => {
  assert.match(pointerRuntime, /input\[type="range"\]/);
  assert.match(pointerRuntime, /pointer-events','none'/);
  assert.match(pointerRuntime, /range\.tabIndex = -1/);
  assert.match(fixer, /touch-action:pan-y!important/);
  assert.match(fixer, /data-bg-pointer-capture-v14="true"\] \.bg-compare-range\{pointer-events:none!important\}/);
});
