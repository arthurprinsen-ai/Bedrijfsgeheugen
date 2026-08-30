import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = await readFile('netlify.toml', 'utf8');

test('deploy previews run the exact accepted V18 production build', () => {
  const acceptedBuild = 'node tools/bouw-sitemap.mjs && node tools/bouw-kennisindex.mjs && node tools/bouw-v18-production.mjs';
  const commandLine = `command = "${acceptedBuild}"`;
  const productionBlock = config.match(/\[build\]\n([\s\S]*?)(?=\n\[)/)?.[1] ?? '';
  const previewBlock = config.match(/\[context\.deploy-preview\]\n([\s\S]*?)(?=\n\[)/)?.[1] ?? '';

  assert.ok(productionBlock.includes(commandLine));
  assert.ok(previewBlock.includes(commandLine));
  assert.doesNotMatch(config, /compose-home-migration\.mjs/);
});
