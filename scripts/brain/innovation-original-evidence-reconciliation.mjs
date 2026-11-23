import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows,evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

export const CONTRACT='ORIGINAL_INNOVATION_ALL_FOURTEEN_EVIDENCE_RECONCILIATION_V1';
const SOURCE_CONTRACT='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1';
const SHA=/^[a-f0-9]{64}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FINGERPRINT=/^[a-zA-Z0-9_|-]{8,200}$/;
const positiveString=value=>typeof value==='string'&&value.trim().length>0;
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const requireTrue=(ok,code)=>{if(!ok)throw new Error('ORIGINAL_INNOVATION_EVIDENCE_'+code);};

export const QUALITY_NEXT=Object.freeze({
  instagram_media_production:'ORIGINAL_MEDIA_ROUTER_PROVIDER_PROOF_AND_FACE_QA',
  'powerhouse-delivery-control-loop':'ORIGINAL_RECOVERABLE_EXECUTION_FAULT_REPLAY',
  'portal-v2':'ORIGINAL_MOBILE_VISUAL_DENSITY_EXACT_PRODUCTION_RECHECK',
  'release-promotion-observability':'ORIGINAL_PROTECTED_MERGE_AND_EXACT_PRODUCTION_CHECK',
  'approved-blog-publisher':'ORIGINAL_BLOG_CANDIDATE_TO_PROVIDER_READBACK',
  'brain-content-closed-loop':'ORIGINAL_PUBLIC_API_DIAGNOSTICS_PRIVACY_REPLAY',
  'supabase-schema-replay-parity':'ORIGINAL_SUPABASE_PRODUCTION_SCHEMA_PARITY_READBACK'
});
const METRIC_TYPES=new Set(['number','boolean']);
export function planOriginalInnovationEvidence({snapshot,report,qualityRows,observedAt=new Date().toISOString()}={}){
  requireTrue(report?.contract===SOURCE_CONTRACT&&Number.isFinite(Date.parse(observedAt)),'SOURCE_REPORT_INVALID');
  const candidates=snapshot?.candidates,obligations=snapshot?.obligations,intakes=snapshot?.intakes;
  requireTrue([candidates,obligations,intakes,qualityRows].every(Array.isArray),'SOURCE_ARRAYS_INVALID');
  requireTrue(candidates.length===report.counts?.candidates&&
    obligations.length===report.counts?.obligations&&intakes.length===report.counts?.intakes,
    'SOURCE_CARDINALITY_DRIFT');
  const byOb=new Map(obligations.map(x=>[String(x.business_entity),x]));
  const byOp=new Map(intakes.map(x=>[String(x.correlation_id),x]));
  const byQuality=new Map(qualityRows.map(x=>[String(x.fingerprint),x]));
  requireTrue(byOb.size===obligations.length&&byOp.size===intakes.length&&
    byQuality.size===qualityRows.length,'DUPLICATE_SOURCE');
  const work=[],held=[],summary={quality:0,cro:0,concrete:0,pr_reconcile:0,nochange:0,release:0};
  for(const c of candidates){
    const id=String(c.candidate_id);
    const b=byOb.get(id),op=byOp.get('innovation-delivery:'+id);
    requireTrue(UUID.test(id)&&b&&op,'ORIGINAL_IDENTITY_MISSING');
    const owner=c.owner_agent==='cro'?'agent:agent-growth-market':'agent:agent-integration-engineer';
    const decision=op.evidence?.original_owner_decision;
    const pre=op.evidence?.original_agent_pre_review;
    requireTrue(c.status==='candidate'&&c.safety_class==='review_required'&&
      op.operation_type==='INNOVATION_INTAKE'&&op.status==='PLANNED'&&!op.remote_ref&&
      b.state==='OPEN'&&b.owner==='original-agent:'+c.owner_agent&&
      op.capability_id===owner&&b.change_id===c.source_key&&op.change_id===c.source_key&&
      op.payload_sha256===b.payload_sha256&&SHA.test(op.payload_sha256)&&
      op.correlation_id==='innovation-delivery:'+id&&
      op.idempotency_key==='innovation-delivery:'+id+':'+b.payload_sha256.slice(0,16)&&
      positiveString(b.evidence?.source_revision)&&
      isObject(c.baseline)&&isObject(c.expected_impact)&&isObject(c.proposed_action)&&
      isObject(c.rollback_plan)&&
      pre?.source_revision===b.evidence.source_revision&&
      pre?.source_sha256===b.payload_sha256&&pre?.original_owner===owner&&
      pre?.consumer_ack_verified===false&&pre?.external_side_effect===false&&
      decision?.source_revision===b.evidence.source_revision&&
      decision?.source_sha256===b.payload_sha256&&decision?.original_owner===owner&&
      decision?.consumer_ack_verified===false&&decision?.production_mutation_authorized===false,
      'SOURCE_OWNER_POLICY_OR_REVISION_DRIFT');
    const kind=c.proposed_action.kind;
    let sourceQuality=null;
    let disposition='CONCRETE_CODE_CANDIDATE_SOURCE_REVIEW_DUE';
    let nextAction='ORIGINAL_EXACT_SOURCE_PRODUCTION_AND_EFFECT_RECONCILIATION';
    let evidenceType='ORIGINAL_SOURCE_ONLY';
    let sourceFingerprint=null;
    if(kind==='bounded_learning_followup'){
      summary.quality++;
      requireTrue(decision.decision==='BASELINE_AND_EVALUATION_DESIGN_REQUIRED','GENERIC_DECISION_DRIFT');
      sourceFingerprint=c.baseline.quality_fingerprint;
      requireTrue(FINGERPRINT.test(sourceFingerprint),'QUALITY_FINGERPRINT_MISSING');
      const q=byQuality.get(sourceFingerprint);
      requireTrue(q&&q.fingerprint===sourceFingerprint&&
        q.capability_id===c.component_id&&
        ['verified','guarded'].includes(q.status)&&
        typeof q.escaped_to_production==='boolean'&&
        Number.isFinite(Date.parse(q.updated_at))&&
        isObject(q.performance_evidence),'QUALITY_SOURCE_NOT_VERIFIABLE');
      sourceQuality={
        status:q.status,escaped_to_production:q.escaped_to_production,
        updated_at:q.updated_at,original_fingerprint:q.fingerprint,
        source_evidence_sha256:hash({
          fingerprint:q.fingerprint,capability_id:q.capability_id,status:q.status,
          escaped_to_production:q.escaped_to_production,
          performance_evidence:q.performance_evidence,
          regression_guard_ref:q.regression_guard_ref,
          root_cause:q.root_cause,updated_at:q.updated_at
        }),
        historical_claim_not_current_production_proof:true,
        regression_ref_present:positiveString(q.regression_guard_ref)
      };
      disposition=q.status==='verified'
        ?'HISTORICAL_VERIFIED_QUALITY_SOURCE_CURRENT_EFFECT_DUE'
        :'HISTORICAL_GUARDED_QUALITY_SOURCE_CURRENT_PROOF_DUE';
      nextAction=QUALITY_NEXT[c.component_id];
      requireTrue(positiveString(nextAction),'QUALITY_COMPONENT_UNMAPPED');
      evidenceType='HISTORICAL_FIRST_PARTY_QUALITY_EVENT_UNCONFIRMED_AS_CURRENT_PRODUCTION';
    }else if(kind==='reconcile_experiment_instrumentation'){
      summary.cro++;
      requireTrue(c.owner_agent==='cro'&&decision.decision==='CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED','CRO_DECISION_DRIFT');
      disposition='CRO_EVENT_DEFINITION_CONSENT_HOLDOUT_AND_FUNNEL_BASELINE_DUE';
      nextAction='ORIGINAL_CRO_AGENT_RECONCILE_FIRST_PARTY_EVENT_DEFINITIONS_AND_HOLDOUT';
    }else{
      summary.concrete++;
      requireTrue(c.owner_agent==='engineering'&&
        decision.decision==='CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE','CONCRETE_DECISION_DRIFT');
      if(op.evidence?.original_code_candidate_pr){summary.pr_reconcile++;disposition='ORIGINAL_CODE_PR_RECENT_PRODUCTION_EFFECT_DUE';}
      else if(op.evidence?.original_code_nochange_review){summary.nochange++;disposition='ORIGINAL_SOURCE_NOCHANGE_REVIEW_CURRENT_EFFECT_DUE';}
      else disposition='PREEXISTING_ORIGINAL_SOURCE_RELEASE_RECONCILIATION_DUE';
      if(op.evidence?.original_code_production_readback){
        summary.release++;
        disposition='PRODUCTION_CODE_PUBLISHED_CONSUMER_AND_EFFECT_DUE';
      }
    }
    requireTrue(Number.isSafeInteger(Number(op.version))&&Number(op.version)>0,'ORIGINAL_VERSION_INVALID');
    const readiness={
      contract:CONTRACT,
      candidate_id:id,original_operation_id:op.id,original_owner:owner,
      source_revision:b.evidence.source_revision,source_sha256:b.payload_sha256,
      original_change_id:c.source_key,
      source_decision_fingerprint:decision.fingerprint,
      source_pre_review_fingerprint:pre.fingerprint,
      evidence_type:evidenceType,source_quality:sourceQuality,
      historical_baseline_digest:hash(c.baseline),
      historical_expected_impact_digest:hash(c.expected_impact),
      historical_baseline_not_current_effect:true,
      disposition,next_action:nextAction,
      rollout_authority:'EXISTING_PROTECTED_GITHUB_AND_ORIGINAL_OWNER_ONLY',
      automated_external_provider_dispatch:false,
      protected_review_required:true,
      independently_verified_current_effect:false,
      consumer_ack_verified:false,terminal_success:false
    };
    readiness.fingerprint=hash(readiness);
    const prior=op.evidence?.original_evidence_reconciliation;
    if(prior){
      requireTrue(prior.contract===CONTRACT&&prior.candidate_id===id&&
        prior.source_revision===b.evidence.source_revision&&
        prior.source_sha256===b.payload_sha256&&prior.original_owner===owner&&
        prior.consumer_ack_verified===false&&prior.terminal_success===false,
        'CONFLICTING_PREVIOUS_EVIDENCE');
      if(prior.fingerprint===readiness.fingerprint){held.push({reason:'IDENTICAL_SOURCE_RECONCILIATION_ALREADY_IN_ORIGINAL_BRAIN'});continue;}
    }
    work.push({operation_id:op.id,expected_version:Number(op.version),
      source_sha256:b.payload_sha256,source_revision:b.evidence.source_revision,
      source_change_id:c.source_key,source_owner:owner,
      evidence:op.evidence,receipt:readiness});
  }
  return Object.freeze({contract:CONTRACT,count:candidates.length,
    work,held,summary,consumer_ack_verified:0,terminal_success:0,
    new_queue:false,new_scheduler:false,original_operation_status:'PLANNED'});
}

