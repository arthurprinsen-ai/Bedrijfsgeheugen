const clean=v=>String(v??'').trim();
export function createSecurityTrustClient({fetchFn=globalThis.fetch,baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL,serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN}={}){
 if(!fetchFn||!clean(baseUrl)||!clean(serviceToken))throw new Error('SECURITY_TRUST_CONFIG_MISSING');
 const endpoint=clean(baseUrl).replace(/\/$/,'')+'/functions/v1/portal-state-eu';
 const headers={'content-type':'application/json','x-bg-service-token':serviceToken,'x-region':'eu-central-1'};
 async function gateway(body){
  const response=await fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data?.error||'SECURITY_TRUST_GATEWAY_FAILED'),{code:data?.error||'SECURITY_TRUST_GATEWAY_FAILED',status:response.status});
  return data;
 }
 return Object.freeze({
  get:tenantId=>gateway({action:'security_trust_get',tenantId:String(tenantId)}),
  observe:(tenantId,observation,actor='powerhouse-observer')=>gateway({action:'security_trust_observe',tenantId:String(tenantId),observation,actor})
 });
}