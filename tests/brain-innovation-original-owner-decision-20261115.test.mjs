import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {evaluateOriginalOwnerHandoff} from '../scripts/brain/innovation-original-owner-readback.mjs';
import {
  CONTRACT,planOriginalOwnerDecisions,persistOriginalOwnerDecisions,publicSummary
} from '../scripts/brain/innovation-original-owner-decision.mjs';

const sha='a'.repeat(64);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const revision='2026-10-29T16:27:38.672347+00:00';
const NOW='2026-11-15T19:00:00.000Z';
const id='c1727e17-6200-44ff-9a31-eec0ea7c1ead';
const source_key='growth:cro-measurement-reconciliation:20261029';
const config={origin:'https://adhjwmvyoixzjtmiroln.supabase.co',key:'x'.repeat(32)};
const baseAction={kind:'reconcile_experiment_instrumentation',next_step:'Compare treatment and holdout'};
const rollback={required:true,route:'existing_protected_delivery'};
const copy=value=>structuredClone(value);
function fixture({owner='cro',kind='cro',idOverride=id}={}){
  const candidate={
    candidate_id:idOverride,source_key,owner_agent:owner,
    safety_class:'review_required',status:'candidate',
    created_at:'2026-10-29T16:27:38.672347+00:00',
    component_id:'growth-intelligence',
    proposed_action:kind==='generic'
      ?{kind:'bounded_learning_followup',next_step:'Design baseline, alternative and guardrails'}
      :kind==='concrete'
      ?{action:'Repair original canonical source and verify independent actual provider readback before any closure or release'}:copy(baseAction),
    rollback_plan:copy(rollback)
  };
  const obligation={business_entity:idOverride,change_id:source_key,
    owner:'original-agent:'+owner,state:'OPEN',payload_sha256:sha,evidence:{source_revision:revision}};
  const original_owner=owner==='cro'?'agent:agent-growth-market':'agent:agent-integration-engineer';
  const pre_review={
    contract:'ORIGINAL_INNOVATION_SOURCE_BOUND_AGENT_REVIEW_V1',
    fingerprint:'f'.repeat(64),original_owner,source_revision:revision,source_sha256:sha,
    source_and_rollback_examined:true,review_policy:'REVIEW_REQUIRED_EXISTING_PROTECTED_DELIVERY',
    exact_source_action_digest:hash(candidate.proposed_action),
    exact_source_rollback_digest:hash(candidate.rollback_plan),
    production_mutation_authorized:false,external_side_effect:false,consumer_ack_verified:false
  };
  const operation={id:'a0807c7b-b7d6-43e2-b934-7b18024a407a',operation_type:'INNOVATION_INTAKE',
    capability_id:original_owner,status:'PLANNED',version:4,
    correlation_id:'innovation-delivery:'+idOverride,
    idempotency_key:'innovation-delivery:'+idOverride+':'+sha.slice(0,16),
    payload_sha256:sha,change_id:source_key,remote_ref:null,
    evidence:{original_agent_pre_review:pre_review}
  };
  const snapshot={candidates:[candidate],obligations:[obligation],intakes:[operation]};
  const report=evaluateOriginalOwnerHandoff(snapshot,{now:NOW});
  return {snapshot,report,candidate,obligation,operation};
}
const plan=fx=>planOriginalOwnerDecisions({snapshot:fx.snapshot,report:fx.report,observedAt:NOW});