export async function readOriginalQualityRows({snapshot,config,fetchImpl=globalThis.fetch}={}){
  requireTrue(config?.origin&&config?.key&&typeof fetchImpl==='function','UNTRUSTED_QUALITY_PROVIDER');
  const keys=[...new Set((snapshot?.candidates??[])
    .filter(x=>x.proposed_action?.kind==='bounded_learning_followup')
    .map(x=>x.baseline?.quality_fingerprint))];
  requireTrue(keys.length<=100&&keys.every(x=>FINGERPRINT.test(x)),'QUALITY_QUERY_SCOPE_INVALID');
  if(keys.length===0)return [];
  const filter='in.('+keys.map(x=>'"'+x+'"').join(',')+')';
  const query=new URLSearchParams({
    select:'fingerprint,capability_id,status,escaped_to_production,regression_guard_ref,root_cause,performance_evidence,updated_at',
    fingerprint:filter,limit:'100'
  });
  let response;
  try{response=await fetchImpl(config.origin+'/rest/v1/powerhouse_quality_events?'+query,{
    method:'GET',headers:{apikey:config.key,Authorization:'Bearer '+config.key,
      Accept:'application/json',Prefer:'count=exact'}
  });}catch{requireTrue(false,'QUALITY_PROVIDER_UNAVAILABLE');}
  requireTrue(response.ok,'QUALITY_PROVIDER_HTTP_'+response.status);
  const rows=await response.json();
  const total=response.headers?.get?.('content-range')?.split('/').at(-1);
  requireTrue(Array.isArray(rows)&&rows.length===keys.length&&
    Number(total)===rows.length&&new Set(rows.map(x=>x.fingerprint)).size===rows.length&&
    rows.every(x=>keys.includes(x.fingerprint)),'QUALITY_EXACT_SOURCE_CARDINALITY_DRIFT');
  return rows;
}

