import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI model catalog recovery is evidence-scoped and avoids false verification', () => {
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.equal(c.models.length,110);
 assert.equal(new Set(c.models.map(m=>m.id)).size,c.models.length);
 for(const m of c.models){
  assert.match(m.source,/^https:\/\//);
  assert.ok(m.verified_at);
 }
 const astra=c.models.find(m=>m.id==='gpt-6-astra');
 assert.equal(astra.input_usd_m,10);
 assert.equal(astra.output_usd_m,50);
 assert.equal(astra.cached_input_usd_m,1);
 assert.ok(astra.verification_evidence?.not_verified?.includes('governance'));
 assert.ok(c.models.some(m=>m.verified_at==='2026-09-30'),'Do not restamp unverified models');
});
