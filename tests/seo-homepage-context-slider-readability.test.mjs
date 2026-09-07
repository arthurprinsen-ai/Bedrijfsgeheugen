import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => { try { return await readFile(new URL(`../${path}`, import.meta.url),'utf8'); } catch { return ''; } };
const pipeline=await read('tools/prijzen-uit-de-homepage.mjs');
const normalizer=await read('tools/normaliseer-site-ui.mjs');
const fixer=await read('tools/site-shell/fix-homepage-context-slider.mjs');
const browserCheck=await read('tools/site-shell/homepage-context-slider-browser-check.mjs');
const websiteLane=await read('.github/workflows/lane-website.yml');
const visualRegistry=await read('config/ui-visual-regression.json');

test('compare-slider guard wordt site-wide toegepast tijdens normale paginanormalisatie',()=>{
  assert.match(normalizer,/applyHomepageContextSliderReadability/);
  assert.match(normalizer,/html\s*=\s*applyHomepageContextSliderReadability\(html\)/);
  assert.match(pipeline,/applyHomepageContextSliderReadability/);
});

test('alle compare-sliders gebruiken hetzelfde volledige 0-100 bereik',()=>{
  assert.match(fixer,/SLIDER_SELECTOR/);
  assert.match(fixer,/#compareSlider/);
  assert.match(fixer,/\.compare-slider/);
  assert.match(fixer,/\[data-compare-slider\]/);
  assert.match(fixer,/Math\.max\(0,Math\.min\(100/);
  assert.match(fixer,/aria-valuemin[^\n]*['"]0['"]/);
  assert.match(fixer,/aria-valuemax[^\n]*['"]100['"]/);
  assert.doesNotMatch(fixer,/safePanePx/);
  assert.doesNotMatch(fixer,/compactThreshold/);
});

test('mobiel blijft een echte reveal-slider en wordt niet naar twee gestapelde kaarten omgebouwd',()=>{
  assert.match(fixer,/touch-action:pan-y/);
  assert.match(fixer,/clip-path/);
  assert.match(fixer,/data-bg-compare-slider/);
  assert.doesNotMatch(fixer,/grid-template-columns:1fr!important/);
  assert.doesNotMatch(fixer,/\.compare-handle\{display:none!important/);
});

test('wijzigingssectie borgt vier zichtbare checks op mobiel',()=>{
  assert.match(fixer,/CHANGE_STEPS=\['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'\]/);
  assert.match(fixer,/ensureFourChangeChecks/);
  assert.match(fixer,/data-bg-change-step/);
  assert.match(fixer,/data-bg-change-check-source/);
  assert.match(fixer,/bg-change-check-fallback/);
  assert.match(fixer,/left:18px;bottom:42px;width:42px;height:42px/);
  assert.match(fixer,/ensureFourChangeChecks\(\);ensureSliders\(\)/);
});

test('oude geïnjecteerde guard wordt vervangen en ondersteunt generieke slider-markup',()=>{
  const stale='<!doctype html><html><head><style data-bg-context-slider-readable>STALE</style></head><body><div class="compare-slider"><div class="compare-before"><div class="compare-copy"><h3>Links</h3><p>Voor</p></div></div><div class="compare-after"><div class="compare-copy"><h3>Rechts</h3><p>Na</p></div></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-readable>STALE</script></body></html>';
  const upgraded=applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded,/>STALE</);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g)||[]).length,1);
  assert.equal((upgraded.match(/<script data-bg-context-slider-readable>/g)||[]).length,1);
  assert.match(upgraded,/data-bg-compare-slider/);
});

test('browsercheck verifieert uiterste links en rechts op desktop en gangbare telefoonbreedtes',()=>{
  assert.match(browserCheck,/#compareSlider/);
  assert.match(browserCheck,/1128/);
  assert.match(browserCheck,/\[320,720\]/);
  assert.match(browserCheck,/\[390,844\]/);
  assert.match(browserCheck,/\[430,932\]/);
  assert.match(browserCheck,/page\.mouse\.down/);
  assert.match(browserCheck,/page\.mouse\.move/);
  assert.match(browserCheck,/page\.mouse\.up/);
  assert.match(browserCheck,/split\s*<=\s*1/);
  assert.match(browserCheck,/split\s*>=\s*99/);
  assert.match(browserCheck,/g\.aria\.min\s*!==\s*0/);
  assert.match(browserCheck,/g\.aria\.max\s*!==\s*100/);
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
