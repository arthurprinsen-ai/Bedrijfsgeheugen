import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url),'utf8');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const runtime = await read('assets/compare-slider-runtime.js');
const browserCheck = await read('tools/site-shell/homepage-context-slider-browser-check.mjs');

test('change-flow gebruikt een echte railkolom in plaats van absolute pixelpositionering',()=>{
  assert.match(fixer,/--bg-change-rail-width/);
  assert.match(fixer,/grid-template-columns:\s*var\(--bg-change-rail-width\)\s+minmax\(0,1fr\)/);
  assert.match(fixer,/\.bg-change-step-rail/);
  assert.match(fixer,/\.bg-change-step-content/);
  assert.doesNotMatch(fixer,/\.bg-change-flow-check\{[^}]*left:\s*\d+px/s);
  assert.doesNotMatch(fixer,/\.bg-change-flow-check\{[^}]*top:\s*\d+px/s);
  assert.doesNotMatch(runtime,/check\.style\.top/);
  assert.doesNotMatch(runtime,/progress\.style\.left/);
});

test('runtime bouwt per stap expliciete rail- en contentcontainers',()=>{
  assert.match(runtime,/ensureStepLayout/);
  assert.match(runtime,/bg-change-step-rail/);
  assert.match(runtime,/bg-change-step-content/);
  assert.match(runtime,/appendChild\(rail\)/);
  assert.match(runtime,/appendChild\(content\)/);
});

test('browserregressie dekt phone tablet desktop en overlapvrij contract',()=>{
  for(const token of ['320','360','390','430','768','1024','1440']) assert.match(browserCheck,new RegExp(token));
  assert.match(browserCheck,/railTextOverlap/);
  assert.match(browserCheck,/horizontalOverflow/);
  assert.match(browserCheck,/orientation/);
});
