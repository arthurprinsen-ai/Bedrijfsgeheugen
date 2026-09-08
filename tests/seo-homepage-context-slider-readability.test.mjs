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
const pointerRuntime=await read('assets/compare-slider-pointer-runtime.js');
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
  assert.match(pointerRuntime,/SLIDER_SELECTOR\s*=\s*['"]#compareSlider,\.compare-slider,\[data-compare-slider\]['"]/);
  assert.match(pointerRuntime,/Math\.max\(0,\s*Math\.min\(100/);
  assert.match(pointerRuntime,/aria-valuemin['"],?\s*['"]0['"]/);
  assert.match(pointerRuntime,/aria-valuemax['"],?\s*['"]100['"]/);
  assert.doesNotMatch(pointerRuntime,/safePanePx/);
  assert.doesNotMatch(pointerRuntime,/compactThreshold/);
});

test('shared flow runtime en pointer runtime zijn parsebaar en worden in vaste volgorde geladen',()=>{
  assert.doesNotThrow(()=>new Script(runtime));
  assert.doesNotThrow(()=>new Script(pointerRuntime));
  assert.match(fixer,/RUNTIME_SRC\s*=\s*['"]\/assets\/compare-slider-runtime\.js['"]/);
  assert.match(fixer,/POINTER_RUNTIME_SRC\s*=\s*['"]\/assets\/compare-slider-pointer-runtime\.js['"]/);
  const upgraded=applyHomepageContextSliderReadability('<!doctype html><html><head></head><body></body></html>');
  const shared=upgraded.indexOf('/assets/compare-slider-runtime.js');
  const pointer=upgraded.indexOf('/assets/compare-slider-pointer-runtime.js');
  assert.ok(shared >= 0 && pointer > shared);
  assert.doesNotMatch(upgraded,/data-bg-context-slider-aria-fallback/);
  assert.doesNotMatch(upgraded,/bg-compare-range/);
});

test('pointer runtime is de enige mobiele gesture-eigenaar en gebruikt pointer capture',()=>{
  assert.match(pointerRuntime,/pointerdown/);
  assert.match(pointerRuntime,/pointermove/);
  assert.match(pointerRuntime,/pointerup/);
  assert.match(pointerRuntime,/pointercancel/);
  assert.match(pointerRuntime,/lostpointercapture/);
  assert.match(pointerRuntime,/setPointerCapture/);
  assert.match(pointerRuntime,/releasePointerCapture/);
  assert.doesNotMatch(pointerRuntime,/touchstart/);
  assert.doesNotMatch(pointerRuntime,/touchmove/);
  assert.doesNotMatch(pointerRuntime,/touchend/);
  assert.doesNotMatch(fixer,/ensureNativeRange/);
  assert.doesNotMatch(fixer,/bg-compare-range/);
});

test('pointerpositie wordt rechtstreeks en exact naar sliderbreedte geclamped',()=>{
  assert.match(pointerRuntime,/clientX\s*-\s*r\.left/);
  assert.match(pointerRuntime,/Math\.max\(0,\s*Math\.min\(r\.width,\s*clientX\s*-\s*r\.left\)\)/);
  assert.match(pointerRuntime,/\(x \/ r\.width\) \* 100/);
  assert.match(pointerRuntime,/SNAP_THRESHOLD\s*=\s*8/);
  assert.match(pointerRuntime,/value\s*<=\s*SNAP_THRESHOLD\s*\?\s*0/);
  assert.match(pointerRuntime,/value\s*>=\s*100\s*-\s*SNAP_THRESHOLD\s*\?\s*100/);
});

test('één pointerstate stuurt reveal, gele lijn, leesbare zijde en ARIA',()=>{
  assert.match(pointerRuntime,/--bg-compare-split/);
  assert.match(pointerRuntime,/--split/);
  assert.match(pointerRuntime,/clip-path/);
  assert.match(pointerRuntime,/handle\.style\.setProperty\('left', pct, 'important'\)/);
  assert.match(pointerRuntime,/data-bg-readable-side/);
  assert.match(pointerRuntime,/value >= 50 \? 'before' : 'after'/);
  assert.match(pointerRuntime,/aria-valuenow/);
});

test('late pricing-shell CSS gebruikt exact dezelfde canonieke sliderstand en geen randclamp',()=>{
  assert.match(pipeline,/SLIDER_ENDPOINT_STYLE/);
  assert.match(pipeline,/--bg-compare-split/);
  assert.match(pipeline,/compare-before\{clip-path:inset\(0 calc\(100% - var\(--bg-compare-split,50%\)\) 0 0\)!important\}/);
  assert.match(pipeline,/compare-after\{clip-path:inset\(0 0 0 var\(--bg-compare-split,50%\)\)!important\}/);
  assert.match(pipeline,/compare-handle\{display:block!important;position:absolute!important;left:var\(--bg-compare-split,50%\)!important/);
  assert.doesNotMatch(pipeline,/--bg-final-split/);
  assert.doesNotMatch(pipeline,/left:clamp\(24px/);
});

test('mobiel blijft een echte reveal-slider en wordt niet naar twee gestapelde kaarten omgebouwd',()=>{
  assert.match(fixer,/touch-action:pan-y/);
  assert.match(fixer,/clip-path/);
  assert.match(fixer,/data-bg-compare-slider/);
  assert.doesNotMatch(fixer,/grid-template-columns:1fr!important/);
  assert.doesNotMatch(fixer,/\.compare-handle\{display:none!important/);
});

test('wijzigingssectie blijft een cumulatieve verticale voortgangsflow',()=>{
  assert.match(runtime,/CHANGE_STEPS\s*=\s*\['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'\]/);
  assert.match(runtime,/IMPACT_LABELS\s*=\s*\['Processen','Rollen','Documenten','KPI’s','Acties'\]/);
  assert.match(runtime,/initChangeFlow/);
  assert.match(runtime,/data-bg-change-flow/);
  assert.match(runtime,/data-bg-change-progress/);
  assert.match(runtime,/data-bg-change-status/);
  assert.match(runtime,/maxProgress\s*=\s*Math\.max\(maxProgress,current\)/);
  assert.match(fixer,/\.bg-change-flow-check/);
  assert.match(fixer,/\.bg-change-impact/);
  assert.match(fixer,/prefers-reduced-motion/);
});

test('wijzigingsflow gebruikt op alle formaten een echte railkolom zonder overlap hacks',()=>{
  assert.match(fixer,/--bg-change-rail-width/);
  assert.match(fixer,/grid-template-columns:var\(--bg-change-rail-width\) minmax\(0,1fr\)/);
  assert.match(fixer,/\.bg-change-step-rail/);
  assert.match(fixer,/\.bg-change-step-content/);
  assert.match(runtime,/ensureStepLayout/);
  assert.doesNotMatch(fixer,/\.bg-change-flow-check\{[^}]*left:\s*\d+px/s);
  assert.doesNotMatch(fixer,/\.bg-change-flow-check\{[^}]*top:\s*\d+px/s);
});

test('gele zoektijdteller respecteert safe-area en wijkt voor de change-flow',()=>{
  assert.match(fixer,/bottom:calc\(12px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(fixer,/bgx-lek-uit-flow/);
  assert.match(runtime,/IntersectionObserver/);
});

test('browsercheck dekt telefoon tablet desktop orientatie overlap en horizontale overflow',()=>{
  for(const token of ['320','360','390','430','768','1024','1440']) assert.match(browserCheck,new RegExp(token));
  assert.match(browserCheck,/railTextOverlap/);
  assert.match(browserCheck,/horizontalOverflow/);
  assert.match(browserCheck,/orientation/);
});

test('oude guard wordt vervangen zonder native range terug te injecteren',()=>{
  const stale='<!doctype html><html><head><style data-bg-context-slider-readable>STALE</style></head><body><div class="compare-slider"><div class="compare-before"><div class="compare-copy"><h3>Links</h3><p>Voor</p></div></div><div class="compare-after"><div class="compare-copy"><h3>Rechts</h3><p>Na</p></div></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-aria-fallback>STALE</script></body></html>';
  const upgraded=applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded,/>STALE</);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g)||[]).length,1);
  assert.equal((upgraded.match(/compare-slider-runtime\.js/g)||[]).length,1);
  assert.equal((upgraded.match(/compare-slider-pointer-runtime\.js/g)||[]).length,1);
  assert.doesNotMatch(upgraded,/bg-compare-range/);
  assert.doesNotMatch(upgraded,/data-bg-context-slider-aria-fallback/);
});

test('browsercheck gebruikt echte touch-events en verifieert fysieke uiterste links en rechts',()=>{
  assert.match(browserCheck,/#compareSlider/);
  assert.match(browserCheck,/1128/);
  assert.match(browserCheck,/\[320,720\]/);
  assert.match(browserCheck,/\[390,844\]/);
  assert.match(browserCheck,/\[430,932\]/);
  assert.match(browserCheck,/newCDPSession/);
  assert.match(browserCheck,/Input\.dispatchTouchEvent/);
  assert.match(browserCheck,/touchStart/);
  assert.match(browserCheck,/touchMove/);
  assert.match(browserCheck,/touchEnd/);
  assert.match(browserCheck,/box\.x \+ 1/);
  assert.match(browserCheck,/box\.x \+ box\.width - 1/);
  assert.match(browserCheck,/split\s*<=\s*1/);
  assert.match(browserCheck,/split\s*>=\s*99/);
  assert.match(browserCheck,/handleLeft\s*>\s*1\.5/);
  assert.match(browserCheck,/handleLeft\s*<\s*g\.slider\.width - 1\.5/);
  assert.match(websiteLane,/homepage-context-slider-browser-check\.mjs/);
});

test('algemene visual-regression gate bewaakt hero-layout; endpointbrowsercheck bezit slider-revealcontract',()=>{
  const registry=JSON.parse(visualRegistry);
  const home=registry.pages.find(page=>page.route==='/');
  assert.ok(home);
  assert.deepEqual(home.required,['main h1']);
  assert.deepEqual(home.protectedPairs,[]);
  assert.match(browserCheck,/topSideAtCenter/);
});