async function originalGet({config,id,fetchImpl}){
  const params=new URLSearchParams({
    select:'id,operation_type,capability_id,status,remote_ref,version,payload_sha256,change_id,correlation_id,evidence',
    id:'eq.'+id
  });
  const response=await fetchImpl(config.origin+'/rest/v1/brain_operations?'+params,{
    headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'}});
  requireTrue(response?.ok,'INDEPENDENT_ORIGINAL_GET_FAILED');
  const rows=await response.json();
  requireTrue(Array.isArray(rows)&&rows.length===1,'INDEPENDENT_ORIGINAL_GET_CARDINALITY');
  return rows[0];
}
function originalMatches(row,item){
  return row?.id===item.operation_id&&row.operation_type==='INNOVATION_INTAKE'&&
    row.capability_id===item.source_owner&&row.status==='PLANNED'&&!row.remote_ref&&
    row.payload_sha256===item.source_sha256&&row.change_id===item.source_change_id&&
    row.evidence?.original_owner_decision?.fingerprint===item.receipt.source_decision_fingerprint;
}
export async function persistOriginalInnovationEvidence({plan,config,fetchImpl=globalThis.fetch}={}){
  requireTrue(plan?.contract===CONTRACT&&Array.isArray(plan.work),'INVALID_PERSIST_PLAN');
  requireTrue(/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config?.origin??'')&&
    positiveString(config?.key)&&typeof fetchImpl==='function','UNTRUSTED_PERSIST_PROVIDER');
  const result={contract:CONTRACT,attempted:0,updated:0,already:0,failed:0,errors:[],
    source_only:true,consumer_ack_verified:false,terminal_success:false};
  for(const item of plan.work){
    result.attempted++;
    try{
      // Re-read original before CAS; never overwrite a newer version or other agent's evidence.
      const before=await originalGet({config,id:item.operation_id,fetchImpl});
      requireTrue(originalMatches(before,item)&&Number(before.version)===item.expected_version,
        'ORIGINAL_VERSION_OR_SOURCE_CHANGED');
      const body={p_operation_id:item.operation_id,p_expected_version:item.expected_version,
        p_status:'PLANNED',p_dispatch_generation:null,p_remote_ref:null,
        p_evidence:{...before.evidence,original_evidence_reconciliation:item.receipt}};
      const write=await fetchImpl(config.origin+'/rest/v1/rpc/brain_transition_operation',{
        method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+config.key,
          Accept:'application/json','content-type':'application/json'},
        body:JSON.stringify(body)
      });
      if(!write?.ok){
        const now=await originalGet({config,id:item.operation_id,fetchImpl});
        if(originalMatches(now,item)&&
          now.evidence?.original_evidence_reconciliation?.fingerprint===item.receipt.fingerprint){
          result.already++;continue;
        }
        requireTrue(false,'ORIGINAL_CAS_CONFLICT');
      }
      const written=await write.json();
      requireTrue(originalMatches(written,item)&&
        Number(written.version)===item.expected_version+1&&
        written.evidence?.original_evidence_reconciliation?.fingerprint===item.receipt.fingerprint,
        'ORIGINAL_CAS_WRITE_RECEIPT_INVALID');
      const independentlyRead=await originalGet({config,id:item.operation_id,fetchImpl});
      requireTrue(originalMatches(independentlyRead,item)&&
        independentlyRead.evidence?.original_evidence_reconciliation?.fingerprint===item.receipt.fingerprint&&
        independentlyRead.evidence?.original_evidence_reconciliation?.terminal_success===false&&
        independentlyRead.evidence?.original_evidence_reconciliation?.consumer_ack_verified===false,
        'INDEPENDENT_PRODUCTION_SOURCE_READBACK_MISMATCH');
      result.updated++;
    }catch(error){
      result.failed++;
      result.errors.push(String(error?.message??'UNKNOWN').replace(/^ORIGINAL_INNOVATION_EVIDENCE_/,'').slice(0,100));
    }
  }
  return Object.freeze(result);
}

