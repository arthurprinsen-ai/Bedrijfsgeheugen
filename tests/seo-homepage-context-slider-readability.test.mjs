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

test('external slider-runtime is parsebaar en wordt synchroon vóór pointer fallback geladen',()=>{
  assert.doesNotThrow(()=>new Script(runtime));
  assert.match(fixer,/RUNTIME_SRC\s*=\s*['"]\/assets\/compare-slider-runtime\.js['"]/);
  const upgraded=applyHomepageContextSliderReadability('<!doctype html><html><head></head><body></body></html>');
  assert.match(upgraded,/<script data-bg-context-slider-readable src="\/assets\/compare-slider-runtime\.js"><\/script>/);
  assert.doesNotMatch(upgraded,/compare-slider-runtime\.js" defer/);
});

test('pointer fallback blijft zelf een volledige 0-100 slider als externe runtime faalt',()=>{
  assert.match(fixer,/data-bg-pointer-fallback-ready/);
  assert.match(fixer,/setPointerCapture/);
  assert.match(fixer,/releasePointerCapture/);
  assert.match(fixer,/getBoundingClientRect/);
  assert.match(fixer,/Math\.max\(0,Math\.min\(g\.width,x-g\.left\)\)/);
  assert.match(fixer,/--bg-compare-split/);
  assert.match(fixer,/clip-path/);
  assert.match(fixer,/aria-valuenow/);
  const upgraded=applyHomepageContextSliderReadability('<!doctype html><html><head></head><body></body></html>');
  assert.doesNotMatch(upgraded,/bg-compare-range|ensureNativeRange|type=['"]range['"]/);
  assert.doesNotMatch(fixer,/\.bg-compare-range\s*\{|function\s+ensureNativeRange\b|createElement\(['"]input['"]\)/);
});

test('late pricing-shell CSS gebruikt exact dezelfde canonieke sliderstand en geen randclamp',()=>{
  assert.match(pipeline,/SLIDER_ENDPOINT_STYLE/);
  assert.match(pipeline,/--bg-compare-split/);
  assert.match(pipeline,/compare-before\{clip-path:inset\(0 calc\(100% - var\(--bg-compare-split,50%\)\) 0 0\)!important\}/);
  assert.match(pipeline,/compare-after\{clip-path:inset\(0 0 0 var\(--bg-compare-split,50%\)\)!important\}/);
  assert.match(pipeline,/compare-handle\{display:block!important;position:absolute!important;left:var\(--bg-compare-split,50%\)!important/);
  assert.doesNotMatch(pipeline,/--bg-final-split/);
  assert.doesNotMatch(pipeline,/:has\(\.compare-knob/);
  assert.doesNotMatch(pipeline,/left:clamp\(24px/);
});

test('canonical runtime bezit de slider en legacy listeners kunnen eindstanden niet terugklemmen',()=>{
  assert.match(runtime,/takeCanonicalOwnership/);
  assert.match(runtime,/cloneNode\(true\)/);
  assert.match(runtime,/replaceWith\(clone\)/);
  assert.match(runtime,/data-bg-compare-owner/);
  assert.doesNotMatch(runtime,/new MutationObserver\(mirrorLegacy\)/);
  assert.doesNotMatch(runtime,/function mirrorLegacy/);
  assert.doesNotMatch(runtime,/clamp\(24px/);
  assert.doesNotMatch(fixer,/left:clamp\(24px/);
  assert.match(runtime,/handle\.style\.setProperty\('left', pct, 'important'\)/);
});

test('alle sliders maken de uitersten via Pointer Events praktisch bereikbaar en snappen naar volledige tekst',()=>{
  assert.match(runtime,/SNAP_THRESHOLD\s*=\s*8/);
  assert.match(runtime,/value\s*<=\s*SNAP_THRESHOLD\s*\?\s*0/);
  assert.match(runtime,/value\s*>=\s*100\s*-\s*SNAP_THRESHOLD\s*\?\s*100/);
  assert.match(runtime,/pointerdown/);
  assert.match(runtime,/pointermove/);
  assert.match(runtime,/pointerup/);
  assert.match(runtime,/pointercancel/);
  assert.match(runtime,/setPointerCapture/);
  assert.match(runtime,/releasePointerCapture/);
  assert.match(runtime,/slider\.style\.setProperty\('--split', pct\)/);
  assert.match(runtime,/slider\.style\.setProperty\('--bg-compare-split', pct\)/);
  assert.match(runtime,/var x = Math\.max\(0, Math\.min\(r\.width, clientX - r\.left\)\)/);
  assert.match(runtime,/\(x \/ r\.width\) \* 100/);
  assert.doesNotMatch(runtime,/touchstart|touchmove|touchend|touchcancel/);
  assert.doesNotMatch(fixer,/\.bg-compare-range\s*\{|touch-action:none!important/);
});

test('mobiel blijft een echte reveal-slider en wordt niet naar twee gestapelde kaarten omgebouwd',()=>{
  assert.match(fixer,/touch-action:pan-y/);
  assert.match(fixer,/clip-path/);
  assert.match(fixer,/data-bg-compare-slider/);
  assert.doesNotMatch(fixer,/grid-template-columns:1fr!important/);
  assert.doesNotMatch(fixer,/\.compare-handle\{display:none!important/);
});

test('mobiele tussenstand toont geen onleesbare smalle minderheidskolom',()=>{
  assert.match(fixer,/data-bg-readable-side/);
  assert.match(runtime,/slider\.setAttribute\('data-bg-readable-side',value >= 50 \? 'before' : 'after'\)/);
  assert.match(fixer,/\[data-bg-compare-slider\]\[data-bg-readable-side="before"\] \.compare-after \.compare-copy\{opacity:0!important;visibility:hidden!important\}/);
  assert.match(fixer,/\[data-bg-compare-slider\]\[data-bg-readable-side="after"\] \.compare-before \.compare-copy\{opacity:0!important;visibility:hidden!important\}/);
});

test('wijzigingssectie is op mobiel een cumulatieve verticale voortgangsflow',()=>{
  assert.match(runtime,/CHANGE_STEPS\s*=\s*\['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'\]/);
  assert.match(runtime,/IMPACT_LABELS\s*=\s*\['Processen','Rollen','Documenten','KPI’s','Acties'\]/);
  assert.match(runtime,/initChangeFlow/);
  assert.match(runtime,/data-bg-change-flow/);
  assert.match(runtime,/data-bg-change-progress/);
  assert.match(runtime,/data-bg-change-status/);
  assert.match(runtime,/maxProgress\s*=\s*Math\.max\(maxProgress,current\)/,'een kleine scroll terug mag afgeronde stappen niet resetten');
  assert.match(fixer,/\.bg-change-progress/);
  assert.match(fixer,/\.bg-change-flow-check/);
  assert.match(fixer,/\.bg-change-impact/);
  assert.match(fixer,/prefers-reduced-motion/);
  assert.doesNotMatch(fixer,/left:18px;bottom:42px;width:42px;height:42px/,'checks mogen niet meer los absoluut onder elke rij zweven');
});

test('wijzigingsflow gebruikt op alle formaten een echte railkolom zonder absolute tekst-overlap hacks',()=>{
  assert.match(fixer,/--bg-change-rail-width/);
  assert.match(fixer,/grid-template-columns:var\(--bg-change-rail-width\) minmax\(0,1fr\)/);
  assert.match(fixer,/\.bg-change-step-rail/);
  assert.match(fixer,/\.bg-change-step-content/);
  assert.match(runtime,/ensureStepLayout/);
  assert.match(runtime,/bg-change-step-rail/);
  assert.match(runtime,/bg-change-step-content/);
  assert.match(runtime,/appendChild\(rail\)/);
  assert.match(runtime,/appendChild\(content\)/);
  assert.doesNotMatch(fixer,/\.bg-change-flow-check\{[^}]*left:\s*\d+px/s);
  assert.doesNotMatch(fixer,/\.bg-change-flow-check\{[^}]*top:\s*\d+px/s);
  assert.doesNotMatch(runtime,/check\.style\.top/);
  assert.doesNotMatch(runtime,/progress\.style\.left/);
});

test('gele zoektijdteller respecteert safe-area en wijkt voor de change-flow',()=>{
  assert.match(fixer,/bottom:calc\(12px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(fixer,/bgx-lek-uit-flow/);
  assert.match(runtime,/IntersectionObserver/);
  assert.match(runtime,/data-bg-change-flow/);
});

test('browsercheck dekt telefoon tablet desktop orientatie overlap en horizontale overflow',()=>{
  for(const token of ['320','360','390','430','768','1024','1440']) assert.match(browserCheck,new RegExp(token));
  assert.match(browserCheck,/railTextOverlap/);
  assert.match(browserCheck,/horizontalOverflow/);
  assert.match(browserCheck,/orientation/);
});

test('browsercheck bewijst op echte mobiele viewports dat de flow 1 naar 4 cumulatief afrondt',()=>{
  assert.match(browserCheck,/readMobileChangeFlow/);
  assert.match(browserCheck,/data-bg-change-flow/);
  assert.match(browserCheck,/data-bg-change-step="4"/);
  assert.match(browserCheck,/doneCount\s*!==\s*4/);
  assert.match(browserCheck,/progress\s*<\s*\.98/);
  assert.match(browserCheck,/naTerug\.progress\s*\+\s*\.001\s*<\s*voltooid\.progress/);
  assert.match(browserCheck,/Processen.*Rollen.*Documenten.*KPI.*Acties/s);
});

test('oude geïnjecteerde guard wordt vervangen en ondersteunt generieke slider-markup',()=>{
  const stale='<!doctype html><html><head><style data-bg-context-slider-readable>STALE</style></head><body><div class="compare-slider"><div class="compare-before"><div class="compare-copy"><h3>Links</h3><p>Voor</p></div></div><div class="compare-after"><div class="compare-copy"><h3>Rechts</h3><p>Na</p></div></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-readable>STALE</script></body></html>';
  const upgraded=applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded,/>STALE</);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g)||[]).length,1);
  assert.equal((upgraded.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime\.js"><\/script>/g)||[]).length,1);
  assert.match(upgraded,/data-bg-compare-slider/);
  assert.match(upgraded,/data-bg-pointer-fallback-ready/);
  assert.doesNotMatch(upgraded,/bg-compare-range/);
});

test('browsercheck gebruikt echte touch-input en verifieert fysieke uiterste links en rechts',()=>{
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
  assert.match(browserCheck,/g\.aria\.min\s*!==\s*0/);
  assert.match(browserCheck,/g\.aria\.max\s*!==\s*100/);
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

test('mobiele compare-slider gebruikt Pointer Events als enige gesture owner; native range en touchlisteners zijn verboden',()=>{
  const upgraded=applyHomepageContextSliderReadability('<!doctype html><html><head></head><body></body></html>');
  assert.doesNotMatch(upgraded,/bg-compare-range|ensureNativeRange|type=['"]range['"]/);
  assert.doesNotMatch(fixer,/\.bg-compare-range\s*\{|function\s+ensureNativeRange\b|createElement\(['"]input['"]\)/);
  assert.doesNotMatch(runtime,/touchstart|touchmove|touchend|touchcancel/);
  assert.match(runtime,/pointerdown/);
  assert.match(runtime,/pointermove/);
  assert.match(runtime,/pointerup/);
  assert.match(runtime,/pointercancel/);
  assert.match(runtime,/setPointerCapture/);
  assert.match(runtime,/releasePointerCapture/);
  assert.match(runtime,/clientX\s*-\s*r\.left/);
  assert.match(runtime,/Math\.max\(0, Math\.min\(r\.width, clientX - r\.left\)\)/);
  assert.match(runtime,/\(x \/ r\.width\) \* 100/);
});
