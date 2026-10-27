// Billing runs on Mollie through the bg-mollie-checkout Supabase Edge Function.
// The Mollie API key lives only in Supabase Vault; Netlify only needs the Supabase
// URL and service token it already uses for the portal stores.
function edgeConfig(env=process.env){
  const base=String(env?.SUPABASE_URL||env?.BG_PORTAL_EU_SUPABASE_URL||'').trim().replace(/\/$/,'');
  const token=String(env?.SUPABASE_SERVICE_ROLE_KEY||env?.BG_PORTAL_EU_SERVICE_TOKEN||'').trim();
  return {base,token};
}

export function billingReadiness(env=process.env){
  const {base,token}=edgeConfig(env);
  const edgeConfigured=Boolean(base&&token);
  return Object.freeze({
    provider:'mollie',
    edgeConfigured,
    selfServeAvailable:edgeConfigured,
    state:edgeConfigured?'ready':'blocked'
  });
}

export function requireBillingReady(env=process.env){
  const readiness=billingReadiness(env);
  if(!readiness.selfServeAvailable){
    const error=new Error('BILLING_NOT_CONFIGURED');
    error.code='BILLING_NOT_CONFIGURED';
    error.readiness=readiness;
    throw error;
  }
  return readiness;
}

export async function callCheckoutEdge(query,{method='GET',body,fetchFn=globalThis.fetch,env=process.env}={}){
  const {base,token}=edgeConfig(env);
  if(!base||!token)throw Error('BILLING_NOT_CONFIGURED');
  const response=await fetchFn(`${base}/functions/v1/bg-mollie-checkout${query}`,{
    method,
    headers:{authorization:'Bearer '+token,apikey:token,'content-type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const data=await response.json().catch(()=>null);
  return {ok:response.ok,status:response.status,data};
}

export async function checkoutStatus(sessionId,{fetchFn=globalThis.fetch,env=process.env}={}){
  const result=await callCheckoutEdge('?status='+encodeURIComponent(sessionId),{fetchFn,env});
  if(!result.ok||typeof result.data?.ready!=='boolean')throw Error('SESSION_UNAVAILABLE');
  return {ready:result.data.ready,state:String(result.data.state||'provisioning')};
}
