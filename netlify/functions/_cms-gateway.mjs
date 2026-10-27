const DEFAULT_TIMEOUT_MS=3_500;

function requiredEnv(name){
  const value=Netlify.env.get(name);
  if(!value)throw new Error('CMS configuration missing: '+name);
  return value;
}

export async function cmsGateway(body,{timeoutMs=DEFAULT_TIMEOUT_MS}={}){
  const baseUrl=requiredEnv('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const serviceToken=requiredEnv('BG_PORTAL_EU_SERVICE_TOKEN');
  let response;
  try{
    response=await fetch(baseUrl+'/functions/v1/portal-state-eu',{
      method:'POST',
      headers:{'content-type':'application/json','x-bg-service-token':serviceToken},
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(Math.max(250,Number(timeoutMs)||DEFAULT_TIMEOUT_MS))
    });
  }catch(error){
    const timeout=error?.name==='TimeoutError'||error?.name==='AbortError';
    const failure=new Error(timeout?'CMS_GATEWAY_TIMEOUT':'CMS_GATEWAY_NETWORK');
    failure.status=503;
    failure.cause=error;
    throw failure;
  }
  const data=await response.json().catch(()=>({error:'INVALID_EDGE_RESPONSE'}));
  if(!response.ok){
    const error=new Error(data?.error||'CMS_GATEWAY_FAILED');
    error.status=response.status;
    throw error;
  }
  return data;
}
