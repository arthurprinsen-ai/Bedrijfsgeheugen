import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCheckoutHandler} from '../netlify/functions/checkout-create.mjs';

const catalog=JSON.parse(await readFile(new URL('../config/commercial-offers-v1.json',import.meta.url),'utf8'));
const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');

test('published SaaS packages use the current canonical commercial catalogue',()=>{
  assert.deepEqual(catalog.saas.map(plan=>plan.code),['starter','pro','groei','enterprise']);
  for(const plan of catalog.saas){
    assert.ok(html.includes('<h3>'+plan.name+'</h3>'),plan.code);
    if(plan.direct_checkout){
      assert.ok(html.includes('https://www.bedrijfsgeheugen.nl/afsluiten?plan='+plan.code),plan.code);
      assert.ok(html.includes('€ '+String(plan.monthly_price_cents/100)),plan.code+' monthly price');
    }
  }
});

test('runtime price drift cannot silently charge a different price from the published catalogue',async()=>{
  for(const plan of catalog.saas.filter(plan=>plan.direct_checkout)){
    let providerCalls=0;
    const handler=createCheckoutHandler({env:{STRIPE_SECRET_KEY:'test',STRIPE_WEBHOOK_SECRET:'test'},storeFactory:()=>({getPlan:async()=>({...plan,monthly_price_cents:plan.monthly_price_cents+100})}),fetchFn:async()=>{providerCalls++}});
    const response=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/checkout/create',{method:'POST',body:JSON.stringify({plan:plan.code,email:'owner@example.test',company_name:'Acme'})}));
    assert.equal(response.status,503);assert.equal((await response.json()).error,'catalogue_sync_required');assert.equal(providerCalls,0);
  }
});

test('historical legacy plan rows do not reopen unpublished self-service packages',async()=>{
  let storeCalls=0;
  const handler=createCheckoutHandler({storeFactory:()=>{storeCalls++;return {}}});
  for(const plan of ['control','scale','enterprise']){
    const response=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/checkout/create',{method:'POST',body:JSON.stringify({plan,email:'owner@example.test',company_name:'Acme'})}));
    assert.equal(response.status,400);
  }
  assert.equal(storeCalls,0);
});
