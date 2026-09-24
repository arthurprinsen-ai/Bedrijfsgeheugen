import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('prijzen.html','utf8');
const verifier=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('inline pricing controller mirrors rescue visible-state semantics',()=>{
  assert.match(html,/p\.hidden=!active;p\.style\.display=active\?'':'none';p\.classList\.toggle\('is-active',active\);p\.setAttribute\('aria-hidden',String\(!active\)\)/);
  assert.match(html,/card\.hidden=!active;card\.style\.display=active\?'':'none';card\.classList\.toggle\('is-active',active\);card\.setAttribute\('aria-hidden',String\(!active\)\)/);
  assert.match(html,/b\.tabIndex=active\?0:-1/);
  assert.match(html,/x\.tabIndex=active\?0:-1/);
});

test('production verifier waits for pricing rescue runtime before clicking',()=>{
  assert.match(verifier,/dataset\?\.bgPricingInteractions === 'ready-v3'/);
  assert.match(verifier,/data-bg-stage="loss"/);
  assert.match(verifier,/loss stage panel after click/);
});
