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

test('the real failing wide screenshot size is a mandatory visual-regression viewport', () => {
  assert.ok(registry.defaults.viewports.some(v => v.width === 1542 && v.height === 632),
    '1542x632 must stay in the browser regression matrix because this exact width exposed the painted-content overlap');
});

test('homepage protects actual heading and description from the actual cockpit card', () => {
  const home = registry.pages.find(page => page.route === '/');
  assert.ok(home);
  assert.ok(home.protectedPairs.some(pair => pair.a === '[data-bg-automation-heading]' && pair.b === '[data-bg-automation-card]' && pair.maxIntersectionAreaPx2 === 0));
  assert.ok(home.protectedPairs.some(pair => pair.a === '[data-bg-automation-description]' && pair.b === '[data-bg-automation-card]' && pair.maxIntersectionAreaPx2 === 0));
});
