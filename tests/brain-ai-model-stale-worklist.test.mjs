import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const worklist=JSON.parse(readFileSync('data/ai-model-stale-review-worklist-20261025.json','utf8'));
test('all 27 stale entries remain awaiting independent supplier review',()=>{
  assert.equal(worklist.stale_count,27);
  assert.equal(worklist.models.length,27);
  assert.equal(new Set(worklist.models.map(m=>m.id)).size,27);
  assert.equal(worklist.no_auto_activation,true);
  assert.equal(worklist.verified_at_must_not_be_advanced_without_fresh_per_claim_receipts,true);
  for(const m of worklist.models){
    assert.match(m.source,/^https:\/\//);
    assert.equal(m.previous_verified_at,'2026-09-30');
    assert.equal(m.review_state,'PENDING_INDEPENDENT_REVIEW');
    assert.equal(m.automatic_recommendation_eligible,false);
  }
});
