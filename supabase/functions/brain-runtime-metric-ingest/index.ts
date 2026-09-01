const IDENTITY_USER_URL='https://www.bedrijfsgeheugen.nl/.netlify/identity/user';
const exactRevision=/^[a-f0-9]{40}$/i;
const allowedMetrics=new Set(['cached_ms','interactive_ms']);
const allowedCacheStates=new Set(['hit','miss','unknown']);
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown,max=512)=>String(v??'').trim().slice(0,max);
const tenantFromUser=(user:any)=>clean(user?.app_metadata?.tenantId||user?.appMetadata?.tenantId)||`user:${clean(user?.id)}`;

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
  const authorization=req.headers.get('authorization')||'';
  if(!authorization.startsWith('Bearer ')) return json({error:'UNAUTHENTICATED'},401);
  let identityResponse:Response;
  try{identityResponse=await fetch(IDENTITY_USER_URL,{headers:{authorization,accept:'application/json'}})}catch{return json({error:'IDENTITY_UNAVAILABLE'},503)}
  if(!identityResponse.ok) return json({error:'UNAUTHENTICATED'},401);
  let user:any;try{user=await identityResponse.json()}catch{return json({error:'IDENTITY_INVALID'},401)}
  if(!user?.id) return json({error:'UNAUTHENTICATED'},401);
  let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const metricName=clean(body?.metricName,64);
  const metricValueMs=Number(body?.metricValueMs);
  const revision=clean(body?.revision,64);
  const surface=clean(body?.surface,128);
  const route=clean(body?.route,512);
  const cacheState=allowedCacheStates.has(clean(body?.cacheState,32))?clean(body?.cacheState,32):'unknown';
  const sessionId=clean(body?.sessionId,128);
  if(!allowedMetrics.has(metricName)||!Number.isFinite(metricValueMs)||metricValueMs<0||!exactRevision.test(revision)||!surface||!route||!sessionId) return json({error:'INVALID_METRIC'},400);
  const base=Deno.env.get('SUPABASE_URL')||'';
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!base||!key) return json({error:'METRICS_STORE_UNCONFIGURED'},503);
  const tenantId=tenantFromUser(user);
  const metadata=body?.metadata&&typeof body.metadata==='object'&&!Array.isArray(body.metadata)?body.metadata:{};
  const stored={tenant_id:tenantId,surface,route,metric_name:metricName,metric_value_ms:metricValueMs,cache_state:cacheState,revision,session_id:sessionId,metadata};
  const write=await fetch(`${base.replace(/\/$/,'')}/rest/v1/brain_runtime_metrics`,{method:'POST',headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json',prefer:'return=minimal'},body:JSON.stringify(stored)});
  if(!write.ok) return json({error:'METRIC_PERSIST_FAILED'},502);
  return json({accepted:true},202);
});
