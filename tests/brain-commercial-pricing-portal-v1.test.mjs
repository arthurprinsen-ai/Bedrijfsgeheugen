import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('commercial pricing catalog has SaaS and consulting offers',async()=>{
 const c=JSON.parse(await readFile('config/commercial-offers-v1.json','utf8'));
 assert.deepEqual(c.saas.map(p=>p.code),['starter','pro','groei','enterprise']);
 assert.equal(c.saas.find(p=>p.code==='starter').monthly_price_cents,9900);
 assert.equal(c.saas.find(p=>p.code==='pro').monthly_price_cents,29900);
 assert.equal(c.saas.find(p=>p.code==='groei').monthly_price_cents,74900);
 assert.equal(c.saas.find(p=>p.code==='enterprise').direct_checkout,false);
 assert.ok(c.services.some(s=>s.code==='directie-ai-workshop'&&s.portal_access==='pro'));
 assert.ok(c.services.some(s=>s.code==='bedrijfsgeheugen-scan'&&s.portal_access==='groei'));
});

test('pricing, checkout and portal use new plan codes',async()=>{
 const [builder,checkout,portal,access,toml]=await Promise.all([
  readFile('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8'),
  readFile('afsluiten.html','utf8'),
  readFile('portal-v2/app.js','utf8'),
  readFile('portal-v2/plan-access.js','utf8'),
  readFile('netlify.toml','utf8')
 ]);
 for(const code of ['starter','pro','groei','enterprise']) assert.match(builder,new RegExp(code));
 for(const code of ['starter','pro','groei']) assert.match(checkout,new RegExp(code));
 assert.match(portal,/fetchPortalPlan/);
 assert.match(portal,/planAllowsPage/);
 assert.match(access,/PAGE_MIN_PLAN/);
 assert.match(toml,/apply-commercial-pricing-v1\.mjs/);
});

test('portal access escalates from starter to enterprise',async()=>{
 const src=await readFile('portal-v2/plan-access.js','utf8');
 assert.match(src,/'data-ai':'pro'/);
 assert.match(src,/'agentstatus':'groei'/);
 assert.match(src,/'audittrail':'enterprise'/);
});
