import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows,evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

export const CONTRACT='ORIGINAL_INNOVATION_SOURCE_BOUND_AGENT_REVIEW_V1';
const OUT='artifacts/quality/original-innovation-owner-pre-review.json';
const MAX_PER_RUN=25;
const text=value=>typeof value==='string'?value.trim():'';
const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function assert(condition,code){if(!condition)throw new Error('ORIGINAL_INNOVATION_REVIEW_'+code);}

export function planOriginalAgentPreReviews({snapshot,report,observedAt=new Date().toISOString(),limit=MAX_PER_RUN}={}){
 assert(snapshot&&report?.contract==='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1','UNTRUSTED_SNAPSHOT');
 assert(Number.isFinite(Date.parse(observedAt)),'INVALID_CLOCK');
 assert(Number.isInteger(limit)&&limit>0&&limit<=MAX_PER_RUN,'LIMIT_INVALID');
 assert(report.counts?.candidates===snapshot.candidates?.length
   &&report.counts?.obligations===snapshot.obligations?.length
   &&report.counts?.intakes===snapshot.intakes?.length,'SOURCE_CARDINALITY_DRIFT');
 const candidates=new Map(snapshot.candidates.map(x=>[String(x.candidate_id),x]));
 const obligations=new Map(snapshot.obligations.map(x=>[String(x.business_entity),x]));
 const operations=new Map(snapshot.intakes.map(x=>[String(x.correlation_id),x]));
 const work=[],held=[];
 for(const task of report.tasks){
   const candidate=candidates.get(task.candidate_id);
   const obligation=obligations.get(task.candidate_id);
   const op=operations.get('innovation-delivery:'+task.candidate_id);
   assert(candidate&&obligation&&op,'SOURCE_IDENTITY_MISSING');
   assert(uuid(task.candidate_id)&&uuid(op.id)&&Number.isSafeInteger(Number(op.version))&&Number(op.version)>=1,
     'OPERATION_IDENTITY_INVALID');
   assert(op.operation_type==='INNOVATION_INTAKE'
     &&op.capability_id===task.original_owner
     &&op.payload_sha256===obligation.payload_sha256
     &&op.change_id===candidate.source_key
     &&op.correlation_id==='innovation-delivery:'+task.candidate_id
     &&op.idempotency_key==='innovation-delivery:'+task.candidate_id+':'+obligation.payload_sha256.slice(0,16)
     &&String(obligation.evidence?.source_revision)===task.source_revision,
     'ORIGINAL_AGENT_OR_SOURCE_REVISION_CONFLICT');
   if(task.consumer_ack_verified){held.push({reason:'CONSUMER_ALREADY_VERIFIED'});continue;}
   if(op.status!=='PLANNED'){held.push({reason:'OPERATION_NOT_PLANNED'});continue;}
   if(op.remote_ref!==null&&text(op.remote_ref)){held.push({reason:'POSSIBLE_REMOTE_SIDE_EFFECT'});continue;}
   if(candidate.safety_class!=='review_required'
     ||!isObject(candidate.proposed_action)||!Object.keys(candidate.proposed_action).length
     ||!isObject(candidate.rollback_plan)||!Object.keys(candidate.rollback_plan).length){
     held.push({reason:'REVIEW_SAFETY_EVIDENCE_REQUIRED'});continue;
   }
   const fingerprint=digest({
     candidate_id:task.candidate_id,source_key:task.source_key,
     source_revision:task.source_revision,source_sha256:obligation.payload_sha256,
     agent:task.original_owner,review_safety:task.safety_class,
     action_digest:digest(candidate.proposed_action),
     rollback_digest:digest(candidate.rollback_plan)
   });
   const prior=op.evidence?.original_agent_pre_review;
   if(prior){
     assert(prior.fingerprint===fingerprint
       &&prior.original_owner===task.original_owner
       &&prior.source_revision===task.source_revision
       &&prior.consumer_ack_verified===false
       &&prior.external_side_effect===false,'PRIOR_REVIEW_CONFLICT');
     held.push({reason:'REVIEW_ALREADY_REGISTERED'});
     continue;
   }
   work.push(Object.freeze({
     operationId:op.id,operationVersion:Number(op.version),
     obligationId:task.candidate_id,agent:task.original_owner,
     sourceRevision:task.source_revision,sourceSha256:obligation.payload_sha256,
     capabilityId:op.capability_id,idempotencyKey:op.idempotency_key,
     changeId:op.change_id,correlationId:op.correlation_id,
     previousEvidence:op.evidence||{},
     review:Object.freeze({
       contract:CONTRACT,fingerprint,original_owner:task.original_owner,
       source_revision:task.source_revision,source_sha256:obligation.payload_sha256,
       review_policy:'REVIEW_REQUIRED_EXISTING_PROTECTED_DELIVERY',
       source_and_rollback_examined:true,
       next_action:'ORIGINAL_AGENT_PREPARE_SAFE_REVERSIBLE_CANDIDATE',
       exact_source_action_digest:digest(candidate.proposed_action),
       exact_source_rollback_digest:digest(candidate.rollback_plan),
       mandatory_stages:['SOURCE_REGISTERED','ORIGINAL_AGENT_PRE_REVIEW',
         'PROTECTED_IMPLEMENTATION','INDEPENDENT_PROVIDER_OUTCOME','ONE_BRAIN_CONSUMED_AND_LEARNING'],
       review_required:true,production_mutation_authorized:false,
       external_side_effect:false,consumer_ack_verified:false,
       independent_effect_verified:false,terminal_success:false,
       observed_at:observedAt
     })
   }));
 }
 return Object.freeze({contract:CONTRACT,read_only:true,
   total:report.counts.candidates,
   work:Object.freeze(work.slice(0,limit)),
   held:Object.freeze(held),
   deferred_by_budget:Math.max(0,work.length-limit),
   no_new_queue:true,no_new_scheduler:true,no_parallel_agent:true
 });
}

