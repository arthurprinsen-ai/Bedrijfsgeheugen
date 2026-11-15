import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows,evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

export const CONTRACT='ORIGINAL_INNOVATION_OWNER_DECISION_HANDOFF_V1';
export const ARTIFACT='artifacts/quality/original-innovation-owner-decision.json';
const MAX_WORK=25;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const text=value=>typeof value==='string'?value.trim():'';
const assert=(ok,reason)=>{if(!ok)throw new Error('ORIGINAL_INNOVATION_OWNER_DECISION_'+reason);};
const BOUNDED_STAGES=Object.freeze([
  'ORIGINAL_AGENT_SOURCE_DECISION',
  'PROTECTED_IMPLEMENTATION',
  'INDEPENDENT_PROVIDER_READBACK',
  'OBSERVED_IMPACT_AND_NO_ACTION_COMPARATOR',
  'ONE_BRAIN_CONSUMER_LEARNING'
]);

function classifyOriginalWork(candidate,owner){
  const action=candidate.proposed_action;
  if(action.kind==='bounded_learning_followup'){
    assert(owner==='agent:agent-integration-engineer','LEARNING_OWNER_CONFLICT');
    return Object.freeze({
      decision:'BASELINE_AND_EVALUATION_DESIGN_REQUIRED',
      next_action:'Original engineering owner: derive a current source-backed baseline, challenger and regression plan before protected candidate',
      implementation_ready:false,source_cost_or_gain_measured:false,requires_comparable_evaluation:true
    });
  }
  if(action.kind==='reconcile_experiment_instrumentation'){
    assert(owner==='agent:agent-growth-market','CRO_OWNER_CONFLICT');
    return Object.freeze({
      decision:'CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED',
      next_action:'Original CRO owner: verify consent, bot classification, treatment/holdout, baseline and real funnel outcome prior to a bounded experiment',
      implementation_ready:false,source_cost_or_gain_measured:false,requires_comparable_evaluation:true
    });
  }
  if(owner==='agent:agent-integration-engineer'&&text(action.action).length>=40){
    return Object.freeze({
      decision:'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',
      next_action:'Original engineering owner: verify proposed source-function/file is current, create a bounded protected candidate with regression, rollback and independent production readback',
      implementation_ready:false,source_cost_or_gain_measured:false,requires_comparable_evaluation:true
    });
  }
  return Object.freeze({
    decision:'INSUFFICIENT_ACTIONABLE_SOURCE_EVIDENCE',
    next_action:'Original owner: obtain a specific source, measurable baseline, protected path and safe rollback before taking any external action',
    implementation_ready:false,source_cost_or_gain_measured:false,requires_comparable_evaluation:true
  });
}

