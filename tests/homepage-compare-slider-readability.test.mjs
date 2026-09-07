import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageCompareSliderReadability } from '../tools/fix-homepage-compare-slider.mjs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

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
  assert.match(source, /Math\.max\(30,\s*Math\.min\(70/);
  assert.match(source, /aria-valuemin="30"/);
  assert.match(source, /aria-valuemax="70"/);
  assert.match(source, /compare-before \.compare-copy/);
  assert.match(source, /calc\(var\(--split\) - 68px\)/);
  assert.match(source, /compare-after \.compare-copy/);
  assert.match(source, /calc\(100% - var\(--split\) - 68px\)/);
  assert.match(source, /data-bg-compare-slider-readable/);
});

test('readability guard accepteert de V18 runtime met spaties', () => {
  const html = `<!doctype html><html><head></head><body>
  <div id="compareSlider"><div class="compare-before"><div class="compare-copy">Voor</div></div><div class="compare-after"><div class="compare-copy">Na</div></div></div>
  <div role="separator" aria-label="Vergelijk voor en na" aria-valuemax="92" aria-valuemin="8"></div>
  <script>const split = Math.max(8, Math.min(92, 50));</script>
  </body></html>`;

  const next = applyHomepageCompareSliderReadability(html);
  assert.match(next, /Math\.max\(30,\s*Math\.min\(70,/);
  assert.match(next, /aria-valuemax="70"/);
  assert.match(next, /aria-valuemin="30"/);
  assert.match(next, /data-bg-compare-slider-readable/);
});

test('homepage compare-slider runtime en test horen bij de website delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['tools/fix-homepage-compare-slider.mjs', 'tests/homepage-compare-slider-readability.test.mjs']) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'c0ffee1234567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['website'], `${path} must be website delivery work`);
  }
  assert.throws(
    () => createDeliveryPlan({ changedPaths:['tools/fix-homepage-unowned-runtime.mjs'], headSha:'c0ffee1234567890', policy }),
    /unclassified delivery path/,
    'de classificatie mag niet verbreden naar willekeurige homepage runtime-tools'
  );
});
