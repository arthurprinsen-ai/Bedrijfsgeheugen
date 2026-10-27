import {billingReadiness,callCheckoutEdge} from '../../platform/saas/billing-readiness.mjs';
import {createPortalProjectStore} from './_portal-project-store.mjs';
import {randomUUID} from 'node:crypto';
import offers from '../../config/commercial-offers-v1.json' with {type:'json'};

const out=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
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
  // No Supabase edge authority means no customer-storage or payment-provider access.
  // Keep cheap public plan and contact-input validation before this gate.
  const readiness=billingReadiness(env);
  if(!readiness.selfServeAvailable)return out(503,{error:'billing_not_configured'});
  let store,plan;try{store=storeFactory();plan=await store.getPlan(code)}catch{return out(503,{error:'storage_unavailable'})}
  if(!plan||!plan.direct_checkout||!plan.monthly_price_cents)return out(400,{error:'plan_not_self_serve'});
  if(Number(plan.monthly_price_cents)!==publicPlan.monthly_price_cents)return out(503,{error:'catalogue_sync_required'});
  const attemptId=String(body.attempt_id||randomUUID());
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId))return out(400,{error:'invalid_attempt'});
  let intent;
  try{
    intent=await store.ensureCheckoutIntent({id:attemptId,plan_code:code,email,company_name:company,state:'created',provider:'mollie'});
    if(!intent||intent.plan_code!==code||intent.email!==email||intent.company_name!==company)return out(409,{error:'checkout_attempt_conflict'});
  }catch{return out(503,{error:'storage_unavailable'})}
  // Mollie customer, first payment (creates the mandate) and the recurring subscription are
  // handled by the bg-mollie-checkout edge function; the Mollie key never reaches Netlify.
  let result;
  try{result=await callCheckoutEdge('',{method:'POST',body:{plan:code,billing_cycle:billingCycle,email,company_name:company,attempt_id:attemptId},fetchFn,env})}
  catch{return out(502,{error:'checkout_provider_failed'})}
  const url=String(result.data?.url||'');
  if(result.ok&&/^https:\/\/(www\.mollie\.com|bedrijfsgeheugen\.nl|www\.bedrijfsgeheugen\.nl)\//.test(url))return out(200,{url});
  const known=['checkout_expired','checkout_attempt_conflict','checkout_reconciliation_required','plan_not_self_serve','invalid_request'];
  const error=String(result.data?.error||'');
  if(known.includes(error)&&[400,409].includes(result.status))return out(result.status,{error});
  return out(result.status===503?503:502,{error:result.status===503?'billing_not_configured':'checkout_provider_failed'});
};}
export default createCheckoutHandler();
export const config={path:'/api/checkout/create'};
