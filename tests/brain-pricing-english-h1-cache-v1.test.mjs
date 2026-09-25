import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pricing Dutch H1 has a canonical English static translation', async () => {
  const patch = JSON.parse(await readFile('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  assert.equal(patch['Prijzen voor digitalisering in het mkb'],'Pricing for SME digitalisation');
  assert.notEqual(patch['Prijzen voor digitalisering in het mkb'],'Prijzen voor digitalisering in het mkb');

  const verifier = await readFile('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(verifier,/English route still shows the Dutch pricing H1/);
  assert.match(verifier,/Prijzen voor digitalisering in het mkb/);
});
