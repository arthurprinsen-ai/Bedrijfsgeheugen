import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('immutable English cache contains known historical and pricing canonical translations', async () => {
  const cache = JSON.parse(await readFile('config/bg-static-i18n-en.json','utf8'));
  const patch = JSON.parse(await readFile('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  assert.equal(typeof cache['Aanmelden — begin met inzicht | Bedrijfsgeheugen'], 'string');
  assert.ok(cache['Aanmelden — begin met inzicht | Bedrijfsgeheugen'].trim().length > 0);
  assert.equal(patch['Prijzen voor'], 'Pricing for');
  assert.equal(patch['digitalisering'], 'digitalization');
  assert.equal(patch['in het mkb'], 'in SMEs');
});
