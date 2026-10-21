import {createPortalProjectStore} from './_portal-project-store.mjs';
import {createHash} from 'node:crypto';

const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const hex=bytes=>Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
async function hmac(secret,message){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(message)));
}
function safeEqual(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
async function validSignature(raw,header,secret){
  const parts=String(header||'').split(',').map(v=>v.split('='));
  const t=parts.find(([k])=>k==='t')?.[1],v1=parts.filter(([k])=>k==='v1').map(([,v])=>v);
  if(!t||!v1.length||Math.abs(Date.now()/1000-Number(t))>300)return false;
  const expected=await hmac(secret,t+'.'+raw);
  return v1.some(sig=>safeEqual(expected,sig));
}
async function stripe(path,method='GET',params=null){
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key)throw new Error('STRIPE_NOT_CONFIGURED');
  const options={method,headers:{authorization:'Bearer '+key}};
  if(params){options.headers['content-type']='application/x-www-form-urlencoded';options.body=params}
  const response=await fetch('https://api.stripe.com/v1/'+path,options);
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error('STRIPE_'+response.status);
  return data;
}
const iso=v=>Number(v)>0?new Date(Number(v)*1000).toISOString():null;
const slug=(name,id)=>{const base=String(name||'organisatie').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'organisatie';return base+'-'+String(id||'').replace(/[^a-z0-9]/gi,'').slice(-8).toLowerCase()};

export async function completeCheckout(store,session,provider=stripe){
  const subId=typeof session.subscription==='string'?session.subscription:session.subscription?.id;
  if(!subId)return;
  const existing=await store.findSubscription(subId);
  const planCode=String(session.metadata?.plan_code||'').toLowerCase();
  const plan=await store.getPlan(planCode);
  if(!plan||plan.active===false)throw new Error('INVALID_PLAN');
  if(existing&&existing.plan_code!==planCode)throw new Error('CHECKOUT_PLAN_MISMATCH');
  const company=String(session.metadata?.company_name||session.customer_details?.name||'').trim();
  const email=String(session.customer_details?.email||session.customer_email||'').trim().toLowerCase();
  if(!company||!email)throw new Error('MISSING_CUSTOMER');
  const org=existing?{id:existing.organisation_id}:await store.ensureCheckoutOrganisation(company,'checkout-'+createHash('sha256').update(session.id).digest('hex').slice(0,40));
  if(!org?.id)throw new Error('ORGANISATION_CREATE_FAILED');
  await store.ensureCustomer(org.id,company,email);
  await store.ensureInvitation(org.id,email);
  const sub=await provider('subscriptions/'+encodeURIComponent(subId));
  if(sub.id!==subId)throw new Error('SUBSCRIPTION_MISMATCH');
  await store.upsertSubscription({
    organisation_id:org.id,
    plan_code:planCode,
    provider:'stripe',
    provider_customer_id:typeof sub.customer==='string'?sub.customer:sub.customer?.id||null,
    provider_subscription_id:sub.id,
    status:sub.status||'active',
    current_period_end:iso(sub.current_period_end),
    cancel_at_period_end:Boolean(sub.cancel_at_period_end),
    metadata:{...(sub.metadata||{}),checkout_session_id:session.id,billing_cycle:session.metadata?.billing_cycle||'monthly'},
    updated_at:new Date().toISOString()
  });
  const params=new URLSearchParams();
  params.set('metadata[organisation_id]',org.id);
  params.set('metadata[plan_code]',planCode);
  await provider('subscriptions/'+encodeURIComponent(sub.id),'POST',params);
  const receipt={plan_code:planCode,email,company_name:company,state:'completed',provider:'stripe',provider_session_id:session.id,organisation_id:org.id,updated_at:new Date().toISOString()};
  // Reuse the intent primary key, including a webhook racing the create response.
  const intentId=session.metadata?.checkout_intent_id;
  if(/^[0-9a-f-]{36}$/i.test(String(intentId||'')))receipt.id=intentId;
  await store.completeCheckoutIntent(receipt);
  await store.recordCheckoutOutcome({dedupe_key:'stripe:checkout:'+session.id+':provisioned',event_type:'subscription_provisioned',source:'stripe.webhook',channel:'website',company_key:'org:'+org.id,topic_key:'saas_subscription',occurred_at:new Date().toISOString(),
    evidence:{checkout_session_id:session.id,subscription_id:sub.id,organisation_id:org.id},
    context:{plan_code:planCode,status:sub.status,billing_cycle:session.metadata?.billing_cycle||'monthly',privacy_scope:'no_pii',revenue_verified:false},state:'observed',data_quality:'OBSERVED',confidence:1});
}
async function syncSubscription(store,sub){
  const existing=await store.findSubscription(sub.id);
  if(!existing)return;
  // Stripe retries can arrive out of order. Re-read provider truth instead of
  // letting an old active event resurrect a cancelled subscription.
  const latest=await stripe('subscriptions/'+encodeURIComponent(sub.id));
  sub=latest;
  await store.patchSubscription(sub.id,{
    status:sub.status||existing.status,
    provider_customer_id:typeof sub.customer==='string'?sub.customer:sub.customer?.id||existing.provider_customer_id,
    current_period_end:iso(sub.current_period_end),
    cancel_at_period_end:Boolean(sub.cancel_at_period_end),
    metadata:sub.metadata||existing.metadata||{}
  });
}

export default async request=>{
  if(request.method!=='POST')return json(405,{error:'method_not_allowed'});
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!secret)return json(503,{error:'webhook_not_configured'});
  const raw=await request.text();
  if(!await validSignature(raw,request.headers.get('stripe-signature'),secret))return json(400,{error:'invalid_signature'});
  let event;try{event=JSON.parse(raw)}catch{return json(400,{error:'invalid_json'})}
  const store=createPortalProjectStore();
  try{
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded')await completeCheckout(store,event.data.object);
    if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted')await syncSubscription(store,event.data.object);
    return json(200,{received:true});
  }catch{
    return json(500,{error:'webhook_processing_failed'});
  }
};
export const config={path:'/api/checkout/stripe-webhook'};
