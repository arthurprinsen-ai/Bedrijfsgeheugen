import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCustomerAccountHandler} from '../platform/saas/customer-account-handler.mjs';

const tenant='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const request=new Request('https://www.bedrijfsgeheugen.nl/api/saas/my-account');
function make({user={id:'u1',confirmedAt:'2026-10-23T10:00:00Z'},tenantId=tenant,sub={organisation_id:tenant,plan_code:'pro',plan_name:'Pro',status:'active',entitlements:{max_users:25}},fail}={}){
 let reads=0;
 const handler=createCustomerAccountHandler({
  getUser:async()=>user,
  storeFactory:()=>({resolveTenant:async()=>{reads++;if(fail)throw Error('unavailable');return tenantId},getEntitlements:async()=>sub})
 });
 return {handler,reads:()=>reads};
}
test('denies unauthenticated, unconfirmed and unknown-tenant identities before accessing billing',async()=>{
 const anon=make({user:null});assert.equal((await anon.handler(request)).status,401);assert.equal(anon.reads(),0);
 const unconfirmed=make({user:{id:'u1'}});assert.equal((await unconfirmed.handler(request)).status,403);assert.equal(unconfirmed.reads(),0);
 assert.equal((await make({tenantId:null}).handler(request)).status,403);
});
test('denies absent, overdue, canceled, mismatched and unknown-plan subscriptions',async()=>{
 assert.equal((await make({sub:null}).handler(request)).status,402);
 for(const status of ['past_due','canceled','unpaid','incomplete']){
  assert.equal((await make({sub:{organisation_id:tenant,plan_code:'pro',status}}).handler(request)).status,402);
 }
 assert.equal((await make({sub:{organisation_id:other,plan_code:'pro',status:'active'}}).handler(request)).status,403);
 assert.equal((await make({sub:{organisation_id:tenant,plan_code:'invented',status:'active'}}).handler(request)).status,503);
});
test('active and trialing subscriptions return only server-derived access, never identity or tenant credentials',async()=>{
 for(const status of ['active','trialing']){
  const res=await make({sub:{organisation_id:tenant,plan_code:'pro',plan_name:'Pro',status,entitlements:{max_users:25}}}).handler(request);
  assert.equal(res.status,200);assert.match(res.headers.get('cache-control'),/no-store/);
  const body=await res.json();
  assert.deepEqual(body,{ready:true,plan:'pro',plan_name:'Pro',status,entitlements:{max_users:25}});
  assert.equal(JSON.stringify(body).includes(tenant),false);
 }
});
test('provider failures fail closed, and only GET is accepted',async()=>{
 assert.equal((await make({fail:true}).handler(request)).status,503);
 const h=make().handler;
 assert.equal((await h(new Request(request.url,{method:'POST'}))).status,405);
});
test('checkout redirects to the authenticated account activation journey',async()=>{
 const [checkout,page,fn]=await Promise.all([
 readFile('afsluiten.html','utf8'),
 readFile('pages/mijn-account.html','utf8'),
 readFile('netlify/functions/saas-my-account.mjs','utf8')]);
 assert.match(checkout,/pages\/mijn-account\.html\?activate=subscription/);
 assert.match(page,/\/api\/checkout\/activate/);
 assert.match(page,/\/api\/saas\/my-account/);
 assert.match(page,/\/portal-v2\//);
 assert.match(fn,/createCustomerAccountHandler/);
 assert.doesNotMatch(page,/START GRATIS ABONNEMENT/i);
});

test('customer-provided query selectors cannot change canonical tenant or plan',async()=>{
 const injected=new Request('https://www.bedrijfsgeheugen.nl/api/saas/my-account?tenant_id=22222222-2222-4222-8222-222222222222&plan=enterprise');
 const res=await make().handler(injected);
 assert.equal(res.status,200);
 const payload=await res.json();
 assert.equal(payload.plan,'pro');
 assert.equal(payload.entitlements.max_users,25);
 assert.equal(JSON.stringify(payload).includes(other),false);
});
test('invalid tenant IDs cannot call paid plan lookup',async()=>{
 const fake=make({tenantId:'user:u1'});
 const response=await fake.handler(request);
 assert.equal(response.status,403);
});
