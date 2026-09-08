import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Portal V2 has no legacy portal runtime dependency', async () => {
  const [registry, shell, app, index] = await Promise.all([
    read('portal-v2/page-registry.js'),
    read('portal-v2/page-shell.js'),
    read('portal-v2/app.js'),
    read('portal-v2/index.html')
  ]);
  const source = `${registry}\n${shell}\n${app}`;

  assert.doesNotMatch(source, /legacy-bridge/i);
  assert.doesNotMatch(source, /buildLegacyUrl/);
  assert.doesNotMatch(source, /canEmbedLegacy/);
  assert.doesNotMatch(source, /<iframe/i);
  assert.doesNotMatch(registry, /portal-next/);
  assert.match(shell, /kind:'native-v2'/);
  assert.match(shell, /Native Portal V2/);
  assert.match(index, /portal-v2\/compliance\.html/);
});