async function main(){
  requireTrue(process.argv[2]==='--writeback'||process.argv[2]==='--audit','USAGE');
  const config=trustedBrainReadConfig(process.env);
  const snapshot=await readCanonicalRows({config});
  const report=evaluateOriginalOwnerHandoff(snapshot);
  const qualityRows=await readOriginalQualityRows({snapshot,config});
  const plan=planOriginalInnovationEvidence({snapshot,report,qualityRows});
  const publicReport={contract:CONTRACT,original_candidates:plan.count,
    stage_distribution:plan.summary,due_for_reconciliation:plan.work.length,
    already_identical:plan.held.length,all_original_operations_open:true,
    no_terminal_business_success_claimed:true};
  if(process.argv[2]==='--audit'){
    process.stdout.write(JSON.stringify({...publicReport,mode:'read_only'})+'\n');return;
  }
  const outcome=await persistOriginalInnovationEvidence({plan,config});
  process.stdout.write(JSON.stringify({...publicReport,mode:'native_CAS_and_independent_GET',
    updated:outcome.updated,already:outcome.already,failed:outcome.failed,
    errors:outcome.errors})+'\n');
  if(outcome.failed)process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])
  main().catch(err=>{
    process.stderr.write(String(err.message).slice(0,170)+'\n');
    process.exitCode=1;
  });