export function planOriginalOwnerDecisions({snapshot,report,observedAt=new Date().toISOString(),maxWork=MAX_WORK}={}){
  assert(report?.contract==='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1','INVALID_OWNER_REPORT');
  assert(Number.isFinite(Date.parse(observedAt)),'INVALID_CLOCK');
  assert(Number.isInteger(maxWork)&&maxWork>0&&maxWork<=MAX_WORK,'INVALID_BUDGET');
  const candidates=snapshot?.candidates, obligations=snapshot?.obligations, intakes=snapshot?.intakes;
  assert([candidates,obligations,intakes].every(Array.isArray),'MISSING_SOURCE_ARRAYS');
  assert(report.counts?.candidates===candidates.length
    &&report.counts?.obligations===obligations.length
    &&report.counts?.intakes===intakes.length,'SOURCE_CARDINALITY_DRIFT');
  const byCandidate=new Map(candidates.map(c=>[String(c.candidate_id),c]));
  const byObligation=new Map(obligations.map(o=>[String(o.business_entity),o]));
  const byOperation=new Map(intakes.map(o=>[String(o.correlation_id),o]));
  assert(byCandidate.size===candidates.length
    &&byObligation.size===obligations.length
    &&byOperation.size===intakes.length,'DUPLICATE_SOURCE_IDENTITIES');
  const work=[],held=[];
  for(const task of report.tasks){
    const candidate=byCandidate.get(task.candidate_id);
    const obligation=byObligation.get(task.candidate_id);
    const operation=byOperation.get('innovation-delivery:'+task.candidate_id);
    assert(candidate&&obligation&&operation,'SOURCE_IDENTITY_MISSING');
    assert(candidate.status==='candidate'
      &&candidate.safety_class==='review_required'
      &&isObject(candidate.proposed_action)
      &&isObject(candidate.rollback_plan)
      &&Object.keys(candidate.rollback_plan).length>0,'POLICY_OR_ROLLBACK_NOT_PROVEN');
    assert(task.source_key===candidate.source_key
      &&task.source_revision===obligation.evidence?.source_revision
      &&task.original_owner===operation.capability_id
      &&task.original_operation_id===operation.id
      &&operation.payload_sha256===obligation.payload_sha256
      &&operation.correlation_id==='innovation-delivery:'+task.candidate_id
      &&operation.idempotency_key==='innovation-delivery:'+task.candidate_id+':'+obligation.payload_sha256.slice(0,16)
      &&operation.change_id===candidate.source_key,'TENANT_OWNER_REVISION_OR_IDEMPOTENCY_MISMATCH');
    if(task.consumer_ack_verified){
      held.push({reason:'INDEPENDENT_CONSUMER_ALREADY_VERIFIED'});
      continue;
    }
    if(operation.status!=='PLANNED'||text(operation.remote_ref)){
      held.push({reason:'ORIGINAL_OPERATION_NOT_SAFE_TO_REVIEW'});
      continue;
    }
    const reviewed=operation.evidence?.original_agent_pre_review;
    assert(isObject(reviewed)
      &&reviewed.original_owner===task.original_owner
      &&reviewed.source_revision===task.source_revision
      &&reviewed.source_sha256===obligation.payload_sha256
      &&reviewed.source_and_rollback_examined===true
      &&reviewed.consumer_ack_verified===false
      &&reviewed.external_side_effect===false
      &&reviewed.production_mutation_authorized===false
      &&reviewed.exact_source_action_digest===digest(candidate.proposed_action)
      &&reviewed.exact_source_rollback_digest===digest(candidate.rollback_plan)
      &&text(reviewed.fingerprint).length===64,'ORIGINAL_PRE_REVIEW_NOT_SOURCE_BOUND');
    const classification=classifyOriginalWork(candidate,task.original_owner);
    const fingerprint=digest({
      candidate_id:task.candidate_id,source_key:task.source_key,
      source_revision:task.source_revision,payload_sha256:obligation.payload_sha256,
      original_owner:task.original_owner,pre_review_fingerprint:reviewed.fingerprint,
      original_action_digest:digest(candidate.proposed_action),
      rollback_digest:digest(candidate.rollback_plan),
      decision:classification.decision
    });
    const prior=operation.evidence?.original_owner_decision;
    if(prior){
      assert(prior.contract===CONTRACT&&prior.fingerprint===fingerprint
        &&prior.original_owner===task.original_owner
        &&prior.source_revision===task.source_revision
        &&prior.consumer_ack_verified===false
        &&prior.production_mutation_authorized===false
        &&prior.external_side_effect===false,'STALE_OR_FALSE_PREVIOUS_DECISION');
      held.push({reason:'IDENTICAL_SOURCE_BOUND_DECISION_ALREADY_RECORDED'});
      continue;
    }
    assert(Number.isSafeInteger(Number(operation.version))&&Number(operation.version)>0,'CAS_VERSION_INVALID');
    work.push(Object.freeze({
      operation_id:operation.id,expected_version:Number(operation.version),
      idempotency_key:operation.idempotency_key,capability_id:operation.capability_id,
      source_sha256:operation.payload_sha256,source_revision:task.source_revision,
      correlation_id:operation.correlation_id,change_id:operation.change_id,
      prior_evidence:operation.evidence??{},
      decision:Object.freeze({
        contract:CONTRACT,fingerprint,decision:classification.decision,
        next_action:classification.next_action,
        original_owner:task.original_owner,
        candidate_id:task.candidate_id,source_key:task.source_key,
        source_revision:task.source_revision,source_sha256:obligation.payload_sha256,
        original_operation_id:operation.id,original_correlation_id:operation.correlation_id,
        original_idempotency_key:operation.idempotency_key,
        source_pre_review_fingerprint:reviewed.fingerprint,
        original_action_digest:digest(candidate.proposed_action),
        original_rollback_digest:digest(candidate.rollback_plan),
        mandatory_stages:BOUNDED_STAGES,
        scope:'EXISTING_ORIGINAL_ONE_BRAIN_OPERATION_ONLY',
        review_required:true,requires_protected_release:true,
        autonomous_source_decision_recorded:true,
        actionable_work_package:classification.decision==='CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',
        requires_comparable_evaluation:classification.requires_comparable_evaluation,
        implementation_ready:classification.implementation_ready,
        independent_customer_value_verified:false,provider_receipt_verified:false,
        consumer_ack_verified:false,production_mutation_authorized:false,
        external_side_effect:false,terminal_success:false,
        observed_at:observedAt
      })
    }));
  }
  return Object.freeze({
    contract:CONTRACT,origin:'original-company-brain-intake',
    candidate_count:candidates.length,work:Object.freeze(work.slice(0,maxWork)),
    held:Object.freeze(held),deferred_by_budget:Math.max(0,work.length-maxWork),
    no_new_operation:true,no_new_queue:true,no_new_scheduler:true,
    no_external_execution:true,original_consumer_ack_claimed:false
  });
}

