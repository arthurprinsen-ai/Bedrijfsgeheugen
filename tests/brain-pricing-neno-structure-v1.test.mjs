import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing decision layer and release closure remain present',()=>{
  const pricing=fs.readFileSync('prijzen.html','utf8');
  assert.match(pricing,/id="prijzen-pakketten"/);
  assert.match(pricing,/id="bereken-pakket"/);
  assert.match(pricing,/data-bg-group="run"/);
  const learning=JSON.parse(fs.readFileSync('brain/learning/pricing-neno-structure-2026-09-22-v1.json','utf8'));
  assert.equal(learning.fingerprint,'pricing-neno-structure-2026-09-22-v1');
  assert.ok(learning.root_cause);
  assert.ok(learning.prevention_rule);
  assert.ok(learning.evidence);
});
