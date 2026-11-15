import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {WORK_ORDER,CONTRACT} from './innovation-original-code-delivery.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

const fail=code=>{throw new Error('ORIGINAL_INNOVATION_NOCHANGE_'+code);};
const validSha=x=>typeof x==='string'&&/^[0-9a-f]{40}$/i.test(x);
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const requireProof=(ok,code)=>{if(!ok)fail(code);};

export function evaluateOriginalNochangeReview({workorder,operation,headSha,observedAt=new Date().toISOString()}={}){
  requireProof(workorder?.contract===CONTRACT&&workorder.selected===true&&
    uuid(workorder.candidate_id)&&uuid(workorder.operation_id)&&
    validSha(headSha)&&Number.isFinite(Date.parse(observedAt)),
    'INVALID_ORIGINAL_IDENTITY');
  requireProof(operation?.id===workorder.operation_id&&
    operation?.operation_type==='INNOVATION_INTAKE'&&
    operation.capability_id===workorder.owner&&
    operation.status==='PLANNED'&&!operation.remote_ref&&
    operation.change_id===workorder.source_key&&
    operation.correlation_id===workorder.correlation_id&&
    operation.idempotency_key===workorder.idempotency_key&&
    operation.payload_sha256===workorder.source_sha256&&
    operation.evidence?.original_agent_pre_review?.source_revision===workorder.source_revision&&
    operation.evidence?.original_owner_decision?.fingerprint===workorder.decision_fingerprint&&
    operation.evidence?.original_owner_decision?.consumer_ack_verified===false,
    'SOURCE_VERSION_OWNER_OR_DECISION_DRIFT');
  const receipt=Object.freeze({
    contract:'ORIGINAL_INNOVATION_NO_CODE_CHANGE_REVIEW_V1',
    candidate_id:workorder.candidate_id,
    source_revision:workorder.source_revision,
    source_sha256:workorder.source_sha256,
    original_owner:workorder.owner,
    original_operation_id:workorder.operation_id,
    decision_fingerprint:workorder.decision_fingerprint,
    observed_repository_sha:headSha,
    result:'NO_SOURCE_CHANGE_REQUIRES_INDEPENDENT_REVIEW',
    no_op_reason:'WORKSPACE_CODE_AUTHOR_PRODUCED_ZERO_SOURCE_OR_TEST_DIFF',
    next_safe_action:'Original owner must independently reconcile existing source, real production parity and regression evidence, or revise the original source-bound work order',
    implementation_verified:false,provider_receipt_verified:false,
    consumer_ack_verified:false,independent_effect_verified:false,
    terminal_success:false,original_operation_stays:'PLANNED',
    observed_at:observedAt
  });
  const prior=operation.evidence?.original_code_nochange_review;
  if(prior){
    requireProof(plain(prior)&&prior.contract===receipt.contract&&
      prior.candidate_id===receipt.candidate_id&&
      prior.source_revision===receipt.source_revision&&
      prior.source_sha256===receipt.source_sha256&&
      prior.decision_fingerprint===receipt.decision_fingerprint&&
      prior.implementation_verified===false&&
      prior.consumer_ack_verified===false,'CONFLICTING_ORIGINAL_NOCHANGE_REVIEW');
    return Object.freeze({already_recorded:true,receipt:prior});
  }
  return Object.freeze({already_recorded:false,receipt});
}

async function originalGet(config,id,fetchImpl){
  const params=new URLSearchParams({id:'eq.'+id,
    select:'id,operation_type,capability_id,change_id,correlation_id,idempotency_key,status,version,remote_ref,payload_sha256,evidence'});
  const response=await fetchImpl(config.origin+'/rest/v1/brain_operations?'+params,{
    headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'}
  });
  requireProof(response?.ok,'ORIGINAL_GET_UNAVAILABLE');
  const rows=await response.json();
  requireProof(Array.isArray(rows)&&rows.length===1,'ORIGINAL_GET_CARDINALITY');
  return rows[0];
}

export async function recordOriginalNochange({workorder,headSha,config,fetchImpl=globalThis.fetch}={}){
  requireProof(typeof fetchImpl==='function'&&
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config?.origin??'')&&
    typeof config?.key==='string'&&config.key.length>=12,'TRUSTED_ORIGINAL_CONFIG_REQUIRED');
  const current=await originalGet(config,workorder?.operation_id,fetchImpl);
  const plan=evaluateOriginalNochangeReview({workorder,operation:current,headSha});
  if(!plan.already_recorded){
    const res=await fetchImpl(config.origin+'/rest/v1/rpc/brain_transition_operation',{
      method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+config.key,
        'content-type':'application/json',Accept:'application/json'},
      body:JSON.stringify({p_operation_id:current.id,
        p_expected_version:current.version,p_status:'PLANNED',
        p_dispatch_generation:null,p_remote_ref:null,
        p_evidence:{...current.evidence,original_code_nochange_review:plan.receipt}})
    });
    if(!res?.ok){
      const latest=await originalGet(config,current.id,fetchImpl);
      const replay=evaluateOriginalNochangeReview({workorder,operation:latest,headSha});
      requireProof(replay.already_recorded,'ORIGINAL_CAS_CONFLICT');
    }else{
      const receipt=await res.json();
      requireProof(receipt?.id===current.id&&receipt.status==='PLANNED'&&
        Number(receipt.version)===Number(current.version)+1&&
        receipt.evidence?.original_code_nochange_review?.candidate_id===workorder.candidate_id,
        'ORIGINAL_WRITE_RECEIPT_MISMATCH');
    }
  }
  const verified=await originalGet(config,current.id,fetchImpl);
  const final=evaluateOriginalNochangeReview({workorder,operation:verified,headSha});
  requireProof(final.already_recorded&&verified.status==='PLANNED'&&
    !verified.remote_ref&&final.receipt.terminal_success===false,
    'INDEPENDENT_ORIGINAL_GET_FAILED');
  return Object.freeze({candidate_id:workorder.candidate_id,
    source_revision:workorder.source_revision,
    original_operation_id:current.id,
    exact_repository_sha:headSha,
    no_source_change_review_recorded:true,
    original_still_planned:true,
    consumer_ack_verified:false,production_change_claimed:false,
    source_only:true});
}
async function main(){
  requireProof(process.argv[2]==='--record','USAGE');
  const workorder=JSON.parse(readFileSync(WORK_ORDER,'utf8'));
  const result=await recordOriginalNochange({workorder,headSha:process.env.GITHUB_SHA,
    config:trustedBrainReadConfig(process.env)});
  process.stdout.write(JSON.stringify(result)+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])
  main().catch(e=>{process.stderr.write(String(e.message).slice(0,220)+'\n');process.exitCode=1;});
