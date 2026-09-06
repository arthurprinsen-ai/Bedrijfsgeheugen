import { normalizeGrowthOutcome } from '../../tools/seo-growth/datahub-contract.mjs';

function env(name){return Netlify.env.get(name)||'';}
function endpoint(slug){const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');return base?`${base}/functions/v1/${slug}`:'';}
async function postEdge(slug,payload){
  const url=endpoint(slug);const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!url||!token)return {ok:false,reason:'eu-store-unconfigured'};
  try{
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify(payload),signal:AbortSignal.timeout(3500)});
    const body=await response.json().catch(()=>null);
    return {ok:response.ok,status:response.status,body,reason:response.ok?'ok':'http-error'};
  }catch(error){return {ok:false,reason:error?.name==='TimeoutError'?'timeout':'network-error'};}
}

export async function captureCommercialLead({email,idempotencyKey,attributionRootKey,source='digitaliseringsmonitor',canonical='https://www.bedrijfsgeheugen.nl/monitor',occurredAt=new Date().toISOString()}){
  const leadResult=await postEdge('commercial-lead-ingest',{action:'lead',lead:{email,idempotency_key:idempotencyKey,source,canonical,attribution_root_key:attributionRootKey,occurred_at:occurredAt}});
  if(!leadResult.ok||!leadResult.body?.lead?.lead_id)return {captured:false,reason:leadResult.reason,status:leadResult.status};
  const leadId=String(leadResult.body.lead.lead_id);
  const outcome=normalizeGrowthOutcome({outcome_id:`qualified-lead:${leadId}`,stage:'qualified_lead',attribution_root_key:attributionRootKey||leadId,canonical,intent_owner:canonical,occurred_at:occurredAt,revenue_eur:0,source});
  const outcomeResult=await postEdge('growth-datahub-ingest',{action:'outcome',outcome});
  return {captured:true,deduped:Boolean(leadResult.body.deduped),lead_id:leadId,outcome_queued:outcomeResult.ok,outcome_id:outcome.outcome_id};
}
