import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('SEO growth intelligence does not trigger on generic delivery policy changes', async () => {
  const workflow = await readFile('.github/workflows/seo-growth-intelligence.yml','utf8');
  assert.doesNotMatch(workflow, /config\/brain-delivery-system\.json/);
  assert.match(workflow, /tools\/seo-growth\/\*\*/);
  assert.match(workflow, /tests\/seo-growth-\*\.test\.mjs/);
});

test('Powerhouse Assurance does not trigger on generic delivery classifier changes', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-assurance.yml','utf8');
  assert.doesNotMatch(workflow, /tools\/brain-delivery-system\.mjs/);
  assert.match(workflow, /powerhouse\/assurance\/\*\*/);
  assert.match(workflow, /scripts\/brain\/powerhouse-quality-intelligence\.mjs/);
});

test('Fresh Device Canary does not trigger on generic delivery policy changes', async () => {
  const workflow = await readFile('.github/workflows/fresh-device-autonomy-canary.yml','utf8');
  assert.doesNotMatch(workflow, /config\/brain-delivery-system\.json/);
  assert.match(workflow, /scripts\/brain\/device-certify\.mjs/);
  assert.match(workflow, /tests\/brain-fresh-device-canary\.test\.mjs/);
});