async function fetchOriginalOperation({config,fetchImpl,operationId}){
  const params=new URLSearchParams({id:'eq.'+operationId,select:'id,capability_id,operation_type,idempotency_key,payload_sha256,change_id,correlation_id,status,version,remote_ref,evidence'});
  const response=await fetchImpl(config.origin+'/rest/v1/brain_operations?'+params,{
    method:'GET',headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'}
  });
  assert(response?.ok,'INDEPENDENT_GET_FAILED');
  const current=await response.json();
  assert(Array.isArray(current)&&current.length===1,'INDEPENDENT_GET_CARDINALITY');
  return current[0];
}
function matchesOriginalOperation(row,item){
  return row?.id===item.operation_id
    &&row?.capability_id===item.capability_id
    &&row?.operation_type==='INNOVATION_INTAKE'
    &&row?.idempotency_key===item.idempotency_key
    &&row?.payload_sha256===item.source_sha256
    &&row?.correlation_id===item.correlation_id
    &&row?.change_id===item.change_id
    &&row?.status==='PLANNED'
    &&!text(row?.remote_ref);
}

export async function persistOriginalOwnerDecisions({plan,config,fetchImpl=globalThis.fetch}={}){
  assert(plan?.contract===CONTRACT&&Array.isArray(plan.work),'INVALID_PLAN');
  assert(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config?.origin??'')
    &&text(config?.key).length>=12&&typeof fetchImpl==='function','UNTRUSTED_PROVIDER_CONFIG');
  const result={contract:CONTRACT,attempted:0,readback_proven:0,
    already_decided:0,failed:0,errors:[],consumer_ack_verified:0,
    implementation_verified:0,external_side_effects:0,source_only:true};
  for(const item of plan.work){
    result.attempted++;
    try{
      const response=await fetchImpl(config.origin+'/rest/v1/rpc/brain_transition_operation',{
        method:'POST',
        headers:{apikey:config.key,Authorization:'Bearer '+config.key,
          'content-type':'application/json',Accept:'application/json'},
        body:JSON.stringify({
          p_operation_id:item.operation_id,
          p_expected_version:item.expected_version,p_status:'PLANNED',
          p_dispatch_generation:null,p_remote_ref:null,
          p_evidence:{...item.prior_evidence,original_owner_decision:item.decision}
        })
      });
      if(!response?.ok){
        // The original writer may have already won the native CAS. Only exact
        // independent source proof can classify that as a safe duplicate.
        const now=await fetchOriginalOperation({config,fetchImpl,operationId:item.operation_id});
        if(matchesOriginalOperation(now,item)
          &&now.evidence?.original_owner_decision?.fingerprint===item.decision.fingerprint
          &&now.evidence?.original_owner_decision?.consumer_ack_verified===false){
          result.already_decided++;
          continue;
        }
        throw new Error('ORIGINAL_INNOVATION_OWNER_DECISION_CAS_CONFLICT');
      }
      const written=await response.json();
      assert(matchesOriginalOperation(written,item)
        &&Number(written.version)===item.expected_version+1
        &&written.evidence?.original_owner_decision?.fingerprint===item.decision.fingerprint
        &&written.evidence?.original_owner_decision?.consumer_ack_verified===false,
        'NATIVE_WRITE_RECEIPT_MISMATCH');
      const current=await fetchOriginalOperation({config,fetchImpl,operationId:item.operation_id});
      assert(matchesOriginalOperation(current,item)
        &&Number(current.version)>=Number(written.version)
        &&current.evidence?.original_owner_decision?.fingerprint===item.decision.fingerprint
        &&current.evidence?.original_owner_decision?.production_mutation_authorized===false
        &&current.evidence?.original_owner_decision?.external_side_effect===false
        &&current.evidence?.original_owner_decision?.consumer_ack_verified===false,
        'PROVIDER_READBACK_MISMATCH');
      result.readback_proven++;
    }catch(error){
      result.failed++;
      const message=String(error?.message??'UNKNOWN_ERROR');
      result.errors.push(message.startsWith('ORIGINAL_INNOVATION_OWNER_DECISION_')
        ? message.slice('ORIGINAL_INNOVATION_OWNER_DECISION_'.length).slice(0,120)
        : 'UNCLASSIFIED_SOURCE_DECISION_FAILURE');
    }
  }
  return Object.freeze(result);
}

