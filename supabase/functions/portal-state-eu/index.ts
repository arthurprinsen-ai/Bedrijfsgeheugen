import { createClient } from 'npm:@supabase/supabase-js@2';
import { repairBusinessInputsFromAuthority } from './business-input-read-repair.js';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const ALLOWED_LAYERS=new Set(['legacy-migration','canonical-brain']);
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
const cleanUnique=(values:any[])=>[...new Set(values.map(value=>String(value??'').trim()).filter(Boolean))];

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any; try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const action=String(body?.action||'');
  const tenantId=String(body?.tenantId||'').trim();
  if(action!=='control_plane_cockpit'&&!tenantId)return json({error:'INVALID_REQUEST'},400);
  const url=Deno.env.get('SUPABASE_URL'); const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

  if(action==='control_plane_cockpit'){
    const {data:obligations,error:obligationError}=await client
      .from('powerhouse_obligation_cockpit_v1')
      .select('obligation_id,obligation_key,requested_goal,current_state,owner,operation_status,next_action,blocker,evidence_count,red_evidence_count,latest_evidence_at,policy_version,skill_version,production_observed_sha,latest_remote_ref,outcome_verified,migration_readback_verified,reconciliation_jobs,retry_count,escalated_jobs,actual_result,created_at,updated_at,time_to_terminal_seconds')
      .order('updated_at',{ascending:false})
      .limit(100);
    if(obligationError)return json({error:'CONTROL_PLANE_COCKPIT_READ_FAILED'},500);
    const {data:metrics,error:metricsError}=await client
      .from('powerhouse_control_plane_metrics_v1')
      .select('*')
      .maybeSingle();
    if(metricsError)return json({error:'CONTROL_PLANE_METRICS_READ_FAILED'},500);
    return json({
      contract:'powerhouse-control-plane-admin-cockpit-v1',
      obligations:Array.isArray(obligations)?obligations:[],
      metrics:metrics||{},
      generatedAt:new Date().toISOString()
    });
  }

  if(action==='governance'){
    const {data,error}=await client.from('brain_ai_governance_registry')
      .select('tenant_id,use_case_id,name,provider,model_id,model_revision,purpose,owner_id,lifecycle_status,risk_class,human_oversight,data_categories,prohibited_data_categories,retention_policy,transparency_required,impact_assessment_required,approved,approval_evidence_ids,evidence_ids,last_reviewed_at,next_review_at,inference_platform,training_use,processing_scope,cross_border_transfer,subprocessors,transfer_safeguard,provider_evidence_urls')
      .in('tenant_id',['canonical',tenantId])
      .eq('lifecycle_status','ACTIVE')
      .eq('approved',true)
      .order('use_case_id');
    if(error)return json({error:'GOVERNANCE_READ_FAILED'},500);
    return json({governance:data||[]});
  }

  if(action==='resource_business_value'){
    const {data:summary,error:summaryError}=await client
      .from('powerhouse_portal_resource_summary_v2')
      .select('*')
      .eq('tenant_id',tenantId)
      .maybeSingle();
    if(summaryError)return json({error:'RESOURCE_BUSINESS_VALUE_READ_FAILED'},500);
    const {data:evidence,error:evidenceError}=await client
      .from('powerhouse_action_evidence_maturity_v1')
      .select('action_id,resource_evidence_status,economics_evidence_status,outcome_evidence_status,forecast_evidence_status,evidence_maturity,calibration_eligible,calibration_eligibility_reason,human_feedback_observations,latest_resource_observed_at,latest_economics_observed_at,latest_outcome_observed_at,latest_calibration_at')
      .contains('tenant_ids',[tenantId])
      .limit(500);
    if(evidenceError)return json({error:'ACTION_EVIDENCE_READ_FAILED'},500);
    const {data:lineage,error:lineageError}=await client
      .from('powerhouse_resource_impact_v1')
      .select('factor_id,methodology,confidence,source,occurred_at')
      .eq('tenant_id',tenantId)
      .eq('calculation_status','calculated')
      .limit(5000);
    if(lineageError)return json({error:'RESOURCE_LINEAGE_READ_FAILED'},500);
    const {data:resourceDaily,error:resourceError}=await client
      .from('powerhouse_resource_intelligence_daily_v1')
      .select('day,tenant_id,provider,resource_type,unit,usage_events,resource_amount,factor_observations,factor_coverage,energy_kwh,co2e_kg,water_liters,min_factor_confidence,provenance_complete')
      .eq('tenant_id',tenantId)
      .order('day',{ascending:false})
      .limit(365);
    if(resourceError)return json({error:'RESOURCE_INTELLIGENCE_READ_FAILED'},500);
    const {data:businessValue,error:businessError}=await client
      .from('powerhouse_business_value_intelligence_v1')
      .select('action_id,action_type,channel,status,expected_value_eur,resource_observations,calculated_impact_observations,energy_kwh,co2e_kg,water_liters,tenant_ids,provider_cost_eur,external_cost_eur,human_minutes,observed_cost_eur,realized_revenue_eur,realized_net_value_eur,realized_roi,environmental_factor_coverage,business_value_status')
      .contains('tenant_ids',[tenantId])
      .limit(500);
    if(businessError)return json({error:'BUSINESS_VALUE_INTELLIGENCE_READ_FAILED'},500);
    const {data:compliance,error:complianceError}=await client
      .from('powerhouse_compliance_evidence_v1')
      .select('control_key,requirement_key,evidence_status,evidence_refs,confidence,review_required,observed_at')
      .eq('tenant_id',tenantId)
      .order('observed_at',{ascending:false})
      .limit(500);
    if(complianceError)return json({error:'COMPLIANCE_EVIDENCE_READ_FAILED'},500);
    const {data:recommendations,error:recommendationError}=await client
      .from('powerhouse_resource_optimization_queue_v1')
      .select('candidate_id,opportunity_type,expected_impact,confidence,safety_class,proposed_action,status,created_at')
      .eq('tenant_id',tenantId)
      .limit(100);
    if(recommendationError)return json({error:'RESOURCE_RECOMMENDATIONS_READ_FAILED'},500);

    const rows=Array.isArray(evidence)?evidence:[];
    const lineageRows=Array.isArray(lineage)?lineage:[];
    const factorVersions=cleanUnique(lineageRows.map((row:any)=>row.factor_id));
    const methodologies=cleanUnique(lineageRows.map((row:any)=>row.methodology));
    const sources=cleanUnique(lineageRows.map((row:any)=>row.source));
    const uniqueConfidences=[...new Set(lineageRows.map((row:any)=>Number(row.confidence)).filter((value:number)=>Number.isFinite(value)&&value>0&&value<=1))];
    const calculatedAt=lineageRows.map((row:any)=>row.occurred_at).map((value:any)=>String(value??'').trim()).filter((value:string)=>value&&Number.isFinite(Date.parse(value))).sort((a:string,b:string)=>Date.parse(b)-Date.parse(a))[0]||'';
    const resourceFootprint=summary&&lineageRows.length>0&&factorVersions.length>0&&methodologies.length>0&&sources.length>0&&uniqueConfidences.length===1&&calculatedAt?{
      coverage:Number(summary.environmental_factor_coverage)||0,
      confidence:uniqueConfidences[0],
      calculatedAt,
      factorVersions,
      methodologies,
      sources,
      calculationStatus:'calculated',
      measurementClass:'calculated',
      energyKwh:summary.energy_kwh,
      co2eKg:summary.co2e_kg,
      waterLiters:summary.water_liters
    }:null;
    const complianceRows=(Array.isArray(compliance)?compliance:[]).map((row:any)=>({
      control_key:row.control_key,requirement_key:row.requirement_key,evidence_status:row.evidence_status,
      confidence:row.confidence,review_required:row.review_required,observed_at:row.observed_at,
      evidence_count:Array.isArray(row.evidence_refs)?row.evidence_refs.length:0
    }));
    const intelligence={
      resource_daily:Array.isArray(resourceDaily)?resourceDaily:[],
      business_value:Array.isArray(businessValue)?businessValue:[],
      compliance_evidence:complianceRows,
      recommendations:Array.isArray(recommendations)?recommendations:[],
      freshness:{resource_latest_at:summary?.latest_observed_at||null,generated_at:new Date().toISOString()},
      truth_policy:'measured_or_evidence_backed_else_unknown'
    };
    const base=summary||{tenant_id:tenantId,observations:0,calculated_impact_observations:0,attributed_action_observations:0,environmental_factor_coverage:null,action_attribution_coverage:null,energy_kwh:null,co2e_kg:null,water_liters:null,observed_cost_eur:null,realized_revenue_eur:null,realized_roi:null,latest_observed_at:null};
    return json({resourceBusinessValue:{
      ...base,
      action_evidence_rows:rows.length,
      measured_actions:rows.filter((row:any)=>row.evidence_maturity==='measured').length,
      partial_actions:rows.filter((row:any)=>row.evidence_maturity==='partial').length,
      calibration_eligible_actions:rows.filter((row:any)=>row.calibration_eligible===true).length,
      human_feedback_observations:rows.reduce((total:number,row:any)=>total+Number(row.human_feedback_observations||0),0),
      evidence_source:'powerhouse_action_evidence_maturity_v1',
      resource_footprint:resourceFootprint,
      resource_intelligence:intelligence
    }});
  }

  const layer=String(body?.layer||'').trim();
  if(!ALLOWED_LAYERS.has(layer))return json({error:'INVALID_REQUEST'},400);
  if(action==='get'){
    const {data,error}=await client.rpc('bg_portal_state_get_internal',{p_tenant_id:tenantId,p_layer:layer});
    if(error)return json({error:'STORE_READ_FAILED'},500);
    let payload=Array.isArray(data)&&data[0]?data[0].payload:null;
    if(layer==='canonical-brain'){
      const {data:authorityRecords,error:authorityError}=await client.from('brain_records')
        .select('record_id,record_type,record_kind,subject_id,owner_id,observed_at,updated_at,source_revision,provenance,payload')
        .eq('tenant_id',tenantId)
        .eq('record_type','BusinessInput')
        .order('updated_at',{ascending:true})
        .limit(1000);
      if(authorityError)return json({error:'BUSINESS_INPUT_AUTHORITY_READ_FAILED'},500);
      if(Array.isArray(authorityRecords)&&authorityRecords.length>0)payload=repairBusinessInputsFromAuthority(payload||{},authorityRecords);
    }
    return json({payload});
  }
  if(action==='put'){
    if(!body.payload||typeof body.payload!=='object'||Array.isArray(body.payload))return json({error:'INVALID_PAYLOAD'},400);
    const {data,error}=await client.rpc('bg_portal_state_put_internal',{p_tenant_id:tenantId,p_layer:layer,p_payload:body.payload});
    if(error)return json({error:'STORE_WRITE_FAILED'},500);
    const row=Array.isArray(data)&&data[0]?data[0]:null; if(!row)return json({error:'STORE_WRITE_EMPTY'},500);
    return json({stored:Boolean(row.stored),stale:Boolean(row.stale),record:row.record||body.payload});
  }
  return json({error:'INVALID_ACTION'},400);
});