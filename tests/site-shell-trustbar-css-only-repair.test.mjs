import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ensureTrustBar } from '../tools/site-shell/components.mjs';

test('ensureTrustBar repairs CSS-only false positives', () => {
  const input = '<!doctype html><html><head><style>.bg-uniform-trust{display:flex}</style></head><body><main><h1>Blog</h1></main></body></html>';
  const output = ensureTrustBar(input);
  assert.match(output, /data-bg-component="trustbar"/);
  assert.match(output, /class="bg-uniform-trust"/);
  assert.equal((output.match(/data-bg-component="trustbar"/g) || []).length, 1);
});

test('Netlify build runtime is pinned for site-shell generation', async () => {
  const toml = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
  const match = toml.match(/NODE_VERSION\s*=\s*"([0-9]+)\.([0-9]+)\.([0-9]+)"/);
  assert.ok(match, 'netlify.toml must pin NODE_VERSION explicitly');
  const major = Number(match[1]);
  const minor = Number(match[2]);
  assert.ok(major > 22 || (major === 22 && minor >= 12), 'Netlify NODE_VERSION must be >= 22.12.0');
  assert.match(toml, /NODE_OPTIONS\s*=\s*"--max-old-space-size=2048"/, 'Netlify must reserve enough Node heap for localized route generation');
});