// Original ONE BRAIN obligation is the receiver of the decision; a decision
// is NOT a provider-verified implementation or the original agent's final ACK.
export const OBLIGATION_HANDOFF_CONTRACT='ORIGINAL_INNOVATION_OWNER_DECISION_TO_ONE_BRAIN_OBLIGATION_V1';
const ALLOWED_DECISIONS=new Set([
  'BASELINE_AND_EVALUATION_DESIGN_REQUIRED',
  'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',
  'CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED',
  'INSUFFICIENT_ACTIONABLE_SOURCE_EVIDENCE'
]);

export function planOriginalDecisionObligationHandoffs({snapshot,report,observedAt=new Date().toISOString()}={}){
  assert(report?.contract==='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1'
    &&Number.isFinite(Date.parse(observedAt)),'INVALID_OBLIGATION_SOURCE_REPORT');
  const candidates=snapshot?.candidates,obligations=snapshot?.obligations,intakes=snapshot?.intakes;
  assert([candidates,obligations,intakes].every(Array.isArray)
    &&report.counts?.candidates===candidates.length
    &&report.counts?.obligations===obligations.length
    &&report.counts?.intakes===intakes.length,'OBLIGATION_SOURCE_COUNT_DRIFT');
  const byOb=new Map(obligations.map(o=>[String(o.business_entity),o]));
  const byOp=new Map(intakes.map(o=>[String(o.correlation_id),o]));
  assert(byOb.size===obligations.length&&byOp.size===intakes.length,'OBLIGATION_SOURCE_DUPLICATE');
  const work=[],held=[];
  for(const task of report.tasks){
    const ob=byOb.get(task.candidate_id);
    const op=byOp.get('innovation-delivery:'+task.candidate_id);
    assert(ob&&op,'ORIGINAL_OBLIGATION_OR_OPERATION_MISSING');
    if(task.consumer_ack_verified){
      held.push({reason:'ORIGINAL_CONSUMER_ACK_ALREADY_PROVEN'});
      continue;
    }
    const decision=op.evidence?.original_owner_decision;
    const review=op.evidence?.original_agent_pre_review;
    if(!decision){
      held.push({reason:'SOURCE_BOUND_ORIGINAL_DECISION_NOT_YET_RECORDED'});
      continue;
    }
    assert(op.status==='PLANNED'&&!text(op.remote_ref)
      &&ob.state==='OPEN'
      &&ob.owner==='original-agent:'+(task.original_owner==='agent:agent-growth-market'?'cro':'engineering')
      &&op.capability_id===task.original_owner
      &&op.id===task.original_operation_id
      &&op.payload_sha256===ob.payload_sha256
      &&op.change_id===ob.change_id
      &&decision.source_sha256===ob.payload_sha256
      &&decision.original_owner===task.original_owner
      &&decision.source_revision===ob.evidence?.source_revision
      &&decision.source_revision===task.source_revision
      &&decision.source_pre_review_fingerprint===review?.fingerprint
      &&decision.original_operation_id===op.id
      &&decision.original_correlation_id===op.correlation_id
      &&decision.original_idempotency_key===op.idempotency_key
      &&decision.contract===CONTRACT
      &&ALLOWED_DECISIONS.has(decision.decision)
      &&text(decision.fingerprint).length===64
      &&decision.consumer_ack_verified===false
      &&decision.production_mutation_authorized===false
      &&decision.external_side_effect===false
      &&decision.terminal_success===false,'OBLIGATION_DECISION_SOURCE_OWNER_OR_POLICY_DRIFT');
    const receipt=Object.freeze({
      contract:OBLIGATION_HANDOFF_CONTRACT,
      original_operation_id:op.id,
      original_owner:task.original_owner,
      original_decision_fingerprint:decision.fingerprint,
      original_pre_review_fingerprint:review.fingerprint,
      source_revision:task.source_revision,
      source_sha256:ob.payload_sha256,
      original_correlation_id:op.correlation_id,
      original_idempotency_key:op.idempotency_key,
      original_change_id:ob.change_id,
      decision:decision.decision,
      next_action:decision.next_action,
      handoff_state:'ORIGINAL_OWNER_DECISION_READBACK__PROTECTED_IMPLEMENTATION_DUE',
      independently_read_original_decision:true,
      original_operation_still_planned:true,
      original_obligation_still_open:true,
      protected_implementation_verified:false,
      independent_provider_effect_verified:false,
      consumer_ack_verified:false,
      external_side_effect:false,
      financial_benefit_claimed:false,
      terminal_success:false,
      observed_at:observedAt
    });
    const previous=ob.evidence?.original_owner_decision_handoff;
    if(previous){
      assert(previous.contract===OBLIGATION_HANDOFF_CONTRACT
        &&previous.original_decision_fingerprint===decision.fingerprint
        &&previous.original_operation_id===op.id
        &&previous.original_owner===task.original_owner
        &&previous.source_revision===task.source_revision
        &&previous.source_sha256===ob.payload_sha256
        &&previous.consumer_ack_verified===false
        &&previous.terminal_success===false,'OBLIGATION_PREVIOUS_HANDOFF_CONFLICT');
      held.push({reason:'IDENTICAL_ORIGINAL_OBLIGATION_RECEIPT_ALREADY_PERSISTED'});
      continue;
    }
    work.push(Object.freeze({
      business_entity:task.candidate_id,source_sha256:ob.payload_sha256,
      source_revision:task.source_revision,change_id:ob.change_id,
      original_owner:ob.owner,original_capability_id:task.original_owner,
      original_operation_id:op.id,receipt
    }));
  }
  assert(work.length+held.length===report.tasks.length,'OBLIGATION_HANDOFF_SOURCE_DROPPED');
  return Object.freeze({contract:OBLIGATION_HANDOFF_CONTRACT,work:Object.freeze(work.slice(0,MAX_WORK)),
    held:Object.freeze(held),candidate_count:report.tasks.length,
    deferred_by_budget:Math.max(0,work.length-MAX_WORK),
    external_dispatch:false,new_scheduler:false,new_queue:false,
    no_original_agent_ack_claimed:true});
}

