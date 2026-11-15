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
export async function runOriginalOwnerDecision({env=process.env,fetchImpl=globalThis.fetch,
  observedAt=new Date().toISOString(),writeback=false}={}){
  const config=trustedBrainReadConfig(env);
  const snapshot=await readCanonicalRows({config,fetchImpl});
  const report=evaluateOriginalOwnerHandoff(snapshot,{now:observedAt});
  const plan=planOriginalOwnerDecisions({snapshot,report,observedAt});
  const execution=writeback?await persistOriginalOwnerDecisions({plan,config,fetchImpl}):null;
  return Object.freeze({report,plan,execution,writeback});
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
  if(result.execution?.failed)process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  main().catch(err=>{console.error(String(err?.message??'ORIGINAL_OWNER_DECISION_FAILED').slice(0,180));process.exitCode=1;});
}
