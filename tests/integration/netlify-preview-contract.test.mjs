import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = await readFile('netlify.toml', 'utf8');

test('deploy previews compose component homepage without changing production build command', () => {
  assert.match(config, /\[build\][\s\S]*command\s*=\s*"node tools\/bouw-sitemap\.mjs && node tools\/bouw-kennisindex\.mjs"/);
  assert.match(config, /\[context\.deploy-preview\]/);
  assert.match(config, /node tools\/compose-home-migration\.mjs \/tmp\/component-index\.html/);
  assert.match(config, /cp \/tmp\/component-index\.html index\.html/);
});
