import {billingReadiness} from '../../platform/saas/billing-readiness.mjs';
import {createPortalProjectStore} from './_portal-project-store.mjs';

const out=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default async request=>{
  if(request.method!=='POST')return out(405,{error:'method_not_allowed'});
  let body={};try{body=await request.json()}catch{return out(400,{error:'invalid_json'})}
  const code=String(body.plan||'').toLowerCase();
  const email=String(body.email||'').trim().toLowerCase(),company=String(body.company_name||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||company.length<2)return out(400,{error:'invalid_request'});
  const plan=await createPortalProjectStore().getPlan(code);
  if(!plan||!plan.direct_checkout||!plan.monthly_price_cents)return out(400,{error:'plan_not_self_serve'});
  const readiness=billingReadiness();
  if(!readiness.selfServeAvailable)return out(503,{error:'billing_not_configured'});
  const key=process.env.STRIPE_SECRET_KEY;
  const origin=new URL(request.url).origin;
  const p=new URLSearchParams();
  p.set('mode','subscription');
  p.set('success_url',origin+'/afsluiten?success=1&plan='+encodeURIComponent(code));
  p.set('cancel_url',origin+'/afsluiten?cancelled=1&plan='+encodeURIComponent(code));
  p.set('customer_email',email);
  p.set('billing_address_collection','required');
  p.set('tax_id_collection[enabled]','true');
  p.set('line_items[0][quantity]','1');
  p.set('line_items[0][price_data][currency]','eur');
  p.set('line_items[0][price_data][unit_amount]',String(plan.monthly_price_cents));
  p.set('line_items[0][price_data][recurring][interval]','month');
  p.set('line_items[0][price_data][product_data][name]','Bedrijfsgeheugen '+plan.name);
  p.set('metadata[plan_code]',code);
  p.set('metadata[company_name]',company);
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/x-www-form-urlencoded'},body:p});
  const data=await response.json().catch(()=>null);
  if(!response.ok)return out(502,{error:'checkout_provider_failed'});
  return out(200,{url:data.url});
};
export const config={path:'/api/checkout/create'};