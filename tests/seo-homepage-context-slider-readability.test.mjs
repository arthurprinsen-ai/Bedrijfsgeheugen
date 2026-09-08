import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => { try { return await readFile(new URL(`../${path}`, import.meta.url),'utf8'); } catch { return ''; } };
const pipeline=await read('tools/prijzen-uit-de-homepage.mjs');
const normalizer=await read('tools/normaliseer-site-ui.mjs');
const fixer=await read('tools/site-shell/fix-homepage-context-slider.mjs');
const runtime=await read('assets/compare-slider-runtime.js');
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
  assert.match(runtime,/SLIDER_SELECTOR\s*=\s*['"]#compareSlider,\.compare-slider,\[data-compare-slider\]['"]/);
  assert.match(runtime,/Math\.max\(0,\s*Math\.min\(100/);
  assert.match(runtime,/aria-valuemin['"],?\s*['"]0['"]/);
  assert.match(runtime,/aria-valuemax['"],?\s*['"]100['"]/);
  assert.doesNotMatch(runtime,/safePanePx/);
  assert.doesNotMatch(runtime,/compactThreshold/);
});

test('external slider-runtime is parsebaar als gewone browser-JavaScript',()=>{
  assert.doesNotThrow(()=>new Script(runtime));
  assert.match(fixer,/RUNTIME_SRC\s*=\s*['"]\/assets\/compare-slider-runtime\.js['"]/);
  const upgraded=applyHomepageContextSliderReadability('<!doctype html><html><head></head><body></body></html>');
  assert.match(upgraded,/<script data-bg-context-slider-readable src="\/assets\/compare-slider-runtime\.js" defer><\/script>/);
});

test('late pricing-shell CSS gebruikt exact dezelfde canonieke sliderstand',()=>{
  assert.match(pipeline,/SLIDER_ENDPOINT_STYLE/);
  assert.match(pipeline,/--bg-compare-split/);
  assert.match(pipeline,/compare-before\{clip-path:inset\(0 calc\(100% - var\(--bg-compare-split,50%\)\) 0 0\)!important\}/);
  assert.match(pipeline,/compare-after\{clip-path:inset\(0 0 0 var\(--bg-compare-split,50%\)\)!important\}/);
  assert.match(pipeline,/compare-handle\{display:block!important;position:absolute!important;left:clamp\(24px,var\(--bg-compare-split,50%\),calc\(100% - 24px\)\)!important/);
  assert.doesNotMatch(pipeline,/--bg-final-split/);
  assert.doesNotMatch(pipeline,/:has\(\.compare-knob/);
  assert.doesNotMatch(pipeline,/compare-before\{clip-path:inset\(0 var\(--split,50%\) 0 0\)!important\}/);
  assert.doesNotMatch(pipeline,/compare-after\{clip-path:inset\(0 0 0 calc\(100% - var\(--split,50%\)\)\)!important\}/);
});

test('alle sliders maken de uitersten op touch praktisch bereikbaar en snappen naar volledige tekst',()=>{
  assert.match(runtime,/SNAP_THRESHOLD\s*=\s*8/);
  assert.match(runtime,/value\s*<=\s*SNAP_THRESHOLD\s*\?\s*0/);
  assert.match(runtime,/value\s*>=\s*100\s*-\s*SNAP_THRESHOLD\s*\?\s*100/);
  assert.match(runtime,/touchstart/);
  assert.match(runtime,/touchmove/);
  assert.match(runtime,/touchend/);
  assert.match(runtime,/clamp\(24px/);
  assert.match(runtime,/new MutationObserver\(mirrorLegacy\)/);
  assert.match(runtime,/renderControlled\(readLegacy\(\)\)/);
});

test('mobiel blijft een echte reveal-slider en wordt niet naar twee gestapelde kaarten omgebouwd',()=>{
  assert.match(fixer,/touch-action:pan-y/);
  assert.match(fixer,/clip-path/);
  assert.match(fixer,/data-bg-compare-slider/);
  assert.doesNotMatch(fixer,/grid-template-columns:1fr!important/);
  assert.doesNotMatch(fixer,/\.compare-handle\{display:none!important/);
});

test('wijzigingssectie borgt vier zichtbare checks op mobiel',()=>{
  assert.match(runtime,/CHANGE_STEPS\s*=\s*\['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'\]/);
  assert.match(runtime,/ensureFourChangeChecks/);
  assert.match(runtime,/data-bg-change-step/);
  assert.match(runtime,/data-bg-change-check-source/);
  assert.match(runtime,/bg-change-check-fallback/);
  assert.match(fixer,/left:18px;bottom:42px;width:42px;height:42px/);
  assert.match(runtime,/ensureFourChangeChecks\(\);/);
  assert.match(runtime,/ensureSliders\(\);/);
});

test('oude geïnjecteerde guard wordt vervangen en ondersteunt generieke slider-markup',()=>{
  const stale='<!doctype html><html><head><style data-bg-context-slider-readable>STALE</style></head><body><div class="compare-slider"><div class="compare-before"><div class="compare-copy"><h3>Links</h3><p>Voor</p></div></div><div class="compare-after"><div class="compare-copy"><h3>Rechts</h3><p>Na</p></div></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-readable>STALE</script></body></html>';
  const upgraded=applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded,/>STALE</);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g)||[]).length,1);
  assert.equal((upgraded.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime\.js"\s+defer><\/script>/g)||[]).length,1);
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
  assert.match(browserCheck,/nearLeft/);
  assert.match(browserCheck,/nearRight/);
  assert.match(websiteLane,/homepage-context-slider-browser-check\.mjs/);
});

test('algemene visual-regression gate bewaakt hero-layout; endpointbrowsercheck bezit slider-revealcontract',()=>{
  const registry=JSON.parse(visualRegistry);
  const home=registry.pages.find(page=>page.route==='/');
  assert.ok(home);
  assert.deepEqual(home.required,['main h1']);
  assert.deepEqual(home.protectedPairs,[]);
  assert.match(browserCheck,/topSideAtCenter/);
  for (const staleMarker of [
    'data-bg-automation-copy',
    'data-bg-automation-visual',
    'data-bg-automation-heading',
    'data-bg-automation-description',
    'data-bg-automation-card'
  ]) assert.doesNotMatch(visualRegistry,new RegExp(staleMarker));
});
