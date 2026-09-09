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
const pointerRuntime=await read('assets/compare-slider-pointer-capture-v14.js');
const browserCheck=await read('tools/site-shell/homepage-context-slider-browser-check.mjs');
const websiteLane=await read('.github/workflows/lane-website.yml');
const visualRegistry=await read('config/ui-visual-regression.json');

test('compare-slider guard wordt site-wide toegepast tijdens normale paginanormalisatie',()=>{
  assert.match(normalizer,/applyHomepageContextSliderReadability/);
  assert.match(normalizer,/html\s*=\s*applyHomepageContextSliderReadability\(html\)/);
  assert.match(pipeline,/applyHomepageContextSliderReadability/);
});

test('alle compare-sliders gebruiken één native volledig 0-100 bereik',()=>{
  assert.match(fixer,/SLIDER_SELECTOR/);
  assert.match(fixer,/#compareSlider/);
  assert.match(fixer,/\.compare-slider/);
  assert.match(fixer,/\[data-compare-slider\]/);
  assert.match(runtime,/SLIDER_SELECTOR\s*=\s*['"]#compareSlider,\.compare-slider,\[data-compare-slider\]['"]/);
  assert.match(runtime,/bg-compare-range/);
  assert.match(runtime,/range\.type\s*=\s*['"]range['"]/);
  assert.match(runtime,/range\.min\s*=\s*['"]0['"]/);
  assert.match(runtime,/range\.max\s*=\s*['"]100['"]/);
  assert.match(runtime,/range\.step\s*=\s*['"]1['"]/);
  assert.match(runtime,/Math\.max\(0,Math\.min\(100,Math\.round\(numeric\)\)\)/);
  assert.doesNotMatch(runtime,/safePanePx/);
  assert.doesNotMatch(runtime,/compactThreshold/);
});

test('external slider-runtime is parsebaar en wordt synchroon geladen',()=>{
  assert.doesNotThrow(()=>new Script(runtime));
  assert.match(fixer,/RUNTIME_SRC\s*=\s*['"]\/assets\/compare-slider-runtime-native-range-v13\.js['"]/);
  const upgraded=applyHomepageContextSliderReadability('<!doctype html><html><head></head><body></body></html>');
  assert.match(upgraded,/<script data-bg-context-slider-readable src="\/assets\/compare-slider-runtime-native-range-v13\.js"><\/script>/);
  assert.doesNotMatch(upgraded,/compare-slider-runtime-native-range-v13\.js" defer/);
});

test('mobiele interactie heeft één native range eigenaar en geen custom gesture transport',()=>{
  assert.match(runtime,/bg-compare-range/);
  assert.match(runtime,/range\.addEventListener\('input'/);
  assert.match(runtime,/range\.addEventListener\('change'/);
  assert.match(fixer,/\.bg-compare-range\{[^}]*inset:0!important;[^}]*width:100%!important;[^}]*height:100%!important/s);
  assert.doesNotMatch(runtime,/setPointerCapture|releasePointerCapture|takeCanonicalOwnership|cloneNode\(true\)/);
  assert.doesNotMatch(runtime,/addEventListener\(['"]pointer(?:down|move|up)['"]/);
  assert.doesNotMatch(runtime,/addEventListener\(['"]touch(?:start|move|end)['"]/);
  assert.doesNotMatch(fixer,/setPointerCapture|releasePointerCapture|data-bg-pointer-owner-ready/);
  assert.doesNotMatch(fixer,/addEventListener\(['"]pointer(?:down|move|up)['"]/);
  assert.doesNotMatch(fixer,/addEventListener\(['"]touch(?:start|move|end)['"]/);
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

test('canonical runtime gebruikt native range als enige numerieke bron zonder clone-owner',()=>{
  assert.match(runtime,/range\.value\s*=\s*String\(Math\.round\(value\)\)/);
  assert.match(runtime,/function syncFromRange\(\)\{ renderControlled\(Number\(range\.value\)\); \}/);
  assert.match(runtime,/slider\.style\.setProperty\('--bg-compare-split', pct\)/);
  assert.match(runtime,/slider\.style\.setProperty\('--split', pct\)/);
  assert.match(runtime,/data-bg-compare-endpoint/);
  assert.doesNotMatch(runtime,/takeCanonicalOwnership|cloneNode\(true\)|replaceWith\(clone\)|data-bg-compare-owner/);
  assert.doesNotMatch(runtime,/new MutationObserver\(mirrorLegacy\)|function mirrorLegacy|clamp\(24px/);
  assert.doesNotMatch(fixer,/left:clamp\(24px/);
});

test('native range waarde rendert exact beide fysieke randen',()=>{
  assert.match(runtime,/value === 0 \? 'start' : value === 100 \? 'end' : 'middle'/);
  assert.match(runtime,/divider\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(runtime,/endpoint === 'start' \? 'translateX\(0\)' : endpoint === 'end' \? 'translateX\(-100%\)'/);
  assert.match(runtime,/clip-path', 'inset\(0 ' \+ \(100 - value\)\.toFixed\(2\) \+ '% 0 0\)'/);
  assert.match(runtime,/clip-path', 'inset\(0 0 0 ' \+ value\.toFixed\(2\) \+ '%\)'/);
  assert.doesNotMatch(runtime,/clientX\s*-\s*r\.left|applyFromClientX/);
});

test('mobiel blijft een echte reveal-slider met een native range over de volle kaart',()=>{
  assert.match(fixer,/clip-path/);
  assert.match(fixer,/data-bg-compare-slider/);
  assert.match(fixer,/\.bg-compare-range\{[^}]*position:absolute!important;[^}]*inset:0!important;[^}]*width:100%!important;[^}]*height:100%!important/s);
  assert.match(fixer,/\.compare-handle\{display:none!important/);
  assert.doesNotMatch(fixer,/grid-template-columns:1fr!important/);
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

test('oude geïnjecteerde guard wordt vervangen door native-range styling en één externe runtime',()=>{
  const stale='<!doctype html><html><head><style data-bg-context-slider-readable>STALE</style></head><body><div class="compare-slider"><div class="compare-before"><div class="compare-copy"><h3>Links</h3><p>Voor</p></div></div><div class="compare-after"><div class="compare-copy"><h3>Rechts</h3><p>Na</p></div></div><div class="compare-handle"><button class="compare-knob"></button></div></div><script data-bg-context-slider-readable>STALE</script></body></html>';
  const upgraded=applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded,/>STALE</);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g)||[]).length,1);
  assert.equal((upgraded.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime-native-range-v13\.js"><\/script>/g)||[]).length,1);
  assert.match(upgraded,/data-bg-compare-slider/);
  assert.match(upgraded,/bg-compare-range/);
  assert.doesNotMatch(upgraded,/data-bg-pointer-owner-ready|data-bg-context-slider-aria-fallback/);
});

test('browsercheck zet native range op 0 en 100 en verifieert fysieke kaartbreedte en endpoints',()=>{
  assert.match(browserCheck,/#compareSlider \.bg-compare-range/);
  assert.match(browserCheck,/1128/);
  assert.match(browserCheck,/\[320,720\]/);
  assert.match(browserCheck,/\[390,844\]/);
  assert.match(browserCheck,/\[430,932\]/);
  assert.match(browserCheck,/setNativeValue/);
  assert.match(browserCheck,/range\.dispatchEvent\(new Event\('input'/);
  assert.match(browserCheck,/range\.dispatchEvent\(new Event\('change'/);
  assert.match(browserCheck,/Math\.abs\(g\.range\.width - g\.slider\.width\) > 1/);
  assert.match(browserCheck,/g\.range\.value !== 0/);
  assert.match(browserCheck,/g\.range\.value !== 100/);
  assert.match(browserCheck,/g\.endpoint !== 'start'/);
  assert.match(browserCheck,/g\.endpoint !== 'end'/);
  assert.match(browserCheck,/Math\.abs\(g\.divider\.left - g\.slider\.left\) > 1\.5/);
  assert.match(browserCheck,/Math\.abs\(g\.divider\.right - g\.slider\.right\) > 1\.5/);
  assert.doesNotMatch(browserCheck,/newCDPSession|Input\.dispatchTouchEvent|touchStart|touchMove|touchEnd/);
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

test('pointer-capture v14 is de canonieke mobiele eindpuntfix en vervangt range-thumb workarounds',()=>{
  assert.match(fixer,/compare-slider-pointer-capture-v14\.js/);
  assert.match(pointerRuntime,/setPointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime,/releasePointerCapture\(event\.pointerId\)/);
  assert.match(pointerRuntime,/event\.clientX\s*-\s*rect\.left/);
  assert.match(pointerRuntime,/Math\.max\(0,\s*Math\.min\(rect\.width/);
  assert.match(pointerRuntime,/x\s*\/\s*rect\.width\s*\*\s*100/);
  assert.match(pointerRuntime,/pointerdown/);
  assert.match(pointerRuntime,/pointermove/);
  assert.match(pointerRuntime,/pointerup/);
  assert.match(pointerRuntime,/pointercancel/);
  assert.doesNotMatch(pointerRuntime,/bg-compare-range|type\s*=\s*['"]range['"]/);
  assert.match(fixer,/touch-action:pan-y!important/);
});

test('pointer-capture v14 laat één waarde reveal divider handle en aria exact sturen',()=>{
  assert.match(pointerRuntime,/--bg-compare-split/);
  assert.match(pointerRuntime,/--split/);
  assert.match(pointerRuntime,/clip-path/);
  assert.match(pointerRuntime,/divider\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime,/handle\.style\.setProperty\('left',pct,'important'\)/);
  assert.match(pointerRuntime,/aria-valuemin/);
  assert.match(pointerRuntime,/aria-valuemax/);
  assert.match(pointerRuntime,/aria-valuenow/);
  assert.match(pointerRuntime,/value\s*===\s*0\s*\?\s*'start'/);
  assert.match(pointerRuntime,/value\s*===\s*100\s*\?\s*'end'/);
});

test('browsercheck moet echte pointerdrag buiten beide kaartgrenzen bewijzen',()=>{
  assert.match(browserCheck,/pointerdown/);
  assert.match(browserCheck,/pointermove/);
  assert.match(browserCheck,/pointerup/);
  assert.match(browserCheck,/rect\.left\s*-\s*40/);
  assert.match(browserCheck,/rect\.right\s*\+\s*40/);
});
