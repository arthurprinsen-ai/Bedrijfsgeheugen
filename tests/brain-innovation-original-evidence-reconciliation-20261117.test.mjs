import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  CONTRACT,planOriginalInnovationEvidence,readOriginalQualityRows,
  persistOriginalInnovationEvidence
} from '../scripts/brain/innovation-original-evidence-reconciliation.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const candidateId='1a2b3c4d-abcd-4abc-8abc-123456789012';
const sourceSha='a'.repeat(64);
const now='2026-11-17T09:00:00.000Z';
const config={origin:'https://adhjwmvyoixzjtmiroln.supabase.co',key:'z'.repeat(60)};
const revision='2026-10-29T09:00:00.000Z';
const fp='portal-visual-density-oversized-responsive-cascade-v1';
function fixture(kind='bounded_learning_followup'){
  const owner=kind==='reconcile_experiment_instrumentation'?'cro':'engineering';
  const agent=owner==='cro'?'agent:agent-growth-market':'agent:agent-integration-engineer';
  const c={
    candidate_id:candidateId,component_id:owner==='cro'?'growth-intelligence':'portal-v2',
    source_key:'quality-learning-v1:'+fp,owner_agent:owner,
    safety_class:'review_required',status:'candidate',created_at:'2026-10-29T09:00:00.000Z',
    baseline:{quality_fingerprint:fp,measured_improvement:null,observed_at:'2026-10-29'},
    expected_impact:{predicted_value_eur:null,causal_effect_verified:false},
    proposed_action:kind==='bounded_learning_followup'
      ?{kind,next_step:'Design baseline, alternative, representative evaluation and guardrails'}
      :kind==='reconcile_experiment_instrumentation'
      ?{kind,next_step:'Verify consent holdout and events'}
      :{action:'Correct first-party dashboard source and test current production evidence against measured baseline'},
    rollback_plan:{required:true,plan:'protected PR rollback'}
  };
  const ob={business_entity:candidateId,change_id:c.source_key,
    owner:'original-agent:'+owner,state:'OPEN',
    payload_sha256:sourceSha,evidence:{source_revision:revision}};
  const op={id:'afcc8bca-10c0-4e70-b19f-d85f551141a0',
    capability_id:agent,status:'PLANNED',operation_type:'INNOVATION_INTAKE',
    payload_sha256:sourceSha,change_id:c.source_key,version:5,
    correlation_id:'innovation-delivery:'+candidateId,
    idempotency_key:'innovation-delivery:'+candidateId+':'+sourceSha.slice(0,16),
    remote_ref:null,
    evidence:{original_agent_pre_review:{
      source_revision:revision,source_sha256:sourceSha,original_owner:agent,
      fingerprint:'b'.repeat(64),consumer_ack_verified:false,external_side_effect:false},
      original_owner_decision:{
        source_revision:revision,source_sha256:sourceSha,original_owner:agent,
        fingerprint:'c'.repeat(64),consumer_ack_verified:false,
        production_mutation_authorized:false,
        decision:kind==='bounded_learning_followup'
          ?'BASELINE_AND_EVALUATION_DESIGN_REQUIRED'
          :kind==='reconcile_experiment_instrumentation'
          ?'CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED'
          :'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE'
      }}
  };
  const quality=[{fingerprint:fp,capability_id:'portal-v2',status:'verified',
    escaped_to_production:true,regression_guard_ref:'.github/workflows/portal-visual-density.yml',
    root_cause:'oversized cascade',performance_evidence:{overflow_px:0,screenshots:24,production_pass:true},
    updated_at:'2026-11-16T14:02:13.000Z'}];
  const snapshot={candidates:[c],obligations:[ob],intakes:[op]};
  const report={contract:'ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1',
    counts:{candidates:1,obligations:1,intakes:1}};
  return {c,ob,op,quality,snapshot,report};
}
const plan=(f,qualityRows=f.quality)=>planOriginalInnovationEvidence({
  snapshot:f.snapshot,report:f.report,qualityRows,observedAt:now
});

test('historical quality evidence generates exact original work but NEVER current production/consumer green',()=>{
  const f=fixture(),p=plan(f);
  assert.equal(p.contract,CONTRACT);
  assert.equal(p.count,1);
  assert.equal(p.summary.quality,1);
  assert.equal(p.work.length,1);
  const r=p.work[0].receipt;
  assert.equal(r.original_owner,'agent:agent-integration-engineer');
  assert.equal(r.source_revision,revision);
  assert.equal(r.source_sha256,sourceSha);
  assert.equal(r.source_quality.status,'verified');
  assert.equal(r.source_quality.historical_claim_not_current_production_proof,true);
  assert.equal(r.historical_baseline_not_current_effect,true);
  assert.equal(r.independently_verified_current_effect,false);
  assert.equal(r.consumer_ack_verified,false);
  assert.equal(r.terminal_success,false);
  assert.equal(r.next_action,'ORIGINAL_MOBILE_VISUAL_DENSITY_EXACT_PRODUCTION_RECHECK');
  assert.equal(p.original_operation_status,'PLANNED');
  assert.equal(p.new_scheduler,false);
});

