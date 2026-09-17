import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const ALLOWED_LAYERS=new Set(['legacy-migration','canonical-brain']);
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
const cleanUnique=(values:any[])=>[...new Set(values.map(value=>String(value??'').trim()).filter(Boolean))];
const finite=(value:any)=>{const number=Number(value);return Number.isFinite(number)?number:null};
const sumFinite=(rows:any[],key:string)=>rows.reduce((total,row)=>{const value=finite(row?.[key]);return total+(value??0)},0);

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any; try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const action=String(body?.action||'');
  const tenantId=String(body?.tenantId||'').trim();
  if(!tenantId)return json({error:'INVALID_REQUEST'},400);
  const url=Deno.env.get('SUPABASE_URL'); const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

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
    return json({resourceBusinessValue:summary?{
      ...summary,
      action_evidence_rows:rows.length,
      measured_actions:rows.filter((row:any)=>row.evidence_maturity==='measured').length,
      partial_actions:rows.filter((row:any)=>row.evidence_maturity==='partial').length,
      calibration_eligible_actions:rows.filter((row:any)=>row.calibration_eligible===true).length,
      human_feedback_observations:rows.reduce((total:number,row:any)=>total+Number(row.human_feedback_observations||0),0),
      evidence_source:'powerhouse_action_evidence_maturity_v1',
      resource_footprint:resourceFootprint
    }:null});
  }

  if(action==='resource_intelligence'){
    const [resourceResult,businessResult,catalogResult,evidenceResult,candidateResult]=await Promise.all([
      client.from('powerhouse_resource_tenant_summary_v1').select('*').eq('tenant_id',tenantId).maybeSingle(),
      client.from('powerhouse_business_value_intelligence_v1').select('action_id,observed_cost_eur,realized_revenue_eur,realized_net_value_eur,realized_roi,environmental_factor_coverage,business_value_status').contains('tenant_ids',[tenantId]).limit(2000),
      client.from('powerhouse_compliance_control_catalog_v1').select('control_key,framework,category,title,description,applicability_status,legal_reference,effective_from,source_url,source_published_at,source_checked_at').eq('active',true).order('framework').order('control_key'),
      client.from('powerhouse_compliance_evidence_v1').select('control_key,requirement_key,evidence_status,evidence_refs,provenance,confidence,review_required,observed_at').eq('tenant_id',tenantId).limit(2000),
      client.from('powerhouse_optimization_candidate_v1').select('candidate_id,opportunity_type,baseline,expected_impact,confidence,safety_class,proposed_action,status,production_authority,created_at').eq('tenant_id',tenantId).in('status',['candidate','approved_by_policy','executing','measuring']).order('confidence',{ascending:false}).limit(100)
    ]);
    if(resourceResult.error)return json({error:'RESOURCE_INTELLIGENCE_READ_FAILED'},500);
    if(businessResult.error)return json({error:'BUSINESS_VALUE_INTELLIGENCE_READ_FAILED'},500);
    if(catalogResult.error)return json({error:'COMPLIANCE_CATALOG_READ_FAILED'},500);
    if(evidenceResult.error)return json({error:'COMPLIANCE_EVIDENCE_READ_FAILED'},500);
    if(candidateResult.error)return json({error:'OPTIMIZATION_CANDIDATE_READ_FAILED'},500);
    const business=Array.isArray(businessResult.data)?businessResult.data:[];
    const catalog=Array.isArray(catalogResult.data)?catalogResult.data:[];
    const evidence=Array.isArray(evidenceResult.data)?evidenceResult.data:[];
    const candidates=Array.isArray(candidateResult.data)?candidateResult.data:[];
    const evidenceByControl=new Map(evidence.map((row:any)=>[String(row.control_key),row]));
    const frameworks=['EU_AI_ACT','NIS2','CSRD_ESRS'].map(framework=>{
      const controls=catalog.filter((row:any)=>row.framework===framework);
      const matched=controls.map((control:any)=>({control,evidence:evidenceByControl.get(String(control.control_key))||null}));
      const evidencePresent=matched.filter((row:any)=>row.evidence?.evidence_status==='evidence_present').length;
      const reviewRequired=matched.filter((row:any)=>row.evidence?.evidence_status==='review_required'||row.evidence?.review_required===true).length;
      const evidenceMissing=matched.filter((row:any)=>row.evidence?.evidence_status==='evidence_missing').length;
      const notApplicable=matched.filter((row:any)=>row.evidence?.evidence_status==='not_applicable').length;
      const evaluated=matched.filter((row:any)=>row.evidence).length;
      const denominator=Math.max(0,controls.length-notApplicable);
      const evidenceCoveragePct=denominator?Math.round((evidencePresent/denominator)*1000)/10:null;
      const status=controls.length===0?'catalog_unavailable':evaluated===0?'assessment_not_started':evidenceMissing>0||reviewRequired>0?'evidence_gaps':'evidence_ready';
      return {framework,controls:controls.length,evaluated,evidencePresent,evidenceMissing,reviewRequired,notApplicable,unevaluated:Math.max(0,controls.length-evaluated),evidenceCoveragePct,status,applicability:'assessment_required',disclaimer:'Bewijsdekking en readiness; geen juridische conformiteitsverklaring.',items:matched};
    });
    const observedCostRows=business.filter((row:any)=>finite(row.observed_cost_eur)!==null);
    const revenueRows=business.filter((row:any)=>finite(row.realized_revenue_eur)!==null);
    const roiRows=business.filter((row:any)=>finite(row.realized_roi)!==null);
    return json({resourceIntelligence:{
      tenantId,
      resource:resourceResult.data||null,
      business:{actions:business.length,actionsWithObservedCost:observedCostRows.length,actionsWithRealizedRevenue:revenueRows.length,actionsWithRealizedRoi:roiRows.length,observedCostEur:sumFinite(observedCostRows,'observed_cost_eur'),realizedRevenueEur:sumFinite(revenueRows,'realized_revenue_eur'),realizedNetValueEur:sumFinite(business,'realized_net_value_eur')},
      compliance:{frameworks,catalogCheckedAt:catalog.map((row:any)=>row.source_checked_at).filter(Boolean).sort().at(-1)||null},
      optimization:{openCandidates:candidates.length,safeReversible:candidates.filter((row:any)=>row.safety_class==='safe_reversible').length,reviewRequired:candidates.filter((row:any)=>row.safety_class==='review_required').length,candidates},
      truth:{unknownPhysicalMetricsRemainNull:true,legalComplianceClaim:false,productionAuthority:'BG169'}
    }});
  }

  const layer=String(body?.layer||'').trim();
  if(!ALLOWED_LAYERS.has(layer))return json({error:'INVALID_REQUEST'},400);
  if(action==='get'){
    const {data,error}=await client.rpc('bg_portal_state_get_internal',{p_tenant_id:tenantId,p_layer:layer});
    if(error)return json({error:'STORE_READ_FAILED'},500);
    return json({payload:Array.isArray(data)&&data[0]?data[0].payload:null});
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