test('original CRO measurement is a real source-bound decision, never a fictitious implementation',()=>{
  const r=plan(fixture());
  assert.equal(r.contract,CONTRACT);
  assert.equal(r.candidate_count,1);
  assert.equal(r.work.length,1);
  const work=r.work[0];
  assert.equal(work.decision.decision,'CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED');
  assert.equal(work.decision.original_owner,'agent:agent-growth-market');
  assert.equal(work.decision.source_sha256,sha);
  assert.equal(work.decision.original_correlation_id,'innovation-delivery:'+id);
  assert.equal(work.decision.production_mutation_authorized,false);
  assert.equal(work.decision.consumer_ack_verified,false);
  assert.equal(work.decision.external_side_effect,false);
  assert.equal(work.decision.implementation_ready,false);
  assert.equal(r.no_new_scheduler,true);
  assert.equal(r.no_new_operation,true);
});
test('original engineer distinguishes generic learning from concrete protected candidate without bypassing review',()=>{
  const generic=plan(fixture({owner:'engineering',kind:'generic'})).work[0].decision;
  const concrete=plan(fixture({owner:'engineering',kind:'concrete'})).work[0].decision;
  assert.equal(generic.decision,'BASELINE_AND_EVALUATION_DESIGN_REQUIRED');
  assert.equal(generic.actionable_work_package,false);
  assert.equal(concrete.decision,'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE');
  assert.equal(concrete.actionable_work_package,true);
  assert.equal(concrete.original_owner,'agent:agent-integration-engineer');
  assert.equal(concrete.production_mutation_authorized,false);
  assert.equal(concrete.terminal_success,false);
});
test('source revision, pre-review and rollback changes fail closed before any native write',()=>{
  for(const breakIt of [
    x=>{x.snapshot.intakes[0].evidence.original_agent_pre_review.source_revision='replaced';},
    x=>{x.snapshot.intakes[0].evidence.original_agent_pre_review.consumer_ack_verified=true;},
    x=>{x.snapshot.intakes[0].evidence.original_agent_pre_review.exact_source_action_digest='bad';},
    x=>{x.snapshot.intakes[0].evidence.original_agent_pre_review.external_side_effect=true;},
    x=>{x.snapshot.candidates[0].rollback_plan={};},
    x=>{x.snapshot.candidates[0].status='ready';},
    x=>{x.snapshot.candidates[0].safety_class='safe_reversible';},
    x=>{x.snapshot.intakes[0].payload_sha256='b'.repeat(64);}
  ]){
    const fx=fixture();breakIt(fx);
    assert.throws(()=>planOriginalOwnerDecisions({snapshot:fx.snapshot,report:fx.report,observedAt:NOW}),
      /ORIGINAL_INNOVATION_OWNER_DECISION_/);
  }
});
test('source-bound owner decision only happens after real original pre-review',()=>{
  const fx=fixture();
  delete fx.snapshot.intakes[0].evidence.original_agent_pre_review;
  assert.throws(()=>plan(fx),/ORIGINAL_PRE_REVIEW_NOT_SOURCE_BOUND/);
});
test('idempotent exact decision is held; drifted or falsely closed prior decision fails closed',()=>{
  const fx=fixture();
  const first=plan(fx).work[0].decision;
  fx.operation.evidence.original_owner_decision=copy(first);
  assert.equal(plan(fx).work.length,0);
  assert.equal(plan(fx).held[0].reason,'IDENTICAL_SOURCE_BOUND_DECISION_ALREADY_RECORDED');
  fx.operation.evidence.original_owner_decision.consumer_ack_verified=true;
  assert.throws(()=>plan(fx),/STALE_OR_FALSE_PREVIOUS_DECISION/);
});
test('native CAS write plus independent provider GET reads exact original identity, remains PLANNED',async()=>{
  const fx=fixture();
  const item=plan(fx).work[0];
  let stored=copy(fx.operation),posts=0,gets=0;
  const fetchImpl=async(url,options)=>{
    if(url.includes('/rpc/brain_transition_operation')){
      posts++;
      const input=JSON.parse(options.body);
      assert.equal(input.p_operation_id,item.operation_id);
      assert.equal(input.p_expected_version,4);
      assert.equal(input.p_status,'PLANNED');
      assert.equal(input.p_remote_ref,null);
      assert.equal(input.p_evidence.original_owner_decision.consumer_ack_verified,false);
      assert.equal(input.p_evidence.original_owner_decision.external_side_effect,false);
      stored={...stored,version:stored.version+1,evidence:copy(input.p_evidence)};
      return {ok:true,json:async()=>copy(stored)};
    }
    assert.ok(url.includes('/rest/v1/brain_operations?'));
    gets++;
    return {ok:true,json:async()=>[copy(stored)]};
  };
  const result=await persistOriginalOwnerDecisions({plan:plan(fx),config,fetchImpl});
  assert.equal(result.failed,0);
  assert.equal(result.readback_proven,1);
  assert.equal(posts,1);
  assert.equal(gets,1);
  assert.equal(stored.version,5);
  assert.equal(stored.status,'PLANNED');
  assert.equal(stored.remote_ref,null);
  assert.equal(result.consumer_ack_verified,0);
  const summary=publicSummary({plan:plan(fx),execution:result,report:fx.report});
  assert.equal(summary.original_agent_consumer_ack_verified,0);
  assert.equal(summary.protected_implementations_verified,0);
  assert.equal(summary.customer_financial_effect_verified,0);
});
test('CAS conflict with independent exact existing decision is idempotent, unrelated version is not a false ACK',async()=>{
  const fx=fixture(),originalPlan=plan(fx),item=originalPlan.work[0];
  let stored={...copy(fx.operation),version:5,
    evidence:{...copy(fx.operation.evidence),original_owner_decision:copy(item.decision)}};
  const fetchImpl=async(url)=>{
    if(url.includes('/rpc/brain_transition_operation'))return {ok:false,status:409};
    return {ok:true,json:async()=>[copy(stored)]};
  };
  const found=await persistOriginalOwnerDecisions({plan:originalPlan,config,fetchImpl});
  assert.equal(found.already_decided,1);
  assert.equal(found.failed,0);
  stored.evidence.original_owner_decision={...stored.evidence.original_owner_decision,fingerprint:'0'.repeat(64)};
  const conflict=await persistOriginalOwnerDecisions({plan:originalPlan,config,fetchImpl});
  assert.equal(conflict.failed,1);
  assert.equal(conflict.readback_proven,0);
  assert.equal(conflict.consumer_ack_verified,0);
});
test('existing daily workflow calls owner decision in the same main and bounded recovery lanes',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/powerhouse-daily-self-evolution.yml',import.meta.url),'utf8');
  const occurrences=workflow.split('node scripts/brain/innovation-original-owner-decision.mjs --writeback').length-1;
  assert.equal(occurrences,2);
  assert.match(workflow,/original-intake-recovery:/);
  assert.match(workflow,/innovation-original-agent-pre-review\.mjs --writeback[\s\S]*innovation-original-owner-decision\.mjs --writeback/);
  assert.match(workflow,/schedule:[\s\S]*cron: '47 4 \* \* \*'/);
  assert.equal((workflow.match(/cron: '47 4 \* \* \*'/g)||[]).length,1);
  assert.doesNotMatch(workflow,/issues: write|pull-requests: write/);
});
