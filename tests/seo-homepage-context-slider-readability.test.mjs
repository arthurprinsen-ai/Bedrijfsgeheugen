import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pipeline = await readFile(new URL('../tools/prijzen-uit-de-homepage.mjs', import.meta.url), 'utf8');
let fixer = '';
try { fixer = await readFile(new URL('../tools/site-shell/fix-homepage-context-slider.mjs', import.meta.url), 'utf8'); } catch {}

test('de echte homepage compareSlider wordt in de finale build fail-closed geborgd', () => {
  assert.match(pipeline, /applyHomepageContextSliderReadability/);
  assert.match(pipeline, /site-shell\/fix-homepage-context-slider/);
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

test('tekst en handle krijgen onafhankelijke veilige layoutregels en compact fallback', () => {
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
