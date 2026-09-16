import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = await readFile('netlify.toml', 'utf8');
const livePreviewWorkflow = await readFile('.github/workflows/portal-v2-live-preview.yml', 'utf8');
const productionDomWorkflow = await readFile('.github/workflows/portal-v2-production-dom-readback.yml', 'utf8');

test('deploy previews run the exact accepted V18 production build', () => {
  const acceptedBuild = 'node tools/bouw-powerhouse-auth.mjs && node tools/bouw-sitemap.mjs && node tools/bouw-kennisindex.mjs && node tools/bouw-v18-production.mjs';
  const commandLine = `command = "${acceptedBuild}"`;
  const productionBlock = config.match(/\[build\]\n([\s\S]*?)(?=\n\[)/)?.[1] ?? '';
  const previewBlock = config.match(/\[context\.deploy-preview\]\n([\s\S]*?)(?=\n\[)/)?.[1] ?? '';

  assert.ok(productionBlock.includes(commandLine));
  assert.ok(previewBlock.includes(commandLine));
  assert.doesNotMatch(config, /compose-home-migration\.mjs/);
});

test('Portal readbacks pin the exact Netlify deploy permalink after SHA resolution', () => {
  for (const workflow of [livePreviewWorkflow, productionDomWorkflow]) {
    assert.match(workflow, /release\.json/);
    assert.match(workflow, /deploy_id/);
    assert.match(workflow, /--bedrijfsgeheugen\.netlify\.app/);
  }
});
