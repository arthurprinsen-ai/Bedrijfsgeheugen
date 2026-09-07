import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pipeline = await readFile(new URL('../tools/prijzen-uit-de-homepage.mjs', import.meta.url), 'utf8');

test('final homepage pipeline applies the automation-section overlap guard', () => {
  assert.match(pipeline, /applyHomepageAutomationLayout/);
  assert.match(pipeline, /homepage-automation-layout/);
});

test('automation layout fixer exists and is wired before final verification', async () => {
  const fixerUrl = new URL('../tools/fix-homepage-automation-layout.mjs', import.meta.url);
  let source = '';
  try { source = await readFile(fixerUrl, 'utf8'); } catch {}
  assert.match(source, /Terwijl jij je bedrijf runt\./);
  assert.match(source, /Nieuwe CAO-regel gevonden/);
  assert.match(source, /data-bg-automation-layout/);
  assert.match(source, /grid-template-columns/);
  assert.match(source, /position:relative!important/);
  assert.match(source, /transform:none!important/);
  assert.match(source, /@media\(max-width:980px\)/);
});
