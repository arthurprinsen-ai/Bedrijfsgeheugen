import {billingConfig} from '../../platform/saas/billing-readiness.mjs';
import {createPortalProjectStore} from './_portal-project-store.mjs';
import {randomUUID} from 'node:crypto';
import offers from '../../config/commercial-offers-v1.json' with {type:'json'};

// Mollie checkout (27 okt 2026): Netlify valideert het publieke aanbod en geeft door aan de Supabase Edge Function
// bg-mollie-checkout. Mollie-sleutel: Supabase Vault (MOLLIE_API_KEY), nooit hier.
const out=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const PASS_THROUGH=new Set(['invalid_request','invalid_json','plan_not_self_serve','checkout_attempt_conflict','checkout_expired','checkout_reconciliation_required','billing_not_configured','checkout_provider_failed','storage_unavailable']);
const SAFE_URL=/^https:\/\/(?:www\.mollie\.com\/|www\.bedrijfsgeheugen\.nl\/afsluiten\?)/;
export function createCheckoutHandler({storeFactory=createPortalProjectStore,fetchFn=globalThis.fetch,env=process.env}={}){return async request=>{
  if(request.method!=='POST')return out(405,{error:'method_not_allowed'});
  let body={};try{body=await request.json()}catch{return out(400,{error:'invalid_json'})}
  if(body.website)return out(400,{error:'invalid_request'});
  const code=String(body.plan||'').toLowerCase();
  const publicPlan=offers.saas.find(plan=>plan.code===code&&plan.direct_checkout);
  if(!publicPlan)return out(400,{error:'plan_not_self_serve'});
  const billingCycle=String(body.billing_cycle||'monthly').toLowerCase()==='yearly'?'yearly':'monthly';
  const email=String(body.email||'').trim().toLowerCase(),company=String(body.company_name||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||company.length<2)return out(400,{error:'invalid_request'});
  const config=billingConfig(env);
  if(!config.configured)return out(503,{error:'billing_not_configured'});
  let plan;try{plan=await storeFactory().getPlan(code)}catch{return out(503,{error:'storage_unavailable'})}
  if(!plan||!plan.direct_checkout||!plan.monthly_price_cents)return out(400,{error:'plan_not_self_serve'});
  // Prijsdrift: wat Mollie int moet exact gelijk zijn aan wat /prijzen toont.
  if(Number(plan.monthly_price_cents)!==publicPlan.monthly_price_cents)return out(503,{error:'catalogue_sync_required'});
  const attemptId=String(body.attempt_id||randomUUID());
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId))return out(400,{error:'invalid_attempt'});
  let response,data;
  try{
    response=await fetchFn(config.functionUrl,{method:'POST',headers:{apikey:config.token,authorization:'Bearer '+config.token,'content-type':'application/json'},body:JSON.stringify({plan:code,billing_cycle:billingCycle,email,company_name:company,attempt_id:attemptId})});
    data=await response.json().catch(()=>null);
  }catch{return out(502,{error:'checkout_provider_failed'})}
  if(response.ok&&SAFE_URL.test(String(data?.url||'')))return out(200,{url:data.url});
  const error=PASS_THROUGH.has(data?.error)?data.error:'checkout_provider_failed';
  return out([400,409,503].includes(response.status)?response.status:502,{error});
};}
export default createCheckoutHandler();
export const config={path:'/api/checkout/create'};
