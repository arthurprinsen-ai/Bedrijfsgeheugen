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
  assert.match(source,/extractSection\(source, 'prijzen-pakketten'\)/);
  assert.match(source,/extractSection\(built, 'prijzen-pakketten'\)/);
  assert.match(source,/extractSection\(source, 'pakketten'\)/);
  assert.match(source,/extractSection\(built, 'pakketten'\)/);
  assert.match(source,/missing interaction controls/);
  for (const marker of [
    'data-bg-stage="loss"',
    'data-bg-stage-panel="loss"',
    'data-bg-price-tab="run"',
    'data-bg-billing="yearly"'
  ]) assert.ok(source.includes(marker), 'missing pricing build preservation marker: ' + marker);
});
