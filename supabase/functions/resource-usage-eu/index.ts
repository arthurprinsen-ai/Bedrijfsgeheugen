import { createClient } from 'npm:@supabase/supabase-js@2';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();

async function authorizedByExistingPortalAuthority(base:string, token:string){
  if(!token) return false;
  try{
    const response=await fetch(`${base}/functions/v1/portal-state-eu`,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify({action:'governance',tenantId:'canonical'})});
    return response.ok;
  }catch{return false;}
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({error:'METHOD_NOT_ALLOWED'},405);
  const base=clean(Deno.env.get('SUPABASE_URL')).replace(/\/$/,'');
  const key=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  if(!base||!key) return json({error:'SERVER_CONFIG'},500);
  const token=req.headers.get('x-bg-service-token')||'';
  if(!(await authorizedByExistingPortalAuthority(base,token))) return json({error:'UNAUTHORIZED'},401);
  let body:any; try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  if(body?.action!=='record') return json({error:'INVALID_ACTION'},400);
  const usage=body?.usage||{};
  const usageId=clean(usage.usageId||usage.requestId);
  const capabilityId=clean(usage.capabilityId||usage.componentKey);
  const source=clean(usage.source||usage.provider);
  const usageType=clean(usage.usageType||'ai_tokens');
  const unit=clean(usage.unit||'tokens');
  const amount=Number(usage.amount??usage.totalTokens);
  const occurredAt=clean(usage.occurredAt||usage.at);
  if(!usageId||!capabilityId||!source||!usageType||!unit||!Number.isFinite(amount)||amount<0||!occurredAt) return json({error:'INVALID_USAGE'},400);
  const client=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const incomingMetadata=usage.metadata&&typeof usage.metadata==='object'?usage.metadata:{};
  const tenantId=clean(incomingMetadata.tenant_id||usage.tenantId)||'canonical';
  const metadata={...incomingMetadata,tenant_id:tenantId,measurement_class:clean(usage.measurementClass)||'provider_reported',provider_model_id:clean(usage.providerModelId)||null};
  const {data,error}=await client.rpc('brain_record_resource_usage',{
    p_usage_id:usageId,p_capability_id:capabilityId,p_source:source,p_usage_type:usageType,p_unit:unit,p_amount:amount,p_occurred_at:occurredAt,p_provider_usage_id:clean(usage.providerUsageId)||usageId,p_metadata:metadata,p_payload_sha256:null
  });
  if(error) return json({error:'CANONICAL_USAGE_WRITE_FAILED'},500);
  return json({authority:'supabase:brain_budget_usage',tenantId,result:data},201);
});