async function readExactOriginalObligation({config,fetchImpl,businessEntity}){
  const params=new URLSearchParams({
    business_entity:'eq.'+businessEntity,
    obligation_type:'eq.INNOVATION_DELIVERY',
    capability_id:'eq.powerhouse-self-improvement-layer-v1',
    select:'id,version,obligation_type,capability_id,business_entity,change_id,owner,state,payload_sha256,evidence'
  });
  const response=await fetchImpl(config.origin+'/rest/v1/brain_obligations?'+params,{
    method:'GET',
    headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'}
  });
  assert(response?.ok,'OBLIGATION_READBACK_HTTP_ERROR');
  let data;try{data=await response.json();}catch{assert(false,'OBLIGATION_READBACK_INVALID_JSON');}
  assert(Array.isArray(data)&&data.length===1,'OBLIGATION_READBACK_CARDINALITY');
  return data[0];
}
function matchesOriginalObligation(row,item){
  return row?.obligation_type==='INNOVATION_DELIVERY'
    &&row?.capability_id==='powerhouse-self-improvement-layer-v1'
    &&row?.business_entity===item.business_entity
    &&row?.change_id===item.change_id
    &&row?.owner===item.original_owner
    &&row?.state==='OPEN'
    &&row?.payload_sha256===item.source_sha256
    &&row?.evidence?.source_revision===item.source_revision;
}
function exactDecisionReceipt(row,item){
  const receipt=row?.evidence?.original_owner_decision_handoff;
  return matchesOriginalObligation(row,item)
    &&receipt?.contract===OBLIGATION_HANDOFF_CONTRACT
    &&receipt?.original_operation_id===item.original_operation_id
    &&receipt?.original_owner===item.original_capability_id
    &&receipt?.original_decision_fingerprint===item.receipt.original_decision_fingerprint
    &&receipt?.source_revision===item.source_revision
    &&receipt?.source_sha256===item.source_sha256
    &&receipt?.consumer_ack_verified===false
    &&receipt?.protected_implementation_verified===false
    &&receipt?.external_side_effect===false
    &&receipt?.terminal_success===false;
}

