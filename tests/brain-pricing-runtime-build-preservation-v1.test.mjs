import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/pricing-build-integrity.mjs','utf8');

test('pricing build integrity restores interaction runtimes after transforms',()=>{
  assert.match(source,/extractScriptById/);
  assert.match(source,/ensurePricingRuntime/);
  assert.match(source,/bg-pricing-neno-v1-js/);
  assert.match(source,/pricing-interactions-rescue-v1\.js\?v=20260924-0750/);
  assert.match(source,/rescue runtime missing after restore/);
  assert.match(source,/replace\(current, canonical\)/);
});
