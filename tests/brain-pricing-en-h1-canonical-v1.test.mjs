import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('canonical English pricing H1 patch is present and non-Dutch', async () => {
  const patch = JSON.parse(await readFile('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  const source = 'Prijzen voor digitalisering in het mkb';
  assert.equal(patch[source], 'Pricing for digitalization in SMEs');
  assert.notEqual(patch[source], source);
});

test('production browser proof still rejects the Dutch pricing H1 on English route', async () => {
  const source = await readFile('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source, /English route still shows the Dutch pricing H1/);
});
