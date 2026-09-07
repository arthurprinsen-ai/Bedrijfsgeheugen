import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => { try { return await readFile(new URL(`../${path}`, import.meta.url),'utf8'); } catch { return ''; } };
const pipeline=await read('tools/prijzen-uit-de-homepage.mjs');
const fixer=await read('tools/site-shell/fix-homepage-context-slider.mjs');
const browserCheck=await read('tools/site-shell/homepage-context-slider-browser-check.mjs');
const websiteLane=await read('.github/workflows/lane-website.yml');
const visualRegistry=await read('config/ui-visual-regression.json');

test('slider guard draait na laatste homepage-builder',()=>{
  assert.match(pipeline,/applyHomepageContextSliderReadability/);
  assert.ok(pipeline.lastIndexOf('borgHomepageContextSlider()')>pipeline.lastIndexOf("bouw-v18-homepage-scroll-story.mjs"));
});

test('slider bewaart leesbare paneelbreedte en gedeelde grenzen',()=>{
  assert.match(fixer,/MIN_DESKTOP_PANE_PX\s*=\s*320/);
  assert.match(fixer,/MIN_COMPACT_PANE_PX\s*=\s*240/);
  assert.match(fixer,/HANDLE_GUTTER_PX\s*=\s*64/);
  assert.match(fixer,/data-bg-compare-compact/);
  assert.match(fixer,/aria-valuemin/);
  assert.match(fixer,/aria-valuemax/);
});

test('oude geïnjecteerde guard wordt vervangen',()=>{
  const stale='<!doctype html><html><head><style data-bg-context-slider-readable>STALE</style></head><body><div id="compareSlider"><div class="compare-before"><div class="compare-copy"></div></div><div class="compare-after"><div class="compare-copy"></div></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-readable>STALE</script></body></html>';
  const upgraded=applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded,/>STALE</);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g)||[]).length,1);
  assert.equal((upgraded.match(/<script data-bg-context-slider-readable>/g)||[]).length,1);
});

test('website lane sleept echte knop en test mobiel',()=>{
  assert.match(browserCheck,/#compareSlider/);
  assert.match(browserCheck,/1128/);
  assert.match(browserCheck,/390/);
  assert.match(browserCheck,/page\.mouse\.down/);
  assert.match(browserCheck,/page\.mouse\.move/);
  assert.match(browserCheck,/page\.mouse\.up/);
  assert.match(websiteLane,/homepage-context-slider-browser-check\.mjs/);
});

test('algemene visual-regression gate beschermt de echte slider en geen verdwenen automation-markers',()=>{
  assert.match(visualRegistry,/#compareSlider \.compare-before \.compare-copy/);
  assert.match(visualRegistry,/#compareSlider \.compare-after \.compare-copy/);
  assert.match(visualRegistry,/#compareSlider \.compare-knob/);
  for (const staleMarker of [
    'data-bg-automation-copy',
    'data-bg-automation-visual',
    'data-bg-automation-heading',
    'data-bg-automation-description',
    'data-bg-automation-card'
  ]) assert.doesNotMatch(visualRegistry,new RegExp(staleMarker));
});