export async function persistOriginalDecisionObligationHandoffs({plan,config,fetchImpl=globalThis.fetch}={}){
  assert(plan?.contract===OBLIGATION_HANDOFF_CONTRACT&&Array.isArray(plan.work),'INVALID_OBLIGATION_HANDOFF_PLAN');
  assert(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config?.origin??'')
    &&text(config?.key).length>=12&&typeof fetchImpl==='function','UNTRUSTED_OBLIGATION_PROVIDER');
  const result={contract:OBLIGATION_HANDOFF_CONTRACT,attempted:0,readback_proven:0,
    already_present:0,failed:0,errors:[],consumer_ack_claimed:0,
    implementations_verified:0,external_side_effects:0,original_obligations_open:true};
  for(const item of plan.work){
    result.attempted++;
    try{
      const current=await readExactOriginalObligation({config,fetchImpl,businessEntity:item.business_entity});
      assert(matchesOriginalObligation(current,item)
        &&Number.isSafeInteger(Number(current.version))
        &&Number(current.version)>0
        &&typeof current.id==='string','OBLIGATION_NATIVE_IDENTITY_INVALID');
      if(current.evidence?.original_owner_decision_handoff){
        assert(exactDecisionReceipt(current,item),'OBLIGATION_EXISTING_PROVIDER_CONFLICT');
        result.already_present++;continue;
      }
      const response=await fetchImpl(config.origin+'/rest/v1/rpc/brain_transition_obligation',{
        method:'POST',
        headers:{apikey:config.key,Authorization:'Bearer '+config.key,
          'content-type':'application/json',Accept:'application/json'},
        body:JSON.stringify({
          p_obligation_id:current.id,p_expected_version:Number(current.version),
          p_state:'OPEN',p_owner:item.original_owner,
          p_evidence:{...current.evidence,original_owner_decision_handoff:item.receipt}
        })
      });
      if(!response?.ok){
        const latest=await readExactOriginalObligation({config,fetchImpl,businessEntity:item.business_entity});
        if(exactDecisionReceipt(latest,item)){result.already_present++;continue;}
        throw new Error('ORIGINAL_INNOVATION_OWNER_DECISION_OBLIGATION_CAS_CONFLICT');
      }
      let written;try{written=await response.json();}catch{assert(false,'OBLIGATION_WRITE_JSON_INVALID');}
      assert(exactDecisionReceipt(written,item)
        &&Number(written.version)===Number(current.version)+1,
        'OBLIGATION_WRITE_RECEIPT_MISMATCH');
      const check=await readExactOriginalObligation({config,fetchImpl,businessEntity:item.business_entity});
      assert(exactDecisionReceipt(check,item)
        &&Number(check.version)>=Number(written.version),
        'OBLIGATION_INDEPENDENT_CONSUMER_READBACK_MISMATCH');
      result.readback_proven++;
    }catch(error){
      result.failed++;
      const message=String(error?.message??'UNKNOWN');
      result.errors.push(message.startsWith('ORIGINAL_INNOVATION_OWNER_DECISION_')
        ?message.slice('ORIGINAL_INNOVATION_OWNER_DECISION_'.length).slice(0,120)
        :'UNCLASSIFIED_ORIGINAL_OBLIGATION_HANDOFF_FAILURE');
    }
  }
  return Object.freeze(result);
}

