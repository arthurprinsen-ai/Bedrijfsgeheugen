import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planVerifiedLatePersonalSourceRebootstrap} from '../supabase/functions/_shared/held-personal-duplicate-rebootstrap.mjs';

const date='2026-11-18';
const decision=()=>({
  channel:'linkedin_personal',decision:'hold',state:'blocked',
  delivery_ref:null,updated_at:'2026-11-17T23:24:25Z',
  delivery_evidence:{capability_reason:'PERSONAL_TRUTH_SOURCE_UNVERIFIED',provider_create_success:false}
});
const obligation=()=>({
  channel:'linkedin_personal',status:'PLANNED',external_id:null,published_at:null,
  evidence:{},live_proven_at:null
});
const source=()=>({
  recommendation_id:'fictional-test-source-1',
  target_channel:'linkedin_personal',run_date:date,status:'suggested',
  updated_at:'2026-11-18T12:44:55Z',
  evidence:{
    content_id:'user-authored-personal:2026-11-18:small-household-question',
    source_kind:'verified_personal_source',
    source_text:'I described my practical search for a robot vacuum that can connect to both fresh water and drainage, without claiming that it was ever purchased or installed.',
    source_lineage:['chat-history:user-fact:2026-11-18:small-household-question'],
    personal_truth_verified:true,arthur_anchor_verified:true,first_person_claims_verified:true,
    personal_life_topic:true,business_topic:false,corporate_voice:false,
    company_page_interchangeable:false,forced_business_moral:false,
    personal_life_only_policy:'personal-linkedin-personal-life-only-v1',
    identity_contract:'arthur-personal-linkedin-identity-v4',
    identity_gate_version:'channel-identity-hard-gate-v3',
    sensitive_private_detail:false
  }
});
const call=(d=decision(),o=obligation(),s=[source()],extra={})=>
  planVerifiedLatePersonalSourceRebootstrap({decision:d,obligation:o,recommendations:s,runDate:date,...extra});

test('wake ONLY the existing writer for one newer verified user fact, not a provider create',()=>{
  const r=call();
  assert.equal(r.eligible,true);
  assert.equal(r.reason,'VERIFIED_USER_FACT_ARRIVED_AFTER_HELD_DECISION');
  assert.equal(r.source_recommendation_id,'fictional-test-source-1');
});

test('do not wake without a newly observed source revision',()=>{
  const s=source();s.updated_at='2026-11-17T23:24:25Z';
  assert.equal(call(decision(),obligation(),[s]).eligible,false);
  s.updated_at='2026-11-17T23:00:00Z';
  assert.equal(call(decision(),obligation(),[s]).eligible,false);
});

test('require original first-person source contract rather than metadata-only claimed approval',()=>{
  for(const mutate of [
    x=>delete x.evidence.identity_gate_version,
    x=>x.evidence.personal_truth_verified=false,
    x=>x.evidence.first_person_claims_verified=false,
    x=>x.evidence.source_lineage=['public-news-example:fake'],
    x=>x.evidence.business_topic=true,
    x=>x.evidence.source_kind='generated_company_story',
    x=>x.evidence.source_text='short',
    x=>x.evidence.sensitive_private_detail=true,
    x=>x.evidence.company_page_interchangeable=true
  ]){
    const s=source();mutate(s);
    assert.equal(call(decision(),obligation(),[s]).eligible,false);
  }
});

test('hold when exact provider authority was consumed or any possible external side effect exists',()=>{
  assert.equal(call(decision(),obligation(),[source()],{capabilityConsumed:true}).eligible,false);
  for(const mutate of [
    (d,o)=>o.external_id='urn:li:share:existing',
    (d,o)=>o.status='LIVE_PROVEN',
    (d,o)=>o.published_at='2026-11-18T12:00:00Z',
    (d,o)=>o.evidence.possible_provider_side_effect=true,
    (d,o)=>d.delivery_ref='unknown-provider-post',
    (d,o)=>d.delivery_evidence.republish_forbidden=true,
  ]) {const d=decision(),o=obligation();mutate(d,o);assert.equal(call(d,o).eligible,false);}
});

test('only original missing-source hold is recoverable; never regenerate arbitrary blocked or published channels',()=>{
  const d=decision();d.delivery_evidence.capability_reason='PROVIDER_RECORD_MISSING';
  assert.equal(call(d).eligible,false);
  d.delivery_evidence.capability_reason='PERSONAL_TRUTH_SOURCE_UNVERIFIED';d.decision='publish';
  assert.equal(call(d).eligible,false);
  d.decision='hold';d.state='published';
  assert.equal(call(d).eligible,false);
});

test('never recycle a user-fact recommendation already rejected by exact original lineage',()=>{
  const d=decision();d.delivery_evidence.rejected_recommendation_ids=['fictional-test-source-1'];
  assert.equal(call(d).eligible,false);
});

test('source must share the original local business date and must not be a Sunday',()=>{
  const s=source();s.run_date='2026-11-17';
  assert.equal(call(decision(),obligation(),[s]).eligible,false);
  const sunday=source();sunday.run_date='2026-11-15';
  assert.equal(planVerifiedLatePersonalSourceRebootstrap({
    decision:decision(),obligation:obligation(),recommendations:[sunday],runDate:'2026-11-15'
  }).eligible,false);
});

test('original content loop reuses same orchestrator and original lease: no second sender/scheduler',()=>{
  const script=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  assert.match(script,/planVerifiedLatePersonalSourceRebootstrap/);
  assert.match(script,/retryableVerifiedLatePersonalSource/);
  assert.match(script,/retryableVerifiedLatePersonalSource \|\| retryableCompanyEditorialBlock/);
  assert.match(script,/invoke\(url, expected, 'powerhouse-content-orchestrator', \{ runDate \}\)/);
  assert.doesNotMatch(script,/late-personal-alternative-publisher/);
});
