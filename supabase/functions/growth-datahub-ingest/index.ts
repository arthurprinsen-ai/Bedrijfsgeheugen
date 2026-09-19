import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function blogContentId(canonical:string,payload:any){const explicit=String(payload?.content_id||'').trim();if(explicit)return explicit;try{const path=new URL(String(canonical||'')).pathname;const match=path.match(/^\/blog\/([a-z0-9-]+)\/?$/);return match?`blog:${match[1]}`:'';}catch{return '';}}
function eventType(type:string){const t=String(type||'').trim();if(t==='page_view'||t==='organic_landing')return 'visit';if(t==='money_link_click'||t==='primary_cta_click'||t==='secondary_cta_click')return 'cta';if(t==='engaged_view')return 'engagement';if(t==='lead_outcome'||t==='frisse_blik_start'||t==='selfscan_start')return 'lead';return t;}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const action=String(body?.action||'');
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  if(action==='event'){
    const {data,error}=await client.rpc('bg_growth_ingest_event',{p_event:body.event});
    if(error)return json({error:'EVENT_STORE_FAILED',detail:error.message.slice(0,300)},500);
    return json({datahub:'supabase:growth_events',result:data},200);
  }
  if(action==='outcome'){
    const {data,error}=await client.rpc('bg_growth_ingest_outcome',{p_outcome:body.outcome});
    if(error)return json({error:'OUTCOME_STORE_FAILED',detail:error.message.slice(0,300)},500);
    return json({datahub:'supabase:growth_outcomes',result:data},200);
  }
  if(action==='brain_delivery'){
    const queueId=String(body?.queue_id||'').trim();
    const state=String(body?.state||'').trim().toUpperCase();
    if(!queueId||!['DELIVERED','BLOCKED','QUEUED'].includes(state))return json({error:'INVALID_BRAIN_DELIVERY'},400);
    const patch:any={state,updated_at:new Date().toISOString()};
    if(state==='DELIVERED')patch.delivered_at=new Date().toISOString();
    if(body?.attempted)patch.last_attempt_at=new Date().toISOString();
    if(body?.attempted)patch.attempts=Number(body?.attempts||1);
    if(body?.last_error)patch.last_error=String(body.last_error).slice(0,500);
    const {data,error}=await client.from('growth_brain_queue').update(patch).eq('queue_id',queueId).select('queue_id,state,attempts,delivered_at,last_error').maybeSingle();
    if(error)return json({error:'BRAIN_QUEUE_UPDATE_FAILED',detail:error.message.slice(0,300)},500);
    return json({datahub:'supabase:growth_brain_queue',result:data},200);
  }
  if(action==='control_plane_terminal'){
    const terminal=body?.terminal||{};
    const required=(value:any,name:string)=>{const v=String(value??'').trim();if(!v)throw new Error(`${name}_MISSING`);return v};
    try{
      const obligationKey=required(terminal.obligation_id,'OBLIGATION_ID');
      const candidateSha=required(terminal.candidate_head_sha,'CANDIDATE_HEAD_SHA').toLowerCase();
      const mainSha=required(terminal.main_sha,'MAIN_SHA').toLowerCase();
      if(!/^[0-9a-f]{40}$/.test(candidateSha)||!/^[0-9a-f]{40}$/.test(mainSha))throw new Error('SHA_INVALID');
      const productionReadbackMode=String(terminal.production_readback_mode||'canonical_run');
      if(!['canonical_run','descendant_live','github_main'].includes(productionReadbackMode))throw new Error('PRODUCTION_READBACK_MODE_INVALID');
      const productionRunId=terminal.production_readback_run_id==null?null:Number(terminal.production_readback_run_id);
      const productionObservedSha=String(terminal.production_observed_sha||mainSha).toLowerCase();
      const productionDeployId=String(terminal.production_deploy_id||'').trim()||null;
      if(productionReadbackMode==='canonical_run'&&(!Number.isInteger(productionRunId)||productionRunId<1))throw new Error('PRODUCTION_READBACK_RUN_INVALID');
      if(productionReadbackMode==='descendant_live'){
        if(!/^[0-9a-f]{40}$/.test(productionObservedSha))throw new Error('PRODUCTION_OBSERVED_SHA_INVALID');
        if(!productionDeployId)throw new Error('PRODUCTION_DEPLOY_ID_MISSING');
        if(terminal.production_readback_verified!==true)throw new Error('PRODUCTION_DESCENDANT_READBACK_NOT_VERIFIED');
      }
      if(productionReadbackMode==='github_main'){
        if(!/^[0-9a-f]{40}$/.test(productionObservedSha))throw new Error('PRODUCTION_OBSERVED_SHA_INVALID');
        if(terminal.production_readback_verified!==true)throw new Error('PRODUCTION_GITHUB_MAIN_READBACK_NOT_VERIFIED');
      }
      const projectionRequired=terminal.skill_projection_required===true;
      const projectionRunId=terminal.skill_projection_run_id==null?null:Number(terminal.skill_projection_run_id);
      if(projectionRequired&&(!Number.isInteger(projectionRunId)||projectionRunId<1))throw new Error('SKILL_PROJECTION_RUN_INVALID');
      if(terminal.outcome_verified!==true)throw new Error('OUTCOME_NOT_VERIFIED');
      const learningStatus=required(terminal.learning_status,'LEARNING_STATUS');
      if(!['APPLIED','NOT_APPLICABLE'].includes(learningStatus))throw new Error('LEARNING_STATUS_INVALID');
      if(projectionRequired&&learningStatus!=='APPLIED')throw new Error('LEARNING_PROJECTION_MISMATCH');
      const policyVersion=required(terminal.policy_version,'POLICY_VERSION');
      const skillVersion=required(terminal.skill_version,'SKILL_VERSION');
      const actor=required(terminal.actor||'github-actions','ACTOR');
      const migrationReadbackRequired=terminal.migration_readback_required===true;
      const expectedMigrations=Array.isArray(terminal.expected_migrations)?terminal.expected_migrations:[];
      if(migrationReadbackRequired&&expectedMigrations.length===0)throw new Error('MIGRATION_READBACK_EXPECTATIONS_MISSING');
      for(const migration of expectedMigrations){
        if(!/^\d{14}$/.test(String(migration?.version||''))||!/^[a-z0-9_]+$/.test(String(migration?.name||''))){
          throw new Error('MIGRATION_IDENTITY_INVALID');
        }
      }
      const obligationPayloadHash=await sha256(obligationKey);
      const terminalPayloadHash=await sha256(`${obligationKey}|${candidateSha}|${mainSha}|${productionReadbackMode}|${productionRunId??''}|${productionObservedSha}|${productionDeployId??''}|${projectionRunId??''}|${JSON.stringify(expectedMigrations)}`);
      const one=(value:any)=>Array.isArray(value)?value[0]:value;

      let migrationReadback:any={
        contract:'powerhouse-supabase-migration-readback-v1',
        required:false,
        all_matched:true,
        expected_count:0,
        matched_count:0,
        migrations:[]
      };
      if(migrationReadbackRequired){
        const verified=await client.rpc('powerhouse_supabase_migration_readback_v1',{p_expected:expectedMigrations});
        if(verified.error)throw new Error(`MIGRATION_READBACK_FAILED:${verified.error.message}`);
        migrationReadback=one(verified.data);
        if(!migrationReadback||migrationReadback.all_matched!==true
          || Number(migrationReadback.expected_count)!==expectedMigrations.length
          || Number(migrationReadback.matched_count)!==expectedMigrations.length){
          throw new Error('MIGRATION_LEDGER_IDENTITY_MISMATCH');
        }
        migrationReadback={...migrationReadback,required:true};
      }

      let {data:obligation,error:obligationError}=await client.rpc('brain_create_obligation',{
        p_obligation_type:'CONTROL_PLANE_DELIVERY',
        p_capability_id:'powerhouse.control-plane',
        p_business_entity:obligationKey,
        p_business_period:'canonical-v1',
        p_business_timezone:'Europe/Amsterdam',
        p_payload_sha256:obligationPayloadHash,
        p_change_id:mainSha,
        p_owner:actor
      });
      if(obligationError)throw new Error(`OBLIGATION_CREATE_FAILED:${obligationError.message}`);
      obligation=one(obligation);
      if(!obligation?.id)throw new Error('OBLIGATION_CREATE_READBACK_MISSING');

      const baseEvidence={
        contract:'powerhouse-control-plane-vertical-slice-v1',
        obligation_id:obligationKey,
        candidate_head_sha:candidateSha,
        main_sha:mainSha,
        production_readback_mode:productionReadbackMode,
        production_readback_run_id:productionRunId,
        production_observed_sha:productionObservedSha,
        production_deploy_id:productionDeployId,
        production_readback_verified:productionReadbackMode==='canonical_run'||terminal.production_readback_verified===true,
        skill_projection_required:projectionRequired,
        skill_projection_run_id:projectionRunId,
        learning_status:learningStatus,
        policy_version:policyVersion,
        skill_version:skillVersion,
        outcome_verified:true,
        github_workflow_run_id:Number(terminal.github_workflow_run_id||0)||null,
        oidc_repository:terminal.oidc_repository||null,
        oidc_workflow_ref:terminal.oidc_workflow_ref||null,
        actor,
        migration_readback_required:migrationReadbackRequired,
        expected_migrations:expectedMigrations,
        migration_readback:migrationReadback,
        migration_readback_verified:!migrationReadbackRequired||migrationReadback.all_matched===true,
        recorded_at:new Date().toISOString()
      };

      if(!['RUNNING','FULFILLED'].includes(String(obligation.state))){
        const transitioned=await client.rpc('brain_transition_obligation',{
          p_obligation_id:obligation.id,
          p_expected_version:Number(obligation.version),
          p_state:'RUNNING',
          p_owner:actor,
          p_evidence:{...(obligation.evidence||{}),...baseEvidence,state:'RUNNING'}
        });
        if(transitioned.error)throw new Error(`OBLIGATION_RUNNING_FAILED:${transitioned.error.message}`);
        obligation=one(transitioned.data);
      }

      let {data:operation,error:operationError}=await client.rpc('brain_create_operation',{
        p_capability_id:'agent:powerhouse-control-plane',
        p_operation_type:'TERMINALIZE',
        p_idempotency_key:`${obligationKey}:${mainSha}`,
        p_payload_sha256:terminalPayloadHash,
        p_change_id:mainSha,
        p_correlation_id:obligationKey
      });
      if(operationError)throw new Error(`OPERATION_CREATE_FAILED:${operationError.message}`);
      operation=one(operation);
      if(!operation?.id)throw new Error('OPERATION_CREATE_READBACK_MISSING');
      if(operation.status!=='VERIFIED'){
        const transitioned=await client.rpc('brain_transition_operation',{
          p_operation_id:operation.id,
          p_expected_version:Number(operation.version),
          p_status:'VERIFIED',
          p_dispatch_generation:null,
          p_remote_ref:`github-run:${productionRunId}`,
          p_evidence:{...(operation.evidence||{}),...baseEvidence,terminal_verification:'VERIFIED'}
        });
        if(transitioned.error)throw new Error(`OPERATION_VERIFY_FAILED:${transitioned.error.message}`);
        operation=one(transitioned.data);
      }

      const idempotencyKey=`control-plane-terminal:${obligationKey}:${mainSha}`;
      const upsert=await client.from('brain_delivery_evidence').upsert({
        idempotency_key:idempotencyKey,
        change_id:mainSha,
        component_id:'powerhouse-control-plane',
        target:'supabase',
        status:'GREEN',
        error_class:null,
        remote_status:200,
        remote_ref:productionReadbackMode==='canonical_run'
          ?`github-run:${productionRunId}`
          :productionReadbackMode==='github_main'
            ?`github-main:${productionObservedSha}`
            :`production-descendant:${productionObservedSha}:${productionDeployId}`,
        candidate_identity:candidateSha,
        tested_identity:mainSha,
        payload_sha256:terminalPayloadHash,
        evidence:baseEvidence
      },{onConflict:'idempotency_key',ignoreDuplicates:true}).select('*').maybeSingle();
      if(upsert.error)throw new Error(`DELIVERY_EVIDENCE_WRITE_FAILED:${upsert.error.message}`);
      let evidence=upsert.data;
      if(!evidence){
        const read=await client.from('brain_delivery_evidence').select('*').eq('idempotency_key',idempotencyKey).maybeSingle();
        if(read.error)throw new Error(`DELIVERY_EVIDENCE_READ_FAILED:${read.error.message}`);
        evidence=read.data;
      }
      if(!evidence||evidence.candidate_identity!==candidateSha||evidence.tested_identity!==mainSha||evidence.status!=='GREEN')throw new Error('TERMINAL_EVIDENCE_READBACK_MISMATCH');

      const terminalIdentityChanged=obligation?.evidence?.main_sha!==mainSha
        || obligation?.evidence?.delivery_evidence_id!==evidence.id
        || obligation?.evidence?.operation_id!==operation.id;
      if(obligation.state!=='FULFILLED'||terminalIdentityChanged){
        const transitioned=await client.rpc('brain_transition_obligation',{
          p_obligation_id:obligation.id,
          p_expected_version:Number(obligation.version),
          p_state:'FULFILLED',
          p_owner:actor,
          p_evidence:{...(obligation.evidence||{}),...baseEvidence,state:'FULFILLED',delivery_evidence_id:evidence.id,operation_id:operation.id}
        });
        if(transitioned.error)throw new Error(`OBLIGATION_FULFILL_FAILED:${transitioned.error.message}`);
        obligation=one(transitioned.data);
      }
      const readback=await client.from('brain_obligations').select('id,state,version,evidence').eq('id',obligation.id).maybeSingle();
      if(readback.error)throw new Error(`OBLIGATION_READBACK_FAILED:${readback.error.message}`);
      if(readback.data?.state!=='FULFILLED'||readback.data?.evidence?.main_sha!==mainSha)throw new Error('OBLIGATION_TERMINAL_READBACK_MISMATCH');

      return json({datahub:'supabase:brain-control-plane',result:{
        ok:true,
        terminal_state:'FULFILLED',
        obligation_id:obligationKey,
        obligation_record_id:obligation.id,
        operation_id:operation.id,
        delivery_evidence_id:evidence.id,
        candidate_head_sha:candidateSha,
        main_sha:mainSha,
        production_readback_mode:productionReadbackMode,
        production_readback_run_id:productionRunId,
        production_observed_sha:productionObservedSha,
        production_deploy_id:productionDeployId,
        production_readback_verified:productionReadbackMode==='canonical_run'||terminal.production_readback_verified===true,
        skill_projection_run_id:projectionRunId,
        learning_status:learningStatus,
        migration_readback_required:migrationReadbackRequired,
        migration_readback_verified:!migrationReadbackRequired||migrationReadback.all_matched===true,
        migration_readback:migrationReadback,
        durable_readback_verified:true
      }},200);
    }catch(error){
      return json({error:'CONTROL_PLANE_TERMINAL_FAILED',detail:String(error?.message||error).slice(0,500)},422);
    }
  }
  if(action==='learning_export'){
    const limit=Math.min(5000,Math.max(100,Number(body?.limit||5000)));
    const [{data:events,error:eventError},{data:outcomes,error:outcomeError}]=await Promise.all([
      client.from('growth_events').select('event_id,event_type,canonical,source,medium,campaign,occurred_at,payload').order('occurred_at',{ascending:false}).limit(limit),
      client.from('growth_outcomes').select('outcome_id,stage,canonical,occurred_at,revenue_eur,payload').order('occurred_at',{ascending:false}).limit(1000)
    ]);
    if(eventError||outcomeError)return json({error:'LEARNING_EXPORT_FAILED',detail:(eventError?.message||outcomeError?.message||'read failed').slice(0,300)},500);
    const normalized:any[]=[];
    for(const row of events||[]){const content_id=blogContentId(row.canonical,row.payload);if(!content_id)continue;normalized.push({event_id:String(row.event_id),occurred_at:row.occurred_at,content_id,content_type:String(row.payload?.content_type||'blog'),channel:String(row.payload?.channel||row.source||'website'),source:row.source||'',medium:row.medium||'',campaign:row.campaign||'',event_type:eventType(row.event_type),value:0,journey_id:null,order_id:null,attribution:null});}
    for(const row of outcomes||[]){const content_id=blogContentId(row.canonical,row.payload);if(!content_id)continue;const stage=String(row.stage||'').toLowerCase();const commercialType=stage==='won_order'?'order':stage==='revenue'?'revenue':stage==='qualified_lead'?'qualified_lead':stage==='lead'?'lead':stage==='proposal'||stage==='appointment'?'opportunity':'lead';normalized.push({event_id:`outcome:${row.outcome_id}`,occurred_at:row.occurred_at,content_id,content_type:String(row.payload?.content_type||'blog'),channel:String(row.payload?.channel||'website'),source:'commercial-outcome',medium:'',campaign:'',event_type:commercialType,value:commercialType==='revenue'?Number(row.revenue_eur||0):0,journey_id:null,order_id:String(row.payload?.order_id||row.outcome_id),attribution:String(row.payload?.attribution||'last_touch')});}
    return json({version:1,generated_at:new Date().toISOString(),events:normalized,counts:{source_events:(events||[]).length,source_outcomes:(outcomes||[]).length,normalized:normalized.length}},200);
  }
  if(action==='status'){
    const [{count:eventCount,error:eventError},{count:outcomeCount,error:outcomeError},{count:queuedCount,error:queueError}]=await Promise.all([
      client.from('growth_events').select('*',{count:'exact',head:true}),
      client.from('growth_outcomes').select('*',{count:'exact',head:true}),
      client.from('growth_brain_queue').select('*',{count:'exact',head:true}).neq('state','DELIVERED')
    ]);
    if(eventError||outcomeError||queueError)return json({error:'STATUS_READ_FAILED'},500);
    return json({datahub:'supabase:growth',events:eventCount||0,outcomes:outcomeCount||0,brain_queue_open:queuedCount||0},200);
  }
  return json({error:'INVALID_ACTION'},400);
});