async function getExactOperation({config,fetchImpl,operationId}){
 const params=new URLSearchParams({id:'eq.'+operationId,select:'id,capability_id,operation_type,idempotency_key,payload_sha256,change_id,correlation_id,status,version,remote_ref,evidence'});
 const response=await fetchImpl(config.origin+'/rest/v1/brain_operations?'+params,{
   method:'GET',headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'}
 });
 assert(response?.ok,'OPERATION_READBACK_HTTP_'+(response?.status??'UNKNOWN'));
 let rows;try{rows=await response.json();}catch{assert(false,'OPERATION_READBACK_INVALID_JSON');}
 assert(Array.isArray(rows)&&rows.length===1,'OPERATION_READBACK_CARDINALITY');
 return rows[0];
}
function matchesExactSource(row,item){
 return row?.id===item.operationId&&row?.capability_id===item.capabilityId
   &&row?.operation_type==='INNOVATION_INTAKE'
   &&row?.idempotency_key===item.idempotencyKey
   &&row?.payload_sha256===item.sourceSha256
   &&row?.change_id===item.changeId
   &&row?.correlation_id===item.correlationId
   &&row?.status==='PLANNED'
   &&!text(row?.remote_ref);
}
export async function persistOriginalAgentPreReviews({plan,config,fetchImpl=globalThis.fetch}={}){
 assert(plan?.contract===CONTRACT&&Array.isArray(plan.work),'PLAN_INVALID');
 assert(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config?.origin||'')
   &&typeof config?.key==='string'&&config.key.length>=12,'SOURCE_AUTH_INVALID');
 const result={contract:CONTRACT,readback_proven:0,already_registered:0,
   accepted_consumer_acks:0,implementations_verified:0,external_side_effects:0,
   fail_closed:true,attempted:0,failed:0,error_codes:[],original_work_kept_open:true};
 for(const item of plan.work){
   result.attempted++;
   // One faulty source or CAS conflict must not strand unrelated existing agents.
   try {
   const evidence={...item.previousEvidence,original_agent_pre_review:item.review};
   const response=await fetchImpl(config.origin+'/rest/v1/rpc/brain_transition_operation',{
     method:'POST',
     headers:{apikey:config.key,Authorization:'Bearer '+config.key,
       'content-type':'application/json',Accept:'application/json'},
     body:JSON.stringify({
       p_operation_id:item.operationId,p_expected_version:item.operationVersion,
       p_status:'PLANNED',p_dispatch_generation:null,p_remote_ref:null,p_evidence:evidence
     })
   });
   if(!response?.ok){
     // Concurrent idempotent reviewer may have won the native CAS; read the
     // original provider state rather than re-dispatching or overwriting.
     const current=await getExactOperation({config,fetchImpl,operationId:item.operationId});
     if(matchesExactSource(current,item)
       &&current.evidence?.original_agent_pre_review?.fingerprint===item.review.fingerprint
       &&current.evidence?.original_agent_pre_review?.consumer_ack_verified===false
       &&current.evidence?.original_agent_pre_review?.external_side_effect===false){
       result.already_registered++;
       continue;
     }
     throw new Error('ORIGINAL_INNOVATION_REVIEW_VERSION_OR_PROVIDER_CONFLICT');
   }
   let write;try{write=await response.json();}catch{throw new Error('ORIGINAL_INNOVATION_REVIEW_WRITEBACK_JSON_INVALID');}
   assert(matchesExactSource(write,item)
     &&Number(write.version)===item.operationVersion+1
     &&write.evidence?.original_agent_pre_review?.fingerprint===item.review.fingerprint
     &&write.evidence?.original_agent_pre_review?.consumer_ack_verified===false,
     'WRITEBACK_IDENTITY_MISMATCH');
   const current=await getExactOperation({config,fetchImpl,operationId:item.operationId});
   assert(matchesExactSource(current,item)
     &&Number(current.version)>=Number(write.version)
     &&current.evidence?.original_agent_pre_review?.fingerprint===item.review.fingerprint
     &&current.evidence?.original_agent_pre_review?.external_side_effect===false
     &&current.evidence?.original_agent_pre_review?.consumer_ack_verified===false,
     'INDEPENDENT_READBACK_MISMATCH');
   result.readback_proven++;
   } catch(error) {
     result.failed++;
     const message=String(error?.message||'ORIGINAL_INNOVATION_REVIEW_UNKNOWN_ERROR');
     result.error_codes.push(message.startsWith('ORIGINAL_INNOVATION_REVIEW_')
       ? message.slice('ORIGINAL_INNOVATION_REVIEW_'.length).slice(0,120)
       : 'UNCLASSIFIED_REVIEW_FAILURE');
   }
 }
 return Object.freeze(result);
}

