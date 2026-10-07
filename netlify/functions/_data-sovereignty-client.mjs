const clean=v=>String(v??'').trim();
export function createDataSovereigntyClient({fetchFn=globalThis.fetch,baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL,serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN}={}){
  if(!fetchFn||!clean(baseUrl)||!clean(serviceToken))throw new Error('DATA_SOVEREIGNTY_CONFIG_MISSING');
  const endpoint=clean(baseUrl).replace(/\/$/,'')+'/functions/v1/portal-state-eu';
  const headers={'content-type':'application/json','x-bg-service-token':serviceToken,'x-region':'eu-central-1'};
  async function gateway(body){
    const response=await fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error(data?.error||'DATA_SOVEREIGNTY_GATEWAY_FAILED'),{code:data?.error||'DATA_SOVEREIGNTY_GATEWAY_FAILED',status:response.status});
    return data;
  }
  return Object.freeze({
    get:tenantId=>gateway({action:'data_sovereignty_get',tenantId:String(tenantId)}),
    setPolicy:(tenantId,policy,actor)=>gateway({action:'data_sovereignty_policy_set',tenantId:String(tenantId),policy,actor}),
    async assertAiAllowed(tenantId){
      const result=await gateway({action:'data_sovereignty_get',tenantId:String(tenantId)});
      const snapshot=result?.snapshot||{};
      if(snapshot?.policy?.enforcement_mode==='BLOCK'&&snapshot?.policy?.mode==='EU_ONLY'){
        const aiViolations=(snapshot.violations||[]).filter(v=>v?.kind==='ai_route'||v?.kind==='policy');
        if(aiViolations.length)throw Object.assign(new Error('DATA_SOVEREIGNTY_AI_BLOCKED'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED',details:aiViolations});
      }
      return snapshot;
    }
  });
}
