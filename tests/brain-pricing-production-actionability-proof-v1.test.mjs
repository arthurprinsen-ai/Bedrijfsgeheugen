import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const proof=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production pricing verifier proves controls are actionable before clicking',()=>{
  assert.match(proof,/async function clickActionable/);
  assert.match(proof,/scrollIntoViewIfNeeded/);
  assert.match(proof,/boundingBox\(\)/);
  assert.match(proof,/click\(\{ trial:true/);
  assert.match(proof,/loss lifecycle tab/);
  assert.match(proof,/run pricing tab/);
  assert.match(proof,/yearly billing toggle/);
  assert.match(proof,/English language option/);
});
