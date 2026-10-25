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

test('regional AWS EOL evidence is model-specific and cannot renew stale catalog approval',()=>{
 const flagged=worklist.models.filter(m=>m.lifecycle_risk);
 assert.equal(flagged.length,3);
 const expected=new Map([['amazon-nova-sonic','2026-09-14'],['amazon-nova-canvas','2026-09-30'],['amazon-nova-reel','2026-09-30']]);
 for(const m of flagged){
  assert.equal(m.lifecycle_risk.state,'EOL_IN_LISTED_REGIONS');
  assert.equal(m.lifecycle_risk.eol_date,expected.get(m.id));
  assert.match(m.lifecycle_risk.model_id,/^amazon\\.nova-/);
  assert.ok(m.lifecycle_risk.regions.length>=1);
  assert.equal(m.lifecycle_risk.account_and_other_regions,'UNVERIFIED');
  assert.equal(m.lifecycle_risk.claim_scope,'lifecycle_only');
  assert.equal(m.review_state,'PENDING_INDEPENDENT_REVIEW');
  assert.equal(m.automatic_recommendation_eligible,false);
 }
});
