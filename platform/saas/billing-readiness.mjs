// Mollie is de betaalroute (besluit Arthur, 27 okt 2026). Netlify praat nooit met Mollie zelf: het roept de
// Supabase Edge Function bg-mollie-checkout aan met de service role; de Mollie-sleutel staat uitsluitend in Supabase Vault.
const clean=value=>String(value||'').trim();
export function billingConfig(env=process.env){
  const base=clean(env?.SUPABASE_URL||env?.BG_PORTAL_EU_SUPABASE_URL).replace(/\/$/,'').replace(/\/functions\/v1$/,'');
  const token=clean(env?.SUPABASE_SERVICE_ROLE_KEY||env?.BG_PORTAL_EU_SERVICE_TOKEN);
  return Object.freeze({base,token,functionUrl:base?base+'/functions/v1/bg-mollie-checkout':'',configured:Boolean(base&&token)});
}
export function billingReadiness(env=process.env){
  const config=billingConfig(env);
  return Object.freeze({provider:'mollie',functionConfigured:config.configured,selfServeAvailable:config.configured,state:config.configured?'ready':'blocked'});
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
async function callCheckoutFunction(query,{fetchFn,env}){
  const config=billingConfig(env);
  if(!config.configured)throw Error('BILLING_NOT_CONFIGURED');
  const response=await fetchFn(config.functionUrl+query,{headers:{apikey:config.token,authorization:'Bearer '+config.token}});
  const data=await response.json().catch(()=>null);
  return {ok:response.ok,data};
}
// Echte beschikbaarheid: de functie meldt of de Vault-sleutel aanwezig is.
export async function providerReadiness({fetchFn=globalThis.fetch,env=process.env}={}){
  const local=billingReadiness(env);
  if(!local.selfServeAvailable)return local;
  try{
    const {ok,data}=await callCheckoutFunction('?readiness=1',{fetchFn,env});
    const available=ok&&data?.selfServeAvailable===true;
    return Object.freeze({provider:'mollie',functionConfigured:true,selfServeAvailable:available,state:available?'ready':'blocked'});
  }catch{return Object.freeze({provider:'mollie',functionConfigured:true,selfServeAvailable:false,state:'blocked'})}
}
export async function checkoutStatus(intentId,{fetchFn=globalThis.fetch,env=process.env}={}){
  const {ok,data}=await callCheckoutFunction('?status='+encodeURIComponent(intentId),{fetchFn,env});
  if(!ok&&!data)throw Error('SESSION_UNAVAILABLE');
  const state=String(data?.state||'provisioning');
  return {ready:data?.ready===true,state};
}
