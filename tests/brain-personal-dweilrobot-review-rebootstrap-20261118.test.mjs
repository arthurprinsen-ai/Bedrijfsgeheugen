import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planPersonalObservationalReviewRecovery} from '../supabase/functions/_shared/personal-observational-review-recovery.mjs';

const hash='709acac620929d74fa27a4216f93be6ed810b293dbad1c3fbd748de16814480d';
const source='dcc143fc-6c00-4fb4-8897-486f26a61b0c';
const userEvidence=()=>({
  source_kind:'verified_personal_source',
  source_text:'Op 15 november onderzocht de gebruiker een dweilrobot die aan waterleiding en afvoer kan. Hij wil het station wegwerken, modellen vergelijken en Black Friday-aanbiedingen bekijken; er is niet beweerd dat hij kocht of gebruikte.',
  source_lineage:['chat-history:user-fact:2026-11-15T17:23:20Z:dweilrobot-waterleiding-afvoer'],
  personal_truth_verified:true,first_person_claims_verified:true,
  personal_life_topic:true,business_topic:false,corporate_voice:false,
  source_not_consumed_verified:true
});
const pair=(code='FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED')=>{
 const ev={review_status:422,pre_publish_gate:'blocked',reviewed_text_hash:hash,
   personal_source_recommendation_id:source,identity_gate_evidence:userEvidence(),
   violations:[{code}]};
 return {decision:{channel:'linkedin_personal',decision:'publish',state:'blocked',delivery_ref:null,delivery_evidence:structuredClone(ev)},
  obligation:{channel:'linkedin_personal',status:'BLOCKED',external_id:null,
   published_at:null,live_proven_at:null,recovery_attempts:1,evidence:structuredClone(ev)}};
};

test('real original household source 422 safely re-enters SAME original editor without granting publication',()=>{
 const result=planPersonalObservationalReviewRecovery(pair());
 assert.equal(result.eligible,true);
 assert.equal(result.source_recommendation_id,source);
 assert.equal(result.recovery_attempts,1);
 assert.equal(result.max_attempts,3);
 assert.equal(Object.hasOwn(result,'publication_authorized'),false);
});
test('original observation-only 422 recovery remains unchanged',()=>{
 const x=pair('OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED');
 delete x.decision.delivery_evidence.identity_gate_evidence;
 delete x.obligation.evidence.identity_gate_evidence;
 assert.equal(planPersonalObservationalReviewRecovery(x).eligible,true);
});
test('unverified personal story, mixed 422, source mismatch, consumed authority or attempt cap NEVER reopen',()=>{
 const changes=[
 x=>x.decision.delivery_evidence.identity_gate_evidence.source_kind='public_news',
 x=>x.decision.delivery_evidence.identity_gate_evidence.personal_truth_verified=false,
 x=>x.obligation.evidence.identity_gate_evidence.first_person_claims_verified=false,
 x=>x.obligation.evidence.identity_gate_evidence.source_lineage=['public-news:untrusted'],
 x=>x.obligation.evidence.identity_gate_evidence.source_not_consumed_verified=false,
 x=>x.decision.delivery_evidence.violations.push({code:'PERSONAL_TRUTH_UNVERIFIED'}),
 x=>x.obligation.evidence.violations=[{code:'OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED'}],
 x=>x.obligation.evidence.personal_source_recommendation_id='00000000-0000-0000-0000-000000000002',
 x=>x.decision.delivery_evidence.reviewed_text_hash='b'.repeat(64),
 x=>x.decision.delivery_ref='urn:li:share:123',
 x=>x.obligation.external_id='urn:li:share:123',
 x=>x.obligation.published_at='2026-11-18T14:00:00Z',
 x=>x.decision.delivery_evidence.possible_provider_side_effect=true,
 x=>x.obligation.evidence.provider_create_success=true,
 x=>x.decision.delivery_evidence.republish_forbidden=true,
 x=>x.obligation.recovery_attempts=3,
 x=>x.decision.delivery_evidence.review_status=429
 ];
 for(const [i,change] of changes.entries()){const x=pair();change(x);assert.equal(planPersonalObservationalReviewRecovery(x).eligible,false,String(i));}
 assert.equal(planPersonalObservationalReviewRecovery({...pair(),consumedCapability:true}).eligible,false);
});
test('original first-person household text passes the repaired final context predicate, not generic platitudes',()=>{
 const s=readFileSync(new URL('../supabase/functions/bg-pre-publish-review/index.ts',import.meta.url),'utf8');
 const match=s.match(/function personalLifeContextSignal\(text: string\) \{\s*return (\/[^\n]+\/i)\.test\(text\);/);
 assert.ok(match,'final reviewer exact context predicate readable');
 const context=new RegExp(match[1].slice(1,-2),'i');
 const real='Ik zocht een dweilrobot en bekeek welke modellen op waterleiding en afvoer kunnen worden aangesloten.';
 assert.equal(context.test(real),true);
 assert.equal(context.test('Ik wil efficiënter werken zonder een echte gebeurtenis.'),false);
 assert.equal(/\b(ik|mijn|mij|me)\b/i.test(real),true);
 assert.equal(/\bzocht\b/i.test(real),true);
});
test('only existing supervised original loop may rebootstrap exact 422; no direct publisher invocation',()=>{
 const loop=readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
 assert.match(loop,/FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED/);
 assert.match(loop,/retryablePersonalObservationReview=recovery\.eligible/);
 assert.match(loop,/planPersonalObservationalReviewRecovery\(\{/);
 assert.match(loop,/maxAttempts:3/);
 assert.match(loop,/invoke\(url, expected, 'powerhouse-content-orchestrator', \{ runDate \}\)/);
 const review=readFileSync(new URL('../supabase/functions/bg-pre-publish-review/index.ts',import.meta.url),'utf8');
 assert.match(review,/require\(concretePersonalLifeSignal\(text\), 'FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED'/);
 assert.doesNotMatch(loop,/MAKE_FALLBACK_SCHEDULER|new ParallelPublisher/);
});
