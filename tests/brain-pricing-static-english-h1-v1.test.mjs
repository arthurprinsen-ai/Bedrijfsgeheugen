import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing English H1 cache override is explicit and non-Dutch', () => {
  const patch = JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  assert.equal(patch['Prijzen voor digitalisering in het mkb'], 'Pricing for SME digitalisation');
  assert.notEqual(patch['Prijzen voor digitalisering in het mkb'], 'Prijzen voor digitalisering in het mkb');
});
