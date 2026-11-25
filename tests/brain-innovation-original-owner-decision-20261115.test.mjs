import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {evaluateOriginalOwnerHandoff} from '../scripts/brain/innovation-original-owner-readback.mjs';
import {
  CONTRACT,planOriginalOwnerDecisions,persistOriginalOwnerDecisions,publicSummary,
  OBLIGATION_HANDOFF_CONTRACT,planOriginalDecisionObligationHandoffs,persistOriginalDecisionObligationHandoffs
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
  // Original source/owner decisions remain read-only; the single bounded
  // protected-PR job is the only workflow location with write permission.
  const [ownerDecisionJobs,originalCodeJob]=workflow.split('\n  original-innovation-code-candidate:\n');
  assert.ok(originalCodeJob);
  assert.doesNotMatch(ownerDecisionJobs,/^\s*(?:contents|issues|pull-requests): write\s*$/m);
  assert.match(originalCodeJob,/^    permissions:\n      contents: write\n      pull-requests: write\n      actions: read/m);
  assert.equal((workflow.match(/^\s*pull-requests: write\s*$/gm)||[]).length,1);
  assert.doesNotMatch(workflow,/^\s*issues: write\s*$/m);
});

function obligationHandoffFixture(){
  const fx=fixture();
  fx.operation.evidence.original_owner_decision=copy(plan(fx).work[0].decision);
  const sourceReport=evaluateOriginalOwnerHandoff(fx.snapshot,{now:NOW});
  return {fx,plan:planOriginalDecisionObligationHandoffs({snapshot:fx.snapshot,report:sourceReport,observedAt:NOW})};
}
test('original ONE BRAIN obligation receipt binds same engineering/CRO source, remains OPEN without fake ACK',()=>{
  const {fx,plan:handoff}=obligationHandoffFixture();
  assert.equal(handoff.contract,OBLIGATION_HANDOFF_CONTRACT);
  assert.equal(handoff.work.length,1);
  const receipt=handoff.work[0].receipt;
  assert.equal(receipt.original_operation_id,fx.operation.id);
  assert.equal(receipt.original_owner,'agent:agent-growth-market');
  assert.equal(receipt.source_sha256,sha);
  assert.equal(receipt.original_decision_fingerprint,fx.operation.evidence.original_owner_decision.fingerprint);
  assert.equal(receipt.consumer_ack_verified,false);
  assert.equal(receipt.protected_implementation_verified,false);
  assert.equal(receipt.external_side_effect,false);
  assert.equal(receipt.terminal_success,false);
  assert.equal(receipt.financial_benefit_claimed,false);
  assert.equal(handoff.new_queue,false);
  assert.equal(handoff.new_scheduler,false);
});
test('native obligation source drift and false original agent ACK are rejected before update',()=>{
  for(const mutate of [
    fx=>{fx.operation.evidence.original_owner_decision.original_owner='agent:untrusted';},
    fx=>{fx.operation.evidence.original_owner_decision.consumer_ack_verified=true;},
    fx=>{fx.operation.evidence.original_owner_decision.production_mutation_authorized=true;},
    fx=>{fx.operation.evidence.original_owner_decision.terminal_success=true;},
    fx=>{fx.operation.evidence.original_owner_decision.source_revision='different';},
    fx=>{fx.operation.evidence.original_owner_decision.source_pre_review_fingerprint='other';},
    fx=>{fx.obligation.owner='original-agent:engineering';},
    fx=>{fx.obligation.state='FULFILLED';}
  ]){
    const {fx}=obligationHandoffFixture();mutate(fx);
    assert.throws(()=>planOriginalDecisionObligationHandoffs({
      snapshot:fx.snapshot,report:fx.report,observedAt:NOW
    }),/ORIGINAL_INNOVATION_OWNER_DECISION_/);
  }
});
test('original decision obligation handoff is idempotent only for same immutable source fingerprint',()=>{
  const {fx,plan:handoff}=obligationHandoffFixture();
  fx.obligation.evidence.original_owner_decision_handoff=copy(handoff.work[0].receipt);
  const same=planOriginalDecisionObligationHandoffs({
    snapshot:fx.snapshot,report:fx.report,observedAt:NOW
  });
  assert.equal(same.work.length,0);
  assert.equal(same.held[0].reason,'IDENTICAL_ORIGINAL_OBLIGATION_RECEIPT_ALREADY_PERSISTED');
  fx.obligation.evidence.original_owner_decision_handoff.original_decision_fingerprint='0'.repeat(64);
  assert.throws(()=>planOriginalDecisionObligationHandoffs({
    snapshot:fx.snapshot,report:fx.report,observedAt:NOW
  }),/OBLIGATION_PREVIOUS_HANDOFF_CONFLICT/);
});
test('same canonical original obligation native CAS + independent GET proves decision received but NOT agent implementation',async()=>{
  const {fx,plan:handoff}=obligationHandoffFixture();
  let stored={...copy(fx.obligation),id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    version:3,obligation_type:'INNOVATION_DELIVERY',capability_id:'powerhouse-self-improvement-layer-v1'};
  let gets=0,posts=0;
  const fetchImpl=async(url,options)=>{
    if(url.includes('/rpc/brain_transition_obligation')){
      posts++;
      const input=JSON.parse(options.body);
      assert.equal(input.p_obligation_id,stored.id);
      assert.equal(input.p_expected_version,3);
      assert.equal(input.p_state,'OPEN');
      assert.equal(input.p_owner,'original-agent:cro');
      assert.equal(input.p_evidence.original_owner_decision_handoff.consumer_ack_verified,false);
      stored={...stored,version:stored.version+1,evidence:copy(input.p_evidence)};
      return {ok:true,json:async()=>copy(stored)};
    }
    assert.ok(url.includes('/rest/v1/brain_obligations?'));
    gets++;
    return {ok:true,json:async()=>[copy(stored)]};
  };
  const result=await persistOriginalDecisionObligationHandoffs({plan:handoff,config,fetchImpl});
  assert.equal(result.failed,0);
  assert.equal(result.readback_proven,1);
  assert.equal(result.consumer_ack_claimed,0);
  assert.equal(result.implementations_verified,0);
  assert.equal(stored.state,'OPEN');
  assert.equal(stored.version,4);
  assert.equal(posts,1);
  assert.equal(gets,2);
  assert.equal(stored.evidence.original_owner_decision_handoff.original_operation_id,fx.operation.id);
});
test('original obligation provider-CAS conflict never fabricates a new receipt',async()=>{
  const {fx,plan:handoff}=obligationHandoffFixture();
  let stored={...copy(fx.obligation),id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    version:3,obligation_type:'INNOVATION_DELIVERY',capability_id:'powerhouse-self-improvement-layer-v1'};
  let failPost=true;
  const fetchImpl=async(url)=>{
    if(url.includes('/rpc/brain_transition_obligation'))return {ok:false,status:409};
    return {ok:true,json:async()=>[copy(stored)]};
  };
  const broken=await persistOriginalDecisionObligationHandoffs({plan:handoff,config,fetchImpl});
  assert.equal(broken.failed,1);
  assert.equal(broken.readback_proven,0);
  assert.equal(broken.consumer_ack_claimed,0);
  stored.evidence.original_owner_decision_handoff=copy(handoff.work[0].receipt);
  const already=await persistOriginalDecisionObligationHandoffs({plan:handoff,config,fetchImpl});
  assert.equal(already.failed,0);
  assert.equal(already.already_present,1);
  assert.equal(already.readback_proven,0);
});