test('same original source is idempotent; quality updates trigger reconciliation without false closure',()=>{
  const f=fixture(),first=plan(f).work[0].receipt;
  f.op.evidence.original_evidence_reconciliation=first;
  assert.equal(plan(f).work.length,0);
  assert.equal(plan(f).held.length,1);
  f.quality[0].performance_evidence.screenshots=25;
  const next=plan(f);
  assert.equal(next.work.length,1);
  assert.notEqual(next.work[0].receipt.fingerprint,first.fingerprint);
  assert.equal(next.work[0].receipt.terminal_success,false);
});

test('source identity, owner drift, missing independent quality, duplicate fingerprints all fail closed',()=>{
  const cases=[
    f=>{f.op.payload_sha256='f'.repeat(64);},
    f=>{f.op.capability_id='agent:wrong';},
    f=>{f.op.evidence.original_owner_decision.consumer_ack_verified=true;},
    f=>{f.ob.state='DONE';},
    f=>{f.op.status='VERIFIED';},
    f=>{f.c.baseline.quality_fingerprint='../../untrusted';},
    f=>{f.quality[0].capability_id='other-team';}
  ];
  for(const mutate of cases){
    const f=fixture();mutate(f);
    assert.throws(()=>plan(f),/ORIGINAL_INNOVATION_EVIDENCE_/);
  }
  const f=fixture();
  assert.throws(()=>plan(f,[]),/QUALITY_SOURCE_NOT_VERIFIABLE/);
  assert.throws(()=>plan(f,[...f.quality,...f.quality]),/DUPLICATE_SOURCE/);
});

test('CRO followup requires independent measurement and holdout, never silently changes to code-write',()=>{
  const f=fixture('reconcile_experiment_instrumentation');
  const p=plan(f,[]);
  assert.equal(p.summary.cro,1);
  assert.equal(p.work[0].receipt.disposition,'CRO_EVENT_DEFINITION_CONSENT_HOLDOUT_AND_FUNNEL_BASELINE_DUE');
  assert.equal(p.work[0].receipt.automated_external_provider_dispatch,false);
});

test('concrete protected source stays under existing code/release owner, never re-opened as new job',()=>{
  const f=fixture('concrete');
  f.op.evidence.original_code_candidate_pr={candidate_id:candidateId,
    source_revision:revision,source_sha256:sourceSha};
  f.op.evidence.original_code_production_readback={independently_verified_provider_release:true};
  const p=plan(f,[]);
  assert.equal(p.summary.release,1);
  assert.equal(p.work[0].receipt.disposition,'PRODUCTION_CODE_PUBLISHED_CONSUMER_AND_EFFECT_DUE');
  assert.equal(p.work[0].receipt.terminal_success,false);
});

test('quality REST requires exact source count, exact fingerprint and bounded source list',async()=>{
  const f=fixture();
  let called='';
  const good=async(url)=>{
    called=url;
    return {ok:true,status:200,headers:{get:x=>x==='content-range'?'0-0/1':null},
      json:async()=>f.quality};
  };
  const rows=await readOriginalQualityRows({snapshot:f.snapshot,config,fetchImpl:good});
  assert.equal(rows.length,1);
  assert.ok(called.includes('powerhouse_quality_events'));
  assert.ok(called.includes('fingerprint='));
  await assert.rejects(readOriginalQualityRows({snapshot:f.snapshot,config,
    fetchImpl:async()=>({ok:true,status:200,headers:{get:()=> '0-0/2'},json:async()=>f.quality})
  }),/QUALITY_EXACT_SOURCE_CARDINALITY_DRIFT/);
});

test('native original CAS receipt plus independent GET keeps PLANNED; version conflicts cannot overwrite another agent',async()=>{
  const f=fixture(),p=plan(f);
  let stored=structuredClone(f.op),writes=0,reads=0;
  const fetchImpl=async(url,options={})=>{
    if(url.includes('/rest/v1/brain_operations?')){
      reads++;
      return {ok:true,json:async()=>[structuredClone(stored)]};
    }
    if(url.includes('/rest/v1/rpc/brain_transition_operation')){
      writes++;
      const args=JSON.parse(options.body);
      assert.equal(args.p_status,'PLANNED');
      assert.equal(args.p_dispatch_generation,null);
      assert.equal(args.p_remote_ref,null);
      assert.equal(args.p_expected_version,5);
      assert.equal(args.p_evidence.original_evidence_reconciliation.consumer_ack_verified,false);
      stored={...stored,version:6,evidence:args.p_evidence};
      return {ok:true,json:async()=>structuredClone(stored)};
    }
    throw new Error('UNEXPECTED_ENDPOINT');
  };
  const result=await persistOriginalInnovationEvidence({plan:p,config,fetchImpl});
  assert.equal(result.updated,1);
  assert.equal(result.failed,0);
  assert.equal(writes,1);
  assert.ok(reads>=2);
  assert.equal(stored.status,'PLANNED');
  assert.equal(stored.evidence.original_evidence_reconciliation.terminal_success,false);
  const conflict=await persistOriginalInnovationEvidence({plan:p,config,fetchImpl});
  assert.equal(conflict.failed,1);
  assert.equal(writes,1);
});

