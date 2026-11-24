import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  examineOriginalDelivery,sourceQualityNextAction
} from '../scripts/brain/innovation-original-delivery-continuity.mjs';
import {QUALITY_NEXT,CONTRACT as QUALITY_CONTRACT} from
  '../scripts/brain/innovation-original-evidence-reconciliation.mjs';

const candidateId='4537e699-47e9-4f52-8d30-406d2f0dffd4';
const operationId='77afc3ca-4c83-4b56-a2a9-a4ddd557ddaf';
const sourceKey='quality-learning-v1:page-seo-diagnose-release-blocker-v1';
const qualityKey='page-seo-diagnose-release-blocker-v1';
const owner='agent:agent-integration-engineer';
const sha='a'.repeat(64);
const revision='2026-10-09T03:02:00.367007+00:00';

function fixture({status='verified',withReceipt=true}={}){
  const candidate={
    candidate_id:candidateId,component_id:'release-promotion-observability',
    owner_agent:'engineering',source_key:sourceKey,
    proposed_action:{kind:'bounded_learning_followup'},
    baseline:{quality_fingerprint:qualityKey}
  };
  const obligation={
    business_entity:candidateId,change_id:sourceKey,owner:'original-agent:engineering',
    state:'OPEN',payload_sha256:sha,evidence:{source_revision:revision}
  };
  const decision={
    original_owner:owner,source_revision:revision,source_sha256:sha,
    decision:'BASELINE_AND_EVALUATION_DESIGN_REQUIRED',
    fingerprint:'b'.repeat(64)
  };
  const quality={
    status,original_fingerprint:qualityKey,source_evidence_sha256:'f'.repeat(64),
    historical_claim_not_current_production_proof:true
  };
  const receipt={
    contract:QUALITY_CONTRACT,
    candidate_id:candidateId,original_operation_id:operationId,
    original_owner:owner,source_revision:revision,source_sha256:sha,
    original_change_id:sourceKey,
    source_decision_fingerprint:decision.fingerprint,
    source_pre_review_fingerprint:'c'.repeat(64),
    source_quality:quality,
    disposition:status==='verified'?
      'HISTORICAL_VERIFIED_QUALITY_SOURCE_CURRENT_EFFECT_DUE':
      'HISTORICAL_GUARDED_QUALITY_SOURCE_CURRENT_PROOF_DUE',
    next_action:QUALITY_NEXT[candidate.component_id],
    evidence_type:'HISTORICAL_FIRST_PARTY_QUALITY_EVENT_UNCONFIRMED_AS_CURRENT_PRODUCTION',
    fingerprint:'d'.repeat(64),
    independently_verified_current_effect:false,consumer_ack_verified:false,
    terminal_success:false,historical_baseline_not_current_effect:true,
    protected_review_required:true,automated_external_provider_dispatch:false
  };
  const operation={
    id:operationId,operation_type:'INNOVATION_INTAKE',status:'PLANNED',
    remote_ref:null,capability_id:owner,correlation_id:'innovation-delivery:'+candidateId,
    payload_sha256:sha,change_id:sourceKey,evidence:{
      original_owner_decision:decision,original_agent_pre_review:{fingerprint:'c'.repeat(64)},
      ...(withReceipt?{original_evidence_reconciliation:receipt}:{})
    }
  };
  return {candidate,obligation,operation};
}
test('original first-party verified quality result selects source-specific next owner duty, never terminal',()=>{
  const f=fixture();
  const a=examineOriginalDelivery(f);
  assert.equal(a.stage,'HISTORICAL_VERIFIED_QUALITY_SOURCE_CURRENT_EFFECT_DUE');
  assert.equal(a.original_quality_next_action,'ORIGINAL_PROTECTED_MERGE_AND_EXACT_PRODUCTION_CHECK');
  assert.equal(a.original_quality_receipt_fingerprint,'d'.repeat(64));
  assert.equal(a.original_quality_evidence_sha256,'f'.repeat(64));
  assert.equal(a.current_quality_effect_verified,false);
  assert.equal(a.independent_impact_verified,false);
  assert.equal(a.consumer_ack_verified,false);
  assert.equal(a.terminal_success,false);
  assert.equal(a.expected_impact,null);
  assert.equal(a.actual_impact,null);
  assert.equal(a.holdout_impact,null);
  assert.equal(a.original_state_remains,'PLANNED');
  assert.equal(a.obligation_state_remains,'OPEN');
});
test('historical guarded quality result stays source-proof due, never upgrades to verified current effect',()=>{
  const f=fixture({status:'guarded'});
  const a=examineOriginalDelivery(f);
  assert.equal(a.stage,'HISTORICAL_GUARDED_QUALITY_SOURCE_CURRENT_PROOF_DUE');
  assert.equal(a.original_quality_next_action,QUALITY_NEXT[f.candidate.component_id]);
  assert.equal(a.independent_impact_verified,false);
});
test('old original operation without quality CAS remains generic baseline and no automatic action',()=>{
  const f=fixture({withReceipt:false});
  const a=examineOriginalDelivery(f);
  assert.equal(a.stage,'BASELINE_OR_SAFE_SCOPE_DUE');
  assert.equal(a.original_quality_next_action,null);
  assert.equal(a.terminal_success,false);
});
test('spoofed quality receipt cannot steal source owner authority or spoof current effect',()=>{
  const variants=[
    f=>{f.operation.evidence.original_evidence_reconciliation.source_sha256='z'.repeat(64)},
    f=>{f.operation.evidence.original_evidence_reconciliation.source_revision='2026-11-18'},
    f=>{f.operation.evidence.original_evidence_reconciliation.original_owner='agent:other'},
    f=>{f.operation.evidence.original_evidence_reconciliation.original_operation_id='other'},
    f=>{f.operation.evidence.original_evidence_reconciliation.original_change_id='other'},
    f=>{f.operation.evidence.original_evidence_reconciliation.source_decision_fingerprint='x'},
    f=>{f.operation.evidence.original_evidence_reconciliation.source_pre_review_fingerprint='x'},
    f=>{f.operation.evidence.original_evidence_reconciliation.source_quality.original_fingerprint='other'},
    f=>{f.operation.evidence.original_evidence_reconciliation.source_quality.status='COMPLETED'},
    f=>{f.operation.evidence.original_evidence_reconciliation.source_quality.source_evidence_sha256='x'},
    f=>{f.operation.evidence.original_evidence_reconciliation.next_action='PUBLISH_NOW'},
    f=>{f.operation.evidence.original_evidence_reconciliation.disposition='PROTECTED_BUILD_DUE'},
    f=>{f.operation.evidence.original_evidence_reconciliation.evidence_type='LIVE_CUSTOMER_ROI'},
    f=>{f.operation.evidence.original_evidence_reconciliation.consumer_ack_verified=true},
    f=>{f.operation.evidence.original_evidence_reconciliation.terminal_success=true},
    f=>{f.operation.evidence.original_evidence_reconciliation.independently_verified_current_effect=true},
    f=>{f.operation.evidence.original_evidence_reconciliation.protected_review_required=false},
    f=>{f.operation.evidence.original_evidence_reconciliation.automated_external_provider_dispatch=true},
    f=>{f.operation.evidence.original_evidence_reconciliation.fingerprint='x'}
  ];
  for(const mutate of variants){
    const f=fixture();mutate(f);
    assert.throws(()=>examineOriginalDelivery(f),/ORIGINAL_QUALITY_RECEIPT_SOURCE_OR_AUTHORITY_DRIFT/);
  }
});
test('source-quality receipt never replaces other original CRO or code decision lanes',()=>{
  const f=fixture();
  f.candidate.proposed_action.kind='concrete_protected_change';
  f.operation.evidence.original_owner_decision.decision='CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE';
  assert.equal(sourceQualityNextAction({
    ...f,decision:f.operation.evidence.original_owner_decision
  }),null);
  assert.equal(examineOriginalDelivery(f).stage,'PROTECTED_BUILD_DUE');
});
test('same protected original delivery job consumes the receipt with no second cron or provider sender',()=>{
  const workflow=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  const script=readFileSync('scripts/brain/innovation-original-delivery-continuity.mjs','utf8');
  const start=workflow.indexOf('  original-delivery-recovery:');
  const end=workflow.indexOf('  model-freshness:',start);
  assert.ok(start>0&&end>start);
  const job=workflow.slice(start,end);
  assert.match(job,/node --test tests\/brain-innovation-delivery-continuity-20261117\.test\.mjs/);
  assert.match(job,/node scripts\/brain\/innovation-original-delivery-continuity\.mjs --reconcile/);
  assert.match(script,/sourceQualityNextAction/);
  assert.match(script,/original_quality_next_action/);
  assert.equal((workflow.match(/^\s+- cron:/gm)||[]).length,1);
  assert.doesNotMatch(job,/gh pr create|openart_generate_video|codex-action|NETLIFY_AUTH_TOKEN/);
});
