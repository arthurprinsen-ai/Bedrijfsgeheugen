import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planPersonalObservationalReviewRecovery} from '../supabase/functions/_shared/personal-observational-review-recovery.mjs';

const id='6418326b-bded-487d-b1dd-1ec22ea0af66',hash='a'.repeat(64);
const base=()=>{
 const ev={review_status:422,pre_publish_gate:'blocked',reviewed_text_hash:hash,
  personal_source_recommendation_id:id,
  violations:[{code:'OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED'}]};
 return {
  decision:{channel:'linkedin_personal',decision:'publish',state:'blocked',delivery_ref:null,delivery_evidence:{...ev}},
  obligation:{channel:'linkedin_personal',status:'BLOCKED',external_id:null,published_at:null,live_proven_at:null,
    recovery_attempts:2,evidence:{...ev}}
 };
};
const check=(mutate=null,consumedCapability=false)=>{
 const pair=base();if(mutate)mutate(pair);
 return planPersonalObservationalReviewRecovery({...pair,consumedCapability});
};
test('one bounded pre-provider rebootstrap for the exact source-locked original 422',()=>{
 const r=check();assert.equal(r.eligible,true);assert.equal(r.recovery_attempts,2);
 assert.equal(r.source_recommendation_id,id);assert.equal(r.max_attempts,3);
});
test('never reopen ambiguity, authorization, mismatched source or wrong error',()=>{
 const changes=[
  b=>b.decision.delivery_ref='urn:li:share:1',
  b=>b.obligation.external_id='urn:li:share:1',
  b=>b.obligation.published_at='2026-11-15T14:00:00Z',
  b=>b.obligation.live_proven_at='2026-11-15T14:00:00Z',
  b=>b.decision.delivery_evidence.possible_provider_side_effect=true,
  b=>b.obligation.evidence.provider_create_success=true,
  b=>b.obligation.evidence.provider_publication_ack_verified=true,
  b=>b.decision.delivery_evidence.republish_forbidden=true,
  b=>b.decision.delivery_evidence.personal_source_recommendation_id='00000000-0000-0000-0000-000000000002',
  b=>b.obligation.evidence.reviewed_text_hash='b'.repeat(64),
  b=>b.decision.delivery_evidence.violations=[{code:'OTHER'}],
  b=>b.obligation.evidence.review_status=403,
  b=>b.obligation.recovery_attempts=3,
  b=>b.obligation.recovery_attempts=-1,
  b=>b.obligation.status='LIVE_PROVEN'
 ];
 for(const [i,change] of changes.entries())assert.equal(check(change).eligible,false,String(i));
 assert.equal(check(null,true).eligible,false,'consumed authority cannot rerun');
});
test('existing original loop only reboots via protected original supervisor, no sender created',()=>{
 const s=readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
 assert.ok(s.includes('planPersonalObservationalReviewRecovery({'));
 assert.ok(s.includes('retryableCompanyEditorialBlock || retryablePersonalObservationReview)'));
 assert.ok(s.includes('obligationSource.error||capabilitySource.error'));
 assert.match(s,/maxAttempts:3/);
 assert.ok(s.includes("invoke(url, expected, 'powerhouse-content-orchestrator', { runDate })"));
 assert.doesNotMatch(s,/MAKE_FALLBACK_SCHEDULER|new ParallelPublisher/);
});
