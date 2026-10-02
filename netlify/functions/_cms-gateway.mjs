function requiredEnv(name){
  const value=Netlify.env.get(name);
  if(!value)throw new Error('CMS configuration missing: '+name);
  return value;
}

export async function cmsGateway(body){
  const baseUrl=requiredEnv('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const serviceToken=requiredEnv('BG_PORTAL_EU_SERVICE_TOKEN');
  const response=await fetch(baseUrl+'/functions/v1/portal-state-eu',{
    method:'POST',
    headers:{'content-type':'application/json','x-bg-service-token':serviceToken},
    body:JSON.stringify(body)
  });
  const data=await response.json().catch(()=>({error:'INVALID_EDGE_RESPONSE'}));
  if(!response.ok){
    const error=new Error(data?.error||'CMS_GATEWAY_FAILED');
    error.status=response.status;
    throw error;
  }
  return data;
}