export async function runOriginalAgentPreReview({env=process.env,fetchImpl=globalThis.fetch,now=new Date().toISOString(),writeback=false}={}){
 const config=trustedBrainReadConfig(env);
 const snapshot=await readCanonicalRows({config,fetchImpl});
 const report=evaluateOriginalOwnerHandoff(snapshot,{now});
 const plan=planOriginalAgentPreReviews({snapshot,report,observedAt:now});
 let execution=null;
 if(writeback)execution=await persistOriginalAgentPreReviews({plan,config,fetchImpl});
 return Object.freeze({report,plan,execution,writeback});
}

function publicSummary(result){
 return {
   contract:CONTRACT,observed_at:new Date().toISOString(),
   source_count:result.plan.total,
   review_submitted:result.execution?.readback_proven??0,
   review_already_registered:result.execution?.already_registered??0,
   held_by_existing_source_or_gate:result.plan.held.length,
   deferred_by_budget:result.plan.deferred_by_budget,
   failed_pre_reviews:result.execution?.failed??0,
   failure_codes:result.execution?.error_codes??[],
   execution_mode:result.writeback?'EXISTING_ORIGINAL_AGENT_PRE_REVIEW':'READ_ONLY',
   source_cardinality_verified:true,
   original_agent_consumer_ack_proven:result.report.counts.owner_ack_verified,
   implementation_proven:0,independent_outcome_proven:0,
   original_operations_still_planned:true,
   original_obligations_not_bulk_closed:true,
   task_details_redacted:true,
   next_stage:'ORIGINAL_AGENT_PROTECTED_IMPLEMENTATION_AND_INDEPENDENT_RECEIPT_REQUIRED',
   no_new_scheduler:true,no_new_queue:true,no_parallel_agent:true
 };
}
async function main(){
 const writeback=process.argv.includes('--writeback');
 if(process.argv.slice(2).some(x=>x!=='--writeback'&&x!=='--check'))throw new TypeError('UNKNOWN_CLI_ARG');
 const result=await runOriginalAgentPreReview({writeback});
 const summary=publicSummary(result);
 await mkdir('artifacts/quality',{recursive:true});
 await writeFile(OUT,JSON.stringify(summary,null,2)+'\n');
 process.stdout.write(JSON.stringify(summary)+'\n');
 if(result.execution?.failed>0)process.exitCode=1;
 // No synthetic green when any original agent receipt or implementation is absent.
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 main().catch(error=>{console.error(String(error?.message||'ORIGINAL_INNOVATION_REVIEW_FAILED').slice(0,200));process.exitCode=1;});
}
