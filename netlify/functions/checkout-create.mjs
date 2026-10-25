import {billingReadiness} from '../../platform/saas/billing-readiness.mjs';
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
  // No Stripe authority means no customer-storage or payment-provider access.
  // Keep cheap public plan and contact-input validation before this gate.
  const readiness=billingReadiness(env);
  if(!readiness.selfServeAvailable)return out(503,{error:'billing_not_configured'});
  let store,plan;try{store=storeFactory();plan=await store.getPlan(code)}catch{return out(503,{error:'storage_unavailable'})}
  if(!plan||!plan.direct_checkout||!plan.monthly_price_cents)return out(400,{error:'plan_not_self_serve'});
  if(Number(plan.monthly_price_cents)!==publicPlan.monthly_price_cents)return out(503,{error:'catalogue_sync_required'});
  const key=env.STRIPE_SECRET_KEY;
  const origin='https://www.bedrijfsgeheugen.nl';
  const attemptId=String(body.attempt_id||randomUUID());
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId))return out(400,{error:'invalid_attempt'});
  let intent;
  try{
    intent=await store.ensureCheckoutIntent({id:attemptId,plan_code:code,email,company_name:company,state:'created',provider:'stripe'});
    if(!intent||intent.plan_code!==code||intent.email!==email||intent.company_name!==company)return out(409,{error:'checkout_attempt_conflict'});
  }catch{return out(503,{error:'storage_unavailable'})}
  if(intent.provider_session_id){
    try{
      const previous=await fetchFn('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(intent.provider_session_id),{headers:{authorization:'Bearer '+key}});
      const session=await previous.json();
      if(!previous.ok||session.id!==intent.provider_session_id)throw Error('SESSION_UNAVAILABLE');
      if(session.status==='complete')return out(200,{url:origin+'/afsluiten?success=1&session_id='+encodeURIComponent(session.id)});
      if(session.status==='expired')return out(409,{error:'checkout_expired'});
      if(session.status!=='open'||session.metadata?.billing_cycle!==billingCycle||!/^https:\/\/checkout\.stripe\.com\//.test(String(session.url||'')))return out(409,{error:'checkout_attempt_conflict'});
      return out(200,{url:session.url});
    }catch{return out(503,{error:'checkout_reconciliation_required'})}
  }
  // Stripe may prune idempotency keys after 24 hours. An unacknowledged old
  // attempt must be reconciled, never silently turned into a second purchase.
  if(intent.created_at&&Date.now()-Date.parse(intent.created_at)>23*3600000)return out(409,{error:'checkout_reconciliation_required'});
  const p=new URLSearchParams();
  p.set('mode','subscription');
  p.set('success_url',origin+'/afsluiten?success=1&session_id={CHECKOUT_SESSION_ID}&plan='+encodeURIComponent(code)+'&billing='+encodeURIComponent(billingCycle));
  p.set('cancel_url',origin+'/afsluiten?cancelled=1&plan='+encodeURIComponent(code)+'&billing='+encodeURIComponent(billingCycle));
  p.set('customer_email',email);
  p.set('billing_address_collection','required');
  p.set('tax_id_collection[enabled]','true');
  p.set('line_items[0][quantity]','1');
  p.set('line_items[0][price_data][currency]','eur');
  const unitAmount=billingCycle==='yearly'?Number(plan.monthly_price_cents)*10:Number(plan.monthly_price_cents);
  p.set('line_items[0][price_data][unit_amount]',String(unitAmount));
  p.set('line_items[0][price_data][recurring][interval]',billingCycle==='yearly'?'year':'month');
  p.set('line_items[0][price_data][product_data][name]','Bedrijfsgeheugen '+plan.name);
  p.set('metadata[plan_code]',code);
  p.set('metadata[billing_cycle]',billingCycle);
  p.set('metadata[company_name]',company);
  p.set('client_reference_id',attemptId);
  for(const [name,value] of Object.entries({plan_code:code,billing_cycle:billingCycle,company_name:company,checkout_intent_id:attemptId})){
    p.set('metadata['+name+']',value);p.set('subscription_data[metadata]['+name+']',value);
  }
  let response;try{response=await fetchFn('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/x-www-form-urlencoded','idempotency-key':'bg-checkout-'+attemptId},body:p})}catch{return out(502,{error:'checkout_provider_failed'})}
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.id||!/^https:\/\/checkout\.stripe\.com\//.test(String(data.url||'')))return out(502,{error:'checkout_provider_failed'});
  try{const saved=await store.openCheckoutIntent(attemptId,data.id);if(!saved||saved.provider_session_id!==data.id)throw Error('CHECKOUT_NOT_STORED')}catch{return out(503,{error:'storage_unavailable'})}
  return out(200,{url:data.url});
};}
export default createCheckoutHandler();
export const config={path:'/api/checkout/create'};
