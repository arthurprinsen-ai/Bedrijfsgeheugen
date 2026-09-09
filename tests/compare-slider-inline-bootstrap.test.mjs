import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

const fixer = await readFile(new URL('../tools/site-shell/fix-homepage-context-slider.mjs', import.meta.url), 'utf8');

test('build injects an inline native-range bootstrap before the external runtime', () => {
  assert.match(fixer, /data-bg-compare-bootstrap/);
  assert.match(fixer, /createElement\(['"]input['"]\)/);
  assert.match(fixer, /className\s*=\s*['"]bg-compare-range['"]/);
  assert.match(fixer, /range\.type\s*=\s*['"]range['"]/);
  assert.match(fixer, /range\.min\s*=\s*['"]0['"]/);
  assert.match(fixer, /range\.max\s*=\s*['"]100['"]/);
  assert.match(fixer, /addEventListener\(['"]input['"]/);

  const html = '<!doctype html><html><head></head><body><div id="compareSlider" class="compare-slider"><div class="compare-before"></div><div class="compare-after"></div></div></body></html>';
  const out = applyHomepageContextSliderReadability(html);
  assert.match(out, /<script data-bg-compare-bootstrap>/);
  assert.ok(out.indexOf('data-bg-compare-bootstrap') < out.indexOf('src="\/assets\/compare-slider-runtime.js"'));
});