export async function runOriginalOwnerDecision({env=process.env,fetchImpl=globalThis.fetch,
  observedAt=new Date().toISOString(),writeback=false}={}){
  const config=trustedBrainReadConfig(env);
  const snapshot=await readCanonicalRows({config,fetchImpl});
  const report=evaluateOriginalOwnerHandoff(snapshot,{now:observedAt});
  const plan=planOriginalOwnerDecisions({snapshot,report,observedAt});
  const execution=writeback?await persistOriginalOwnerDecisions({plan,config,fetchImpl}):null;
  let obligation_plan=null,obligation_execution=null;
  if(writeback&&execution.failed===0){
    // Re-read the SOURCE after actual original native decision CAS writes.
    // A pending predecessor cannot be treated as an acknowledged consumer.
    const fresh=await readCanonicalRows({config,fetchImpl});
    const freshReport=evaluateOriginalOwnerHandoff(fresh,{now:observedAt});
    obligation_plan=planOriginalDecisionObligationHandoffs({
      snapshot:fresh,report:freshReport,observedAt
    });
    obligation_execution=await persistOriginalDecisionObligationHandoffs({
      plan:obligation_plan,config,fetchImpl
    });
  }
  return Object.freeze({report,plan,execution,obligation_plan,obligation_execution,writeback});
}
export function publicSummary(result){
  const decisions=result.plan.work.reduce((a,x)=>{
    const key=x.decision.decision;
    a[key]=(a[key]??0)+1;
    return a;
  },{});
  return Object.freeze({
    contract:CONTRACT,observed_at:new Date().toISOString(),
    source_candidates:result.plan.candidate_count,
    decision_class_counts:decisions,
    already_registered_or_held:result.plan.held.length,
    newly_proven_source_decisions:result.execution?.readback_proven??0,
    native_errors:result.execution?.errors??[],
    native_failed:result.execution?.failed??0,
    original_obligation_handoffs_readback_proven:result.obligation_execution?.readback_proven??0,
    original_obligation_handoffs_already_present:result.obligation_execution?.already_present??0,
    original_obligation_handoffs_held:result.obligation_plan?.held.length??0,
    original_obligation_handoff_errors:result.obligation_execution?.errors??[],
    original_obligation_handoff_failed:result.obligation_execution?.failed??0,
    original_obligations_remain_open:true,
    deferred_by_budget:result.plan.deferred_by_budget,
    original_agent_consumer_ack_verified:result.report.counts.owner_ack_verified,
    protected_implementations_verified:0,
    customer_financial_effect_verified:0,
    all_operations_remain_planned:true,
    work_details_redacted:true,
    original_executors_unchanged:true,no_new_scheduler:true,
    next_stage:'ORIGINAL_OWNER_PROTECTED_IMPLEMENTATION_AND_INDEPENDENT_EFFECT_REQUIRED'
  });
}
async function main(){
  const writeback=process.argv.includes('--writeback');
  if(process.argv.slice(2).some(arg=>arg!=='--writeback'&&arg!=='--check'))
    throw new TypeError('UNKNOWN_CLI_ARGUMENT');
  const result=await runOriginalOwnerDecision({writeback});
  await mkdir('artifacts/quality',{recursive:true});
  await writeFile(ARTIFACT,JSON.stringify(publicSummary(result),null,2)+'\n');
  process.stdout.write(JSON.stringify(publicSummary(result))+'\n');
  if(result.execution?.failed||result.obligation_execution?.failed)process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  main().catch(err=>{console.error(String(err?.message??'ORIGINAL_OWNER_DECISION_FAILED').slice(0,180));process.exitCode=1;});
}
