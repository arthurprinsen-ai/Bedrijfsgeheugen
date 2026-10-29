import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPowerhouseHandoffs, INTEGRATION_STAGES } from '../tools/brain/powerhouse-integration-handoff-evidence.mjs';
import { sha256 } from '../tools/brain/agent-skill-execution-evidence.mjs';

const tenantId='bedrijfsgeheugen', correlationId='cycle-29', sourceRevision='main-abc';
const hash=sha256('tested skill content');
const run={runId:'run-100',agentId:'growth-agent',tenantId,correlationId,
  loaderReceipts:[{runId:'run-100',agentId:'growth-agent',skillId:'growth-skill',version:'v1',
    contentSha256:hash,loaded:true,loaderId:'independent-loader',loadedAt:'2026-10-29T12:00:00Z'}],
  applications:[{runId:'run-100',skillId:'growth-skill',assertions:[
    {id:'quality-gate',passed:true,evidenceRef:'test/quality'}]}],
  verifier:{runId:'run-100',independent:true,passed:true,
    verifierId:'independent-verifier',evidenceRef:'test/skill-proof'}};
const manifests={'growth-agent':{requiredSkills:[{id:'growth-skill',version:'v1',contentSha256:hash}]}};
const receipts=INTEGRATION_STAGES.map((stage,i)=>({
  id:'receipt-'+i,capabilityKey:'growth-loop',stage,tenantId,correlationId,sourceRevision,
  evidenceRef:'test/evidence-'+i,
  observedAt:'2026-10-29T12:'+String(i).padStart(2,'0')+':00Z',
  predecessorReceiptId:i?'receipt-'+(i-1):null,
  ...(stage==='EXECUTE'?{actorKind:'AGENT',agentId:'growth-agent',runId:'run-100'}:{}),
  ...(stage==='READBACK'?{providerId:'provider-ack-123'}:{}),
  ...(stage==='OUTCOME'?{outcomeKind:'QUALIFIED_LEAD',
    measurement:{before:1,after:2,unit:'qualified_leads'}}:{}),
  ...(stage==='LEARN'?{learningRef:'brain/learning-100'}:{}),
  ...(stage==='PREVENT'?{regressionRef:'tests/growth-loop-100'}:{})
}));
const base=()=>({
  inventory:[{capability_key:'growth-loop',connection_state:'CONNECTED_TO_ONE_BRAIN'}],
  requirements:[{capabilityKey:'growth-loop',owner:'canonical-heartbeat',actorKind:'AGENT'}],
  receipts:structuredClone(receipts),skillRuns:[structuredClone(run)],manifests,
  verifyReceipt:r=>({independent:true,valid:true,receiptId:r.id,tenantId:r.tenantId,
    correlationId:r.correlationId,evidenceRef:'provider/verification-'+r.id}),
  now:'2026-10-29T13:00:00Z'
});
const assess=overrides=>assessPowerhouseHandoffs({...base(),...overrides});

test('independently verified handoff is evidence, never an invented paid order',()=>{
  const x=assess();
  assert.equal(x.status,'EVIDENCE_VERIFIED');
  assert.equal(x.verifiedCapabilities,1);
  assert.equal(x.closureBoundary,'INDEPENDENT_PROVIDER_AND_BUSINESS_OUTCOME_REQUIRED');
});
test('registered but disconnected or absent components fail closed',()=>{
  assert.equal(assess({inventory:[]}).status,'UNPROVEN');
  const x=assess({inventory:[{capability_key:'growth-loop',connection_state:'DISCONNECTED'}]});
  assert.ok(x.components[0].gaps.includes('NOT_WIRED_TO_ONE_BRAIN'));
});
test('SQL stage cannot impersonate an agent execution',()=>{
  const x=base();x.receipts[2].actorKind='SQL_PROCESS';
  assert.ok(assess(x).components[0].gaps.includes('EXECUTOR_CLASS_MISMATCH'));
});
test('missing real skill-load/application and verifier cannot be green',()=>{
  const x=base();x.skillRuns[0].loaderReceipts=[];
  assert.ok(assess(x).components[0].gaps.includes('AGENT_SKILL_LOAD_AND_APPLY_UNPROVEN'));
  assert.equal(assess({verifyReceipt:null}).status,'UNPROVEN');
});
test('tenant, revision and exact previous receipt must agree',()=>{
  const x=base();x.receipts[3].tenantId='other-tenant';x.receipts[4].predecessorReceiptId='wrong';
  const gaps=assess(x).components[0].gaps.join(' ');
  assert.match(gaps,/CROSS_TENANT_OR_REVISION/);
  assert.match(gaps,/BROKEN_LINEAGE/);
});
test('revenue cannot be inferred from lead intent or unverified payment',()=>{
  const x=base();x.receipts[4].outcomeKind='PAID_REVENUE';
  x.receipts[4].measurement={before:0,after:200,unit:'EUR'};
  assert.ok(assess(x).components[0].gaps.includes('INDEPENDENT_PAYMENT_PROOF_MISSING'));
  delete x.receipts[4].measurement;
  assert.ok(assess(x).components[0].gaps.includes('MEASURED_BEFORE_AFTER_MISSING'));
});
test('stale, duplicated and missing stage receipts cannot close',()=>{
  const x=base();x.receipts.pop();
  assert.ok(assess(x).components[0].gaps.includes('STAGE_RECEIPT_COUNT:PREVENT'));
  const y=base();y.receipts[1].id='receipt-0';
  assert.ok(assess(y).components[0].gaps.includes('DUPLICATE_OR_INVALID_RECEIPT:DECIDE'));
  const z=base();z.receipts[0].observedAt='2024-01-01T00:00:00Z';
  assert.ok(assess(z).components[0].gaps.includes('STALE_OR_FUTURE_EVIDENCE:OBSERVE'));
});
test('external verifier must use same tenant, run and separate reference',()=>{
  const x=base();x.verifyReceipt=r=>({independent:true,valid:true,receiptId:r.id,
    tenantId:'other-tenant',correlationId:r.correlationId,evidenceRef:r.evidenceRef});
  assert.ok(assess(x).components[0].gaps.includes('INDEPENDENT_READBACK_MISSING:OBSERVE'));
});
test('empty requirements, partial contracts and duplicate agent run cannot self-certify',()=>{
  assert.equal(assess({requirements:[]}).status,'UNPROVEN');
  const x=base();x.requirements[0].stages=['OBSERVE','EXECUTE'];
  assert.ok(assess(x).components[0].gaps.includes('INVALID_STAGE_CONTRACT'));
  const y=base();y.skillRuns.push(structuredClone(y.skillRuns[0]));
  assert.ok(assess(y).components[0].gaps.includes('DUPLICATED_AGENT_RUN_RECEIPT'));
});
