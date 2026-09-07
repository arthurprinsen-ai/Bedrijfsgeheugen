import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
  assert.match(fixer, /MIN_COMPACT_PANE_PX\s*=\s*240/);
  assert.match(fixer, /HANDLE_GUTTER_PX\s*=\s*64/);
  assert.match(fixer, /minPct\s*=\s*Math\.min\(45,/);
  assert.match(fixer, /Math\.max\(limits\.min,\s*Math\.min\(limits\.max,/);
  assert.doesNotMatch(fixer, /Math\.max\((?:6|8|30),\s*Math\.min\((?:94|92|70)/);
});

test('tekst, handle, compact fallback en accessibility delen één veilige grens', () => {
  assert.match(fixer, /\.compare-before \.compare-copy/);
  assert.match(fixer, /\.compare-after \.compare-copy/);
  assert.match(fixer, /padding-right:var\(--bg-compare-gutter/);
  assert.match(fixer, /padding-left:var\(--bg-compare-gutter/);
  assert.match(fixer, /data-bg-compare-compact/);
  assert.match(fixer, /aria-valuemin/);
  assert.match(fixer, /aria-valuemax/);
  assert.match(fixer, /ArrowLeft/);
  assert.match(fixer, /ArrowRight/);
});

test('de beschermde Required test sleept de echte deploy-preview naar beide uitersten en test mobiel', () => {
  assert.match(browserCheck, /#compareSlider/);
  assert.match(browserCheck, /1128/);
  assert.match(browserCheck, /653/);
  assert.match(browserCheck, /390/);
  assert.match(browserCheck, /data-bg-compare-compact/);
  assert.match(browserCheck, /compare-before \.compare-copy/);
  assert.match(browserCheck, /compare-after \.compare-copy/);
  assert.match(browserCheck, /page\.mouse\.click/);
  assert.match(required, /homepage-context-slider-browser-check\.mjs/);
});
