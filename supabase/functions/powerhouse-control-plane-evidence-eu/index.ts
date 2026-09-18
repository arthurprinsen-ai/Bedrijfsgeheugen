import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function row<T>(value:T|T[]|null):T|null{return Array.isArray(value)?(value[0]??null):value;}
function required(value:unknown,name:string){const v=String(value??'').trim();if(!v)throw new Error(`${name}_MISSING`);return v;}
function sha40(value:string){return /^[0-9a-f]{40}$/i.test(value);}
async function payloadHash(value:string){return await sha256(value);}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let input:any;try{input=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let stage='validate';
  try{
    const obligationKey=required(input.obligation_id,'OBLIGATION_ID');
    const candidateSha=required(input.candidate_head_sha,'CANDIDATE_HEAD_SHA').toLowerCase();
    const mainSha=required(input.main_sha,'MAIN_SHA').toLowerCase();
    if(!sha40(candidateSha)||!sha40(mainSha))throw new Error('SHA_INVALID');
    const productionRunId=Number(input.production_readback_run_id);
    if(!Number.isInteger(productionRunId)||productionRunId<1)throw new Error('PRODUCTION_READBACK_RUN_INVALID');
    const projectionRequired=input.skill_projection_required===true;
    const projectionRunId=input.skill_projection_run_id==null?null:Number(input.skill_projection_run_id);
    if(projectionRequired&&(!Number.isInteger(projectionRunId)||projectionRunId<1))throw new Error('SKILL_PROJECTION_RUN_INVALID');
    if(input.outcome_verified!==true)throw new Error('OUTCOME_NOT_VERIFIED');
    const learningStatus=required(input.learning_status,'LEARNING_STATUS');
    if(!['APPLIED','NOT_APPLICABLE'].includes(learningStatus))throw new Error('LEARNING_STATUS_INVALID');
    if(projectionRequired&&learningStatus!=='APPLIED')throw new Error('LEARNING_PROJECTION_MISMATCH');
    const policyVersion=required(input.policy_version,'POLICY_VERSION');
    const skillVersion=required(input.skill_version,'SKILL_VERSION');
    const actor=required(input.actor||'github-actions','ACTOR');
    const obligationPayloadHash=await payloadHash(obligationKey);
    const terminalPayloadHash=await payloadHash(`${obligationKey}|${candidateSha}|${mainSha}|${productionRunId}|${projectionRunId||''}`);
    const baseEvidence={
      contract:'powerhouse-control-plane-vertical-slice-v1',
      obligation_id:obligationKey,candidate_head_sha:candidateSha,main_sha:mainSha,
      production_readback_run_id:productionRunId,skill_projection_required:projectionRequired,
      skill_projection_run_id:projectionRunId,learning_status:learningStatus,policy_version:policyVersion,
      skill_version:skillVersion,outcome_verified:true,github_workflow_run_id:Number(input.github_workflow_run_id||0)||null,
      actor,recorded_at:new Date().toISOString()
    };

    stage='create_obligation';
    let {data:obligationData,error:obligationError}=await client.rpc('brain_create_obligation',{
      p_obligation_type:'CONTROL_PLANE_DELIVERY',
      p_capability_id:'powerhouse.control-plane',
      p_business_entity:obligationKey,
      p_business_period:'canonical-v1',
      p_business_timezone:'Europe/Amsterdam',
      p_payload_sha256:obligationPayloadHash,
      p_change_id:mainSha,
      p_owner:actor
    });
    if(obligationError)throw obligationError;
    let obligation:any=row(obligationData);if(!obligation?.id)throw new Error('OBLIGATION_CREATE_READBACK_MISSING');

    if(!['RUNNING','FULFILLED'].includes(obligation.state)){
      stage='transition_obligation_running';
      const {data,error}=await client.rpc('brain_transition_obligation',{
        p_obligation_id:obligation.id,p_expected_version:Number(obligation.version),
        p_state:'RUNNING',p_owner:actor,p_evidence:{...(obligation.evidence||{}),...baseEvidence,state:'RUNNING'}
      });
      if(error)throw error;obligation=row(data);if(!obligation?.id)throw new Error('OBLIGATION_RUNNING_READBACK_MISSING');
    }

    stage='create_operation';
    let {data:operationData,error:operationError}=await client.rpc('brain_create_operation',{
      p_capability_id:'agent:powerhouse-control-plane',
      p_operation_type:'TERMINALIZE',
      p_idempotency_key:`${obligationKey}:${mainSha}`,
      p_payload_sha256:terminalPayloadHash,
      p_change_id:mainSha,
      p_correlation_id:obligationKey
    });
    if(operationError)throw operationError;
    let operation:any=row(operationData);if(!operation?.id)throw new Error('OPERATION_CREATE_READBACK_MISSING');

    if(operation.status!=='VERIFIED'){
      stage='transition_operation_verified';
      const {data,error}=await client.rpc('brain_transition_operation',{
        p_operation_id:operation.id,p_expected_version:Number(operation.version),
        p_status:'VERIFIED',p_dispatch_generation:null,p_remote_ref:`github-run:${productionRunId}`,
        p_evidence:{...(operation.evidence||{}),...baseEvidence,terminal_verification:'VERIFIED'}
      });
      if(error)throw error;operation=row(data);if(!operation?.id)throw new Error('OPERATION_VERIFY_READBACK_MISSING');
    }

    stage='insert_delivery_evidence';
    const idempotencyKey=`control-plane-terminal:${obligationKey}:${mainSha}`;
    const {error:evidenceInsertError}=await client.from('brain_delivery_evidence').upsert({
      idempotency_key:idempotencyKey,change_id:mainSha,component_id:'powerhouse-control-plane',
      target:'supabase',status:'GREEN',error_class:null,remote_status:200,remote_ref:`github-run:${productionRunId}`,
      candidate_identity:candidateSha,tested_identity:mainSha,payload_sha256:terminalPayloadHash,evidence:baseEvidence
    },{onConflict:'idempotency_key',ignoreDuplicates:true});
    if(evidenceInsertError)throw evidenceInsertError;

    stage='read_delivery_evidence';
    const {data:evidence,error:evidenceError}=await client.from('brain_delivery_evidence').select('*').eq('idempotency_key',idempotencyKey).maybeSingle();
    if(evidenceError)throw evidenceError;
    if(!evidence||evidence.candidate_identity!==candidateSha||evidence.tested_identity!==mainSha||evidence.status!=='GREEN')throw new Error('TERMINAL_EVIDENCE_READBACK_MISMATCH');

    if(obligation.state!=='FULFILLED'){
      stage='transition_obligation_fulfilled';
      const {data,error}=await client.rpc('brain_transition_obligation',{
        p_obligation_id:obligation.id,p_expected_version:Number(obligation.version),
        p_state:'FULFILLED',p_owner:actor,
        p_evidence:{...(obligation.evidence||{}),...baseEvidence,state:'FULFILLED',delivery_evidence_id:evidence.id,operation_id:operation.id}
      });
      if(error)throw error;obligation=row(data);if(!obligation?.id)throw new Error('OBLIGATION_FULFILLED_READBACK_MISSING');
    }

    stage='read_obligation';
    const {data:readback,error:readbackError}=await client.from('brain_obligations').select('id,state,version,evidence').eq('id',obligation.id).maybeSingle();
    if(readbackError)throw readbackError;
    if(readback?.state!=='FULFILLED'||readback?.evidence?.main_sha!==mainSha)throw new Error('OBLIGATION_TERMINAL_READBACK_MISMATCH');

    return json({ok:true,terminal_state:'FULFILLED',obligation_id:obligationKey,obligation_record_id:obligation.id,operation_id:operation.id,delivery_evidence_id:evidence.id,candidate_head_sha:candidateSha,main_sha:mainSha,production_readback_run_id:productionRunId,skill_projection_run_id:projectionRunId,learning_status:learningStatus,durable_readback_verified:true});
  }catch(error:any){
    return json({ok:false,stage,error:String(error?.message||error),code:error?.code||null,details:error?.details||null,hint:error?.hint||null},422);
  }
});
