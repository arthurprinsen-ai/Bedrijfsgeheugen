/**
 * Read-only proof of handoffs inside the existing ONE BRAIN / Powerhouse / Heartbeat.
 * No new executor, scheduler, state store, provider write, or false-success fallback.
 * A trusted caller must source inventory and independently verify each receipt.
 */
import { validateSkillExecutionEvidence } from '../../tools/brain/agent-skill-execution-evidence.mjs';

export const INTEGRATION_STAGES = Object.freeze([
  'OBSERVE', 'DECIDE', 'EXECUTE', 'READBACK', 'OUTCOME', 'LEARN', 'PREVENT'
]);
const id = v => typeof v === 'string' && /^[a-zA-Z0-9._:/-]{1,180}$/.test(v);
const timestamp = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const list = v => Array.isArray(v) ? v : [];

/**
 * Inputs must come from canonical inventory, original run/skill receipts and
 * independent external verifier, not from self-declared agent prose.
 * This classifier cannot by itself assert that production was deployed or paid.
 */
export function assessPowerhouseHandoffs({
  inventory=[], requirements=[], receipts=[], skillRuns=[], manifests={},
  verifyReceipt, now=new Date().toISOString(), maxAgeHours=48
}={}) {
  const errors=[];
  if (!timestamp(now) || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0)
    return {status:'UNPROVEN',errors:['INVALID_VERIFICATION_WINDOW'],components:[]};
  if (!Array.isArray(requirements) || !requirements.length ||
      new Set(requirements.map(r=>r?.capabilityKey)).size !== requirements.length)
    return {status:'UNPROVEN',errors:['CANONICAL_REQUIREMENTS_MISSING_OR_DUPLICATED'],components:[]};

  const capabilities=new Map();
  for (const item of list(inventory)) {
    if (!id(item?.capability_key) || capabilities.has(item.capability_key))
      errors.push('DUPLICATE_OR_INVALID_CAPABILITY_INVENTORY');
    else capabilities.set(item.capability_key,item);
  }
  const runIndex=new Map(), duplicateRuns=new Set();
  for (const run of list(skillRuns)) {
    if (!id(run?.runId) || !id(run?.agentId)) continue;
    const runKey=run.agentId+':'+run.runId;
    if (runIndex.has(runKey)) duplicateRuns.add(runKey);
    else runIndex.set(runKey,run);
  }
  const usedReceipts=new Set();
  const components=requirements.map(requirement=>{
    const capabilityKey=requirement?.capabilityKey, owner=requirement?.owner??null, gaps=[];
    const entry=capabilities.get(capabilityKey);
    if (!id(capabilityKey) || !id(owner)) gaps.push('CAPABILITY_OWNER_MISSING');
    if (!['AGENT','SQL_PROCESS','HUMAN','PROVIDER'].includes(requirement?.actorKind))
      gaps.push('EXECUTOR_CLASS_UNDECLARED');
    if (!entry) gaps.push('NOT_REGISTERED_IN_ONE_BRAIN');
    else if (entry.connection_state!=='CONNECTED_TO_ONE_BRAIN') gaps.push('NOT_WIRED_TO_ONE_BRAIN');
    const stages=list(requirement?.stages).length?requirement.stages:INTEGRATION_STAGES;
    if (stages.length!==INTEGRATION_STAGES.length ||
        stages.some((stage,index)=>stage!==INTEGRATION_STAGES[index]))
      gaps.push('INVALID_STAGE_CONTRACT');
    if (typeof verifyReceipt!=='function') gaps.push('INDEPENDENT_VERIFIER_UNAVAILABLE');
    let previous=null, previousTime=-Infinity, originalLineage=null;
    for (const stage of stages) {
      const matching=list(receipts).filter(r=>r?.capabilityKey===capabilityKey&&r?.stage===stage);
      if (matching.length!==1) {gaps.push('STAGE_RECEIPT_COUNT:'+stage);continue;}
      const r=matching[0];
      if (!id(r.id) || usedReceipts.has(r.id)) {
        gaps.push('DUPLICATE_OR_INVALID_RECEIPT:'+stage);continue;
      }
      usedReceipts.add(r.id);
      if (![r.tenantId,r.correlationId,r.sourceRevision,r.evidenceRef].every(id) ||
          !timestamp(r.observedAt)) {gaps.push('INVALID_PROVENANCE:'+stage);continue;}
      const time=Date.parse(r.observedAt), nowMs=Date.parse(now);
      if (time>nowMs+60000 || nowMs-time>maxAgeHours*3600000)
        gaps.push('STALE_OR_FUTURE_EVIDENCE:'+stage);
      if (time<previousTime) gaps.push('STAGE_OUT_OF_ORDER:'+stage);
      previousTime=time;
      const lineage=[r.tenantId,r.correlationId,r.sourceRevision].join(':');
      if (originalLineage!==null && originalLineage!==lineage)
        gaps.push('CROSS_TENANT_OR_REVISION:'+stage);
      originalLineage??=lineage;
      if (previous && r.predecessorReceiptId!==previous.id) gaps.push('BROKEN_LINEAGE:'+stage);
      if (!previous && r.predecessorReceiptId!=null) gaps.push('UNEXPECTED_PREDECESSOR:'+stage);
      if (stage==='EXECUTE') {
        if (r.actorKind!==requirement.actorKind) gaps.push('EXECUTOR_CLASS_MISMATCH');
        if (requirement.actorKind==='AGENT') {
          if (!id(r.agentId)||!id(r.runId)) gaps.push('AGENT_ACTOR_PROVENANCE_MISSING');
          else {
            const runKey=r.agentId+':'+r.runId, run=runIndex.get(runKey);
            if (duplicateRuns.has(runKey)) gaps.push('DUPLICATED_AGENT_RUN_RECEIPT');
            if (validateSkillExecutionEvidence(run,manifests[r.agentId]).status!=='VERIFIED_EVIDENCE' ||
                run?.tenantId!==r.tenantId || run?.correlationId!==r.correlationId)
              gaps.push('AGENT_SKILL_LOAD_AND_APPLY_UNPROVEN');
          }
        }
      }
      if (stage==='READBACK'&&!id(r.providerId))
        gaps.push('PROVIDER_OR_RUNTIME_READBACK_ID_MISSING');
      if (stage==='OUTCOME') {
        const m=r.measurement;
        if (!m||!Number.isFinite(m.before)||!Number.isFinite(m.after)||!id(m.unit))
          gaps.push('MEASURED_BEFORE_AFTER_MISSING');
        if (r.outcomeKind==='PAID_REVENUE' &&
            (!id(r.paymentProviderId)||m?.unit!=='EUR'||m?.after<0))
          gaps.push('INDEPENDENT_PAYMENT_PROOF_MISSING');
      }
      if (stage==='LEARN'&&!id(r.learningRef)) gaps.push('BRAIN_LEARNING_WRITEBACK_MISSING');
      if (stage==='PREVENT'&&!id(r.regressionRef)) gaps.push('REGRESSION_PREVENTION_MISSING');
      try {
        const proof=typeof verifyReceipt==='function'?verifyReceipt(r):null;
        if (proof?.independent!==true||proof?.valid!==true||proof?.receiptId!==r.id||
            proof?.tenantId!==r.tenantId||proof?.correlationId!==r.correlationId||
            !id(proof?.evidenceRef)||proof.evidenceRef===r.evidenceRef)
          gaps.push('INDEPENDENT_READBACK_MISSING:'+stage);
      } catch {gaps.push('INDEPENDENT_READBACK_FAILED:'+stage);}
      previous=r;
    }
    return {capabilityKey:capabilityKey??null,owner,checkedStages:stages.length,
      status:gaps.length?'UNPROVEN':'EVIDENCE_VERIFIED',gaps:[...new Set(gaps)]};
  });
  return {contract:'POWERHOUSE_EXISTING_ONE_BRAIN_HANDOFF_V1',
    status:!errors.length && components.every(c=>c.status==='EVIDENCE_VERIFIED')
      ?'EVIDENCE_VERIFIED':'UNPROVEN',
    checkedCapabilities:components.length,
    verifiedCapabilities:components.filter(c=>c.status==='EVIDENCE_VERIFIED').length,
    closureBoundary:'INDEPENDENT_PROVIDER_AND_BUSINESS_OUTCOME_REQUIRED',
    errors:[...new Set(errors)],components};
}