test('one original daily engineering job owns nine-quality reconciliation and has no extra cron or silent failure',()=>{
  const yaml=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  const codeJob=yaml.split(/^  original-innovation-code-candidate:\n/m)[1];
  assert.ok(codeJob,'original engineering job must exist');
  const verify=codeJob.indexOf('Verify exact original quality-source reconciliation and CAS invariants');
  const record=codeJob.indexOf('Reconcile 14 original source-quality receipts using original version-CAS');
  const select=codeJob.indexOf('Select at most one source-bound original engineering work order');
  const validate=codeJob.indexOf('Enforce exact scoped implementation');
  const failVisible=codeJob.indexOf('Fail visibly when original quality reconciliation did not complete');
  const publish=codeJob.indexOf('Publish only the validated code candidate');
  assert.ok(verify>=0&&record>verify&&select>record&&validate>select);
  assert.ok(failVisible>publish,'reconciliation source problems must not starve safe original PR work');
  assert.match(codeJob,/if node scripts\/brain\/innovation-original-evidence-reconciliation\.mjs --writeback/);
  assert.match(codeJob,/reconciled=false/);
  assert.match(codeJob,/steps\.original_quality_reconcile\.outputs\.reconciled == 'false'/);
  assert.doesNotMatch(codeJob,/continue-on-error:|\|\| true|exit 0/,'provider freshness failures stay visible in original workflow');
  assert.match(codeJob,/ORIGINAL_14_QUALITY_RECONCILIATION_FAILED/);
  assert.equal((yaml.match(/^\s+- cron:/gm)||[]).length,1,'only original one daily schedule');
  assert.equal((yaml.match(/^  original-innovation-code-candidate:/gm)||[]).length,1,'no second code executor');
});


test('one exact guard_required source stays OPEN while other original candidates reconcile',()=>{
  const f=fixture(),g=fixture();
  const id='2a2b3c4d-abcd-4abc-8abc-123456789012';
  const fingerprint='powerhouse-commercial-email-human-intent-leak-20261121-v1';
  g.c.candidate_id=id;g.c.component_id='powerhouse-commercial-message-composer';
  g.c.source_key='quality-learning-v1:'+fingerprint;g.c.baseline.quality_fingerprint=fingerprint;
  g.ob.business_entity=id;g.ob.change_id=g.c.source_key;
  g.op.id='bfcc8bca-10c0-4e70-b19f-d85f551141a0';g.op.change_id=g.c.source_key;
  g.op.correlation_id='innovation-delivery:'+id;g.op.idempotency_key=g.op.correlation_id+':'+sourceSha.slice(0,16);
  g.quality[0].fingerprint=fingerprint;g.quality[0].capability_id=g.c.component_id;g.quality[0].status='guard_required';
  f.snapshot.candidates.push(g.c);f.snapshot.obligations.push(g.ob);f.snapshot.intakes.push(g.op);
  f.report.counts={candidates:2,obligations:2,intakes:2};f.quality.push(g.quality[0]);
  const p=plan(f);assert.equal(p.work.length,1);assert.equal(p.work[0].receipt.candidate_id,candidateId);
  assert.equal(p.qualityBlocked.length,1);assert.equal(p.qualityBlocked[0].candidate_id,id);
  assert.equal(p.qualityBlocked[0].terminal_success,false);assert.equal(p.qualityBlocked[0].consumer_ack_verified,false);
  assert.equal(g.op.status,'PLANNED');assert.equal(g.ob.state,'OPEN');
  g.quality[0].status='guarded';const next=plan(f);assert.equal(next.work.length,2);
  assert.equal(next.qualityBlocked.length,0);
  assert.equal(next.work[1].receipt.next_action,'ORIGINAL_COMMERCIAL_COMPOSER_REGRESSION_AND_EXACT_PRODUCTION_RECHECK');
  g.quality[0].status='guard_required';g.quality[0].capability_id='wrong';
  assert.throws(()=>plan(f),/QUALITY_SOURCE_NOT_VERIFIABLE/);
});
