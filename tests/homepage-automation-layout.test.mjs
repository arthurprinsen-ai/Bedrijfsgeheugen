import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pipeline = await readFile(new URL('../tools/prijzen-uit-de-homepage.mjs', import.meta.url), 'utf8');
const registry = JSON.parse(await readFile(new URL('../config/ui-visual-regression.json', import.meta.url), 'utf8'));

test('final homepage pipeline applies the automation-section overlap guard', () => {
  assert.match(pipeline, /applyHomepageAutomationLayout/);
  assert.match(pipeline, /homepage-automation-layout/);
});

test('automation layout fixer guards the painted cockpit, not only its outer branch', async () => {
  const fixerUrl = new URL('../tools/fix-homepage-automation-layout.mjs', import.meta.url);
  let source = '';
  try { source = await readFile(fixerUrl, 'utf8'); } catch {}
  assert.match(source, /Terwijl jij je bedrijf runt\./);
  assert.match(source, /Nieuwe CAO-regel gevonden/);
  assert.match(source, /data-bg-automation-layout/);
  assert.match(source, /data-bg-automation-heading/);
  assert.match(source, /data-bg-automation-description/);
  assert.match(source, /data-bg-automation-card/);
  assert.match(source, /\[data-bg-automation-card\][\s\S]*position:relative!important/);
  assert.match(source, /\[data-bg-automation-card\][\s\S]*transform:none!important/);
  assert.match(source, /\[data-bg-automation-card\][\s\S]*max-width:100%!important/);
});

test('the real failing 1542px wide screenshot remains a mandatory visual-regression width', () => {
  assert.ok(registry.defaults.viewports.some(v => v.width === 1542),
    '1542px must stay in the browser regression matrix because this exact width exposed the painted-content overlap');
});

// De registry-paren voor de cockpitkaart zijn bewust verhuisd: volgens
// tests/seo-homepage-context-slider-readability.test.mjs bewaakt de algemene
// visual-regression-gate alleen de hero, en mogen de automation-markers niet
// meer in de registry staan. De overlapbewaking zit in de fixer (test hierboven).
test('registry houdt de verouderde automation-paren buiten de homepage', () => {
  const home = registry.pages.find(page => page.route === '/');
  assert.ok(home);
  assert.ok(!(home.protectedPairs || []).some(pair => /data-bg-automation-/.test(`${pair.a} ${pair.b}`)));
});
