import test from 'node:test';
import assert from 'node:assert/strict';
import {createCheckoutHandler} from '../netlify/functions/checkout-create.mjs';
import {billingReadiness} from '../platform/saas/billing-readiness.mjs';

const url='https://www.bedrijfsgeheugen.nl/api/checkout/create';
const payload={plan:'starter',email:'customer@example.invalid',company_name:'Test bedrijf'};
const request=body=>new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body??payload)});

test('no Stripe live authority rejects before any store or Stripe call',async()=>{
 for(const env of [{},{STRIPE_SECRET_KEY:'sk_test_fixture'},{STRIPE_WEBHOOK_SECRET:'whsec_fixture'}]){
  let stores=0,providers=0;
  const handler=createCheckoutHandler({env,storeFactory:()=>{stores++;throw Error('STORE_ACCESS_FORBIDDEN');},
   fetchFn:async()=>{providers++;throw Error('PROVIDER_ACCESS_FORBIDDEN')}});
  const response=await handler(request());
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'billing_not_configured');
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.equal(stores,0);assert.equal(providers,0);
 }
});
test('invalid plan and email retain 400 without reading store or contacting provider',async()=>{
 const handler=createCheckoutHandler({env:{},storeFactory:()=>{throw Error('STORE_FORBIDDEN');},fetchFn:async()=>{throw Error('STRIPE_FORBIDDEN')}});
 let r=await handler(request({...payload,plan:'enterprise'}));
 assert.equal(r.status,400);assert.equal((await r.json()).error,'plan_not_self_serve');
 r=await handler(request({...payload,email:'invalid-email'}));
 assert.equal(r.status,400);assert.equal((await r.json()).error,'invalid_request');
});
test('configured Stripe preserves canonical plan-store failure semantics',async()=>{
 const env={STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture'};
 assert.equal(billingReadiness(env).selfServeAvailable,true);
 let stores=0,providers=0;
 const handler=createCheckoutHandler({env,storeFactory:()=>{stores++;throw Error('STORE_DOWN')},
  fetchFn:async()=>{providers++;throw Error('PROVIDER_FORBIDDEN')}});
 const r=await handler(request());
 assert.equal(r.status,503);assert.equal((await r.json()).error,'storage_unavailable');
 assert.equal(stores,1);assert.equal(providers,0);
});
