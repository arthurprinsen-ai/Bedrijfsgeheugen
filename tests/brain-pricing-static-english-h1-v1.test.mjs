import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing English H1 cache override covers the parser text nodes', () => {
  const patch = JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  assert.equal(patch['Prijzen voor'], 'Pricing for');
  assert.equal(patch['digitalisering'], 'digitalisation');
  assert.equal(patch['in het mkb'], 'SMEs');
  assert.equal(patch['Prijzen voor digitalisering in het mkb'], 'Pricing for SME digitalisation');
});
