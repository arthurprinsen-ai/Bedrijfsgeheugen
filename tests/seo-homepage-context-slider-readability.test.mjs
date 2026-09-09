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
const bridge=await read('assets/compare-slider-runtime-native-range-v13.js');
const pointerRuntime=await read('assets/compare-slider-pointer-capture-v14.js');
const browserCheck=await read('tools/site-shell/homepage-context-slider-browser-check.mjs');
const websiteLane=await read('.github/workflows/lane-website.yml');
const visualRegistry=await read('config/ui-visual-regression.json');

test('compare-slider guard wordt site-wide toegepast tijdens normale paginanormalisatie',()=>{
  assert.match(normalizer,/applyHomepageContextSliderReadability/);
  assert.match(normalizer,/html\s*=\s*applyHomepageContextSliderReadability\(html\)/);
  assert.match(pipeline,/applyHomepageContextSliderReadability/);
});

test('alle compare-sliders delen dezelfde generieke selector en 0-100 state',()=>{
  assert.match(fixer,/SLIDER_SELECTOR/);
  assert.match(fixer,/#compareSlider/);
  assert.match(fixer,/\.compare-slider/);
  assert.match(fixer,/\[data-compare-slider\]/);
  assert.match(runtime,/SLIDER_SELECTOR\s*=\s*['"]#compareSlider,\.compare-slider,\[data-compare-slider\]['"]/);
  assert.match(pointerRuntime,/SLIDER_SELECTOR\s*=\s*['"]#compareSlider,\.compare-slider,\[data-compare-slider\]['"]/);
  assert.match(pointerRuntime,/Math\.max\(0, Math\.min\(100, value\)\)/);
});

test('base runtime en pointer runtime zijn parsebaar en bridge laadt pointer pas na base runtime',()=>{
  assert.doesNotThrow(()=>new Script(runtime));
  assert.doesNotThrow(()=>new Script(pointerRuntime));
  assert.doesNotThrow(()=>new Script(bridge));
  assert.match(fixer,/RUNTIME_SRC\s*=\s*['"]\/assets\/compare-slider-runtime-native-range-v13\.js['"]/);
  assert.match(bridge,/BASE='\/assets\/compare-slider-runtime\.js'/);
  assert.match(bridge,/POINTER='\/assets\/compare-slider-pointer-capture-v14\.js'/);
  assert.match(bridge,/load\(BASE,loadPointer\)/);
});

test('pointer capture is primaire mobiele transportlaag; native range is alleen passieve fallback',()=>{
  assert.match(pointerRuntime,/pointerdown/);
  assert.match(pointerRuntime,/pointermove/);
  assert.match(pointerRuntime,/pointerup/);
  assert.match(pointerRuntime,/pointercancel/);
  assert.match(pointerRuntime,/setPointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime,/releasePointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime,/getBoundingClientRect\(\)/);
  assert.match(pointerRuntime,/event\.clientX - rect\.left/);
  assert.match(pointerRuntime,/Math\.max\(0, Math\.min\(rect\.width/);
  assert.match(pointerRuntime,/x \/ rect\.width \* 100/);
  assert.match(pointerRuntime,/touch-action','pan-y'/);
  assert.match(pointerRuntime,/input\[type="range"\]/);
  assert.match(pointerRuntime,/pointer-events','none'/);
  assert.match(pointerRuntime,/range\.tabIndex = -1/);
});

test('één pointerwaarde stuurt reveal divider handle endpoint en ARIA exact naar 0 en 100',()=>{
  assert.match(pointerRuntime,/slider\.style\.setProperty\('--bg-compare-split',pct\)/);
  assert.match(pointerRuntime,/slider\.style\.setProperty\('--split',pct\)/);
  assert.match(pointerRuntime,/clip-path/);
  assert.match(pointerRuntime,/divider\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime,/handle\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime,/aria-valuemin','0'/);
  assert.match(pointerRuntime,/aria-valuemax','100'/);
  assert.match(pointerRuntime,/aria-valuenow/);
  assert.match(pointerRuntime,/value === 0 \? 'start' : value === 100 \? 'end' : 'middle'/);
  assert.match(pointerRuntime,/endpoint === 'start' \? 'translateX\(0\)' : endpoint === 'end' \? 'translateX\(-100%\)'/);
});

test('late pricing-shell CSS blijft dezelfde canonieke split gebruiken zonder randclamp',()=>{
  assert.match(pipeline,/SLIDER_ENDPOINT_STYLE/);
  assert.match(pipeline,/--bg-compare-split/);
  assert.match(pipeline,/compare-before\{clip-path:inset\(0 calc\(100% - var\(--bg-compare-split,50%\)\) 0 0\)!important\}/);
  assert.match(pipeline,/compare-after\{clip-path:inset\(0 0 0 var\(--bg-compare-split,50%\)\)!important\}/);
  assert.match(pipeline,/compare-handle\{display:block!important;position:absolute!important;left:var\(--bg-compare-split,50%\)!important/);
  assert.doesNotMatch(pipeline,/left:clamp\(24px/);
});

test('browsercheck bewijst echte pointerdrag tot buiten beide kaartgrenzen',()=>{
  assert.match(browserCheck,/page\.mouse\.down\(\)/);
  assert.match(browserCheck,/page\.mouse\.move\(targetX/);
  assert.match(browserCheck,/page\.mouse\.up\(\)/);
  assert.match(browserCheck,/rect\.x - 40/);
  assert.match(browserCheck,/rightEdge \+ 40/);
  assert.match(browserCheck,/g\.split > \.01/);
  assert.match(browserCheck,/g\.split < 99\.99/);
  assert.match(browserCheck,/Math\.abs\(g\.divider\.left - g\.slider\.left\) > 1\.5/);
  assert.match(browserCheck,/Math\.abs\(g\.divider\.right - g\.slider\.right\) > 1\.5/);
  for(const token of ['320','360','390','430','768','1024','1128','1440']) assert.match(browserCheck,new RegExp(token));
  assert.match(websiteLane,/homepage-context-slider-browser-check\.mjs/);
});

test('wijzigingssectie blijft een cumulatieve verticale voortgangsflow',()=>{
  assert.match(runtime,/CHANGE_STEPS\s*=\s*\['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'\]/);
  assert.match(runtime,/IMPACT_LABELS\s*=\s*\['Processen','Rollen','Documenten','KPI’s','Acties'\]/);
  assert.match(runtime,/initChangeFlow/);
  assert.match(runtime,/maxProgress\s*=\s*Math\.max\(maxProgress,current\)/);
  assert.match(fixer,/--bg-change-rail-width/);
  assert.match(fixer,/\.bg-change-step-rail/);
  assert.match(fixer,/\.bg-change-step-content/);
  assert.match(browserCheck,/readMobileChangeFlow/);
  assert.match(browserCheck,/doneCount !== 4/);
  assert.match(browserCheck,/progress < \.98/);
});

test('oude guard wordt vervangen en canonieke bridge blijft exact één keer aanwezig',()=>{
  const stale='<!doctype html><html><head><style data-bg-context-slider-readable>STALE</style></head><body><div class="compare-slider"><div class="compare-before"><div class="compare-copy"><h3>Links</h3><p>Voor</p></div></div><div class="compare-after"><div class="compare-copy"><h3>Rechts</h3><p>Na</p></div></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-readable>STALE</script></body></html>';
  const upgraded=applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded,/>STALE</);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g)||[]).length,1);
  assert.equal((upgraded.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime-native-range-v13\.js"><\/script>/g)||[]).length,1);
  assert.match(upgraded,/data-bg-compare-slider/);
});

test('algemene visual-regression gate bewaakt hero-layout; pointerbrowsercheck bezit slider-revealcontract',()=>{
  const registry=JSON.parse(visualRegistry);
  const home=registry.pages.find(page=>page.route==='/');
  assert.ok(home);
  assert.deepEqual(home.required,['main h1']);
  assert.deepEqual(home.protectedPairs,[]);
  assert.match(browserCheck,/topSideAtCenter/);
});
