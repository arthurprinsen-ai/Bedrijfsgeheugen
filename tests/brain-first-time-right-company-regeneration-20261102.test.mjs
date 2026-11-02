import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planRejectedCompanyRegeneration} from '../supabase/functions/_shared/company-rejected-candidate-regeneration.mjs';
const day='2026-11-02T14:30:00Z';
const old='d05ce26c-9982-426a-8101-e2e3cb6cf390',fresh='b13954ca-4e82-4a6f-8984-9ffb1ab25c4f';
const decision=()=>({channel:'linkedin_company',decision:'publish',state:'blocked',delivery_ref:null,
 delivery_evidence:{review_status:422,capability_state:'READY',
 violations:[{code:'COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT'}],
 fallback_recommendation_id:old}});
const obligation=()=>({channel:'linkedin_company',status:'BLOCKED',external_id:null,evidence:{}});
const sources=()=>[{recommendation_id:old,target_channel:'cross-channel',status:'suggested',priority:100,evidence:{}},
 {recommendation_id:fresh,target_channel:'linkedin_company',status:'suggested',priority:99,
 evidence:{source_backed:true,source_kind:'current_external_mkb_signal',source_url:'https://www.cbs.nl/nl-nl/2026/44/example',
 source_observed_at:'2026-10-28T05:51:11Z',source_published_at:'2026-10-27T05:51:11Z'}}];
test('exact 422 in original unsent company lane rotates away from rejected recommendation',()=>{
 const r=planRejectedCompanyRegeneration({decision:decision(),obligation:obligation(),recommendations:sources(),now:day});
 assert.equal(r.eligible,true);assert.equal(r.selectedAlternativeRecommendationId,fresh);
 assert.ok(r.rejectedRecommendationIds.includes(old));
 assert.equal(r.failureCode,'COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT');
});
test('provider-side-effect, authority or prior ACK excludes any regeneration',()=>{
 const cases=[
  {d:{delivery_ref:'urn:li:share:123'}},
  {d:{delivery_evidence:{possible_provider_side_effect:true}}},
  {d:{delivery_evidence:{provider_create_success:true}}},
  {d:{delivery_evidence:{republish_forbidden:true}}},
  {o:{external_id:'urn:li:share:123'}},
  {o:{evidence:{provider_publication_ack_verified:true}}},
  {o:{evidence:{possible_provider_side_effect:true}}},
  {consumedCapability:true}
 ];
 for(const item of cases){
  const d=decision(),o=obligation();
  const {delivery_evidence:override,...otherDecision}=item.d||{};
  Object.assign(d,otherDecision);Object.assign(d.delivery_evidence,override||{});
  Object.assign(o,item.o||{});
  const r=planRejectedCompanyRegeneration({decision:d,obligation:o,recommendations:sources(),now:day,consumedCapability:item.consumedCapability});
  assert.equal(r.eligible,false,JSON.stringify(item));
 }
});
test('only exact review 422 rejection with another observed source can reopen',()=>{
 const check=(d,o,recs)=>planRejectedCompanyRegeneration({decision:d,obligation:o,recommendations:recs,now:day});
 const wrong=decision();wrong.delivery_evidence.violations=[{code:'RANDOM_ERROR'}];
 assert.equal(check(wrong,obligation(),sources()).eligible,false);
 const noReview=decision();delete noReview.delivery_evidence.review_status;
 assert.equal(check(noReview,obligation(),sources()).eligible,false);
 const stale=sources();stale[1].evidence.source_observed_at='2026-09-01T12:00:00Z';
 assert.equal(check(decision(),obligation(),stale).eligible,false);
 const historic=sources();historic[1].evidence.source_published_at='2024-06-28T00:00:00Z';
 assert.equal(check(decision(),obligation(),historic).eligible,false);
 const undated=sources();delete undated[1].evidence.source_published_at;
 assert.equal(check(decision(),obligation(),undated).eligible,false);
 const unsourced=sources();delete unsourced[1].evidence.source_backed;
 assert.equal(check(decision(),obligation(),unsourced).eligible,false);
 const noURL=sources();noURL[1].evidence.source_url='http://unsafe';
 assert.equal(check(decision(),obligation(),noURL).eligible,false);
 const noAlternative=sources().slice(0,1);
 assert.equal(check(decision(),obligation(),noAlternative).reason,'NO_NEW_VERIFIED_SOURCE');
 const exhausted=decision();exhausted.delivery_evidence.rejected_recommendation_ids=['a','b','c'];
 assert.equal(check(exhausted,obligation(),sources()).eligible,false);
 const alreadyRejected=decision();alreadyRejected.delivery_evidence.rejected_recommendation_ids=[fresh];
 assert.equal(check(alreadyRejected,obligation(),sources()).eligible,false);
});
test('existing one-loop executor and original editor both consume bounded recovery without new sender',async()=>{
 const root=new URL('../supabase/functions/',import.meta.url);
 const loop=await readFile(new URL('powerhouse-content-loop/index.ts',root),'utf8');
 const editor=await readFile(new URL('powerhouse-content-orchestrator/index.ts',root),'utf8');
 assert.match(loop,/retryableCompanyEditorialBlock=regeneration\.eligible/);
 assert.match(loop,/retryableHeldPersonalDuplicate \|\| retryableCompanyEditorialBlock/);
 assert.match(editor,/companyRegeneration\?\.eligible/);
 assert.match(editor,/company_blocked_regeneration:/);
 assert.match(editor,/rejected_recommendation_ids:rejectedRecommendationIds/);
 assert.match(editor,/companyEditorialViolations\(bodyText/);
 assert.match(editor,/companyEditorialViolations\(revised/);
 assert.doesNotMatch(loop,/MAKE_FALLBACK_SCHEDULER|new ParallelPublisher/);
});
