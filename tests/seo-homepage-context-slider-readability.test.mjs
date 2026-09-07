import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const read = async path => {
  try { return await readFile(new URL(`../${path}`, import.meta.url), 'utf8'); }
  catch { return ''; }
};

const pipeline = await read('tools/prijzen-uit-de-homepage.mjs');
const fixer = await read('tools/site-shell/fix-homepage-context-slider.mjs');
const browserCheck = await read('tools/site-shell/homepage-context-slider-browser-check.mjs');
const required = await read('.github/workflows/required-test.yml');

test('de echte live compareSlider wordt na de laatste homepage-builders fail-closed geborgd', () => {
  assert.match(pipeline, /applyHomepageContextSliderReadability/);
  assert.match(pipeline, /site-shell\/fix-homepage-context-slider/);
  const lastBuilder = pipeline.lastIndexOf("bouw-v18-homepage-scroll-story.mjs");
  const lastGuard = pipeline.lastIndexOf('borgHomepageContextSlider()');
  assert.ok(lastBuilder >= 0 && lastGuard > lastBuilder, 'slider guard moet na de laatste homepage-builder draaien');
  assert.match(fixer, /compareSlider/);
  assert.match(fixer, /data-bg-context-slider-readable/);
});

test('geen toegestane sliderstand kan een tekstpaneel tot een onleesbare strook reduceren', () => {
  assert.match(fixer, /MIN_DESKTOP_PANE_PX\s*=\s*320/);
  assert.match(fixer, /MIN_MOBILE_PANE_PX\s*=\s*132/);
  assert.match(fixer, /HANDLE_GUTTER_PX\s*=\s*40/);
  assert.match(fixer, /Math\.max\(limits\.min,\s*Math\.min\(limits\.max,/);
  assert.doesNotMatch(fixer, /aria-disabled[^\n]*compact/);
});

test('mobiel blijft een echte interactieve slider en valt nooit terug naar gestapelde panelen', () => {
  assert.doesNotMatch(fixer, /data-bg-compare-compact/);
  assert.doesNotMatch(fixer, /display:none!important/);
  assert.doesNotMatch(fixer, /display:grid!important/);
  assert.match(fixer, /touch-action:none/);
  assert.match(fixer, /pointerdown/);
  assert.match(fixer, /pointermove/);
  assert.match(fixer, /pointerup/);
  assert.match(fixer, /setPointerCapture/);
  assert.match(fixer, /aria-valuemin/);
  assert.match(fixer, /aria-valuemax/);
  assert.match(fixer, /ArrowLeft/);
  assert.match(fixer, /ArrowRight/);
});

test('een bestaande oude guard wordt bij iedere build vervangen door de actuele canonical runtime', () => {
  const stale = `<!doctype html><html><head><style data-bg-context-slider-readable>STALE_STYLE</style></head><body><div id="compareSlider"><div class="compare-before compare-side"><div class="compare-copy"><h3>Links</h3><p>tekst</p></div></div><div class="compare-after compare-side"><div class="compare-copy"><h3>Rechts</h3><p>tekst</p></div></div><div class="compare-handle"><button class="compare-knob" aria-valuemin="8" aria-valuemax="92" aria-valuenow="50"></button></div></div><script data-bg-context-slider-readable>STALE_RUNTIME</script></body></html>`;
  const upgraded = applyHomepageContextSliderReadability(stale);
  assert.doesNotMatch(upgraded, /STALE_STYLE|STALE_RUNTIME/);
  assert.match(upgraded, /applyFromClientX/);
  assert.match(upgraded, /MIN_DESKTOP_PANE_PX = 320/);
  assert.match(upgraded, /MIN_MOBILE_PANE_PX = 132/);
  assert.equal((upgraded.match(/<style data-bg-context-slider-readable>/g) || []).length, 1);
  assert.equal((upgraded.match(/<script data-bg-context-slider-readable>/g) || []).length, 1);
});

test('de beschermde Required test sleept de echte deploy-preview op desktop en mobiel', () => {
  assert.match(browserCheck, /#compareSlider/);
  assert.match(browserCheck, /1128/);
  assert.match(browserCheck, /653/);
  assert.match(browserCheck, /390/);
  assert.match(browserCheck, /hasTouch:\s*true/);
  assert.match(browserCheck, /dragKnobTo/);
  assert.match(browserCheck, /dragTouchTo/);
  assert.match(browserCheck, /dispatchEvent\(new PointerEvent/);
  assert.match(browserCheck, /assertInteractiveGeometry/);
  assert.doesNotMatch(browserCheck, /compact fallback/);
  assert.doesNotMatch(browserCheck, /handle.*verborgen/);
  assert.match(required, /homepage-context-slider-browser-check\.mjs/);
});
