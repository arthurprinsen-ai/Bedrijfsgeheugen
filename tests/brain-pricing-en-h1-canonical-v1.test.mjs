import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('canonical English pricing H1 patch covers parser text-node fragments', async () => {
  const patch = JSON.parse(await readFile('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  assert.equal(patch['Prijzen voor'], 'Pricing for');
  assert.equal(patch['digitalisering'], 'digitalization');
  assert.equal(patch['in het mkb'], 'in SMEs');
  assert.equal(patch['Prijzen voor digitalisering in het mkb'], 'Pricing for digitalization in SMEs');
});

test('production browser proof still rejects the Dutch pricing H1 on English route', async () => {
  const source = await readFile('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source, /English route still shows the Dutch pricing H1/);
});
