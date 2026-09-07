import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pipeline = await readFile(new URL('../tools/prijzen-uit-de-homepage.mjs', import.meta.url), 'utf8');

test('final homepage pipeline applies the compare-slider readability guard', () => {
  assert.match(pipeline, /applyHomepageCompareSliderReadability/);
  assert.match(pipeline, /fix-homepage-compare-slider/);
});

test('compare slider keeps both text columns readable at every allowed endpoint', async () => {
  const fixerUrl = new URL('../tools/fix-homepage-compare-slider.mjs', import.meta.url);
  let source = '';
  try { source = await readFile(fixerUrl, 'utf8'); } catch {}

  assert.match(source, /compareSlider/);
  assert.match(source, /Math\.max\(30,Math\.min\(70/);
  assert.match(source, /aria-valuemin="30"/);
  assert.match(source, /aria-valuemax="70"/);
  assert.match(source, /compare-before \.compare-copy/);
  assert.match(source, /calc\(var\(--split\) - 68px\)/);
  assert.match(source, /compare-after \.compare-copy/);
  assert.match(source, /calc\(100% - var\(--split\) - 68px\)/);
  assert.match(source, /data-bg-compare-slider-readable/);
});
