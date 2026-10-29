import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import handler, { projectOtherData } from '../netlify/functions/powerhouse-cro-other-data.mjs';

test('CRO owner API fails closed without a JWT and on unsafe method',async()=>{
  const unauth=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/powerhouse-cro-other-data'));
  assert.equal(unauth.status,401);
  assert.equal((await unauth.json()).error,'UNAUTHENTICATED');
  const wrongMethod=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/powerhouse-cro-other-data',{method:'POST'}));
  assert.equal(wrongMethod.status,405);
});
test('only global owner can read and query is scoped to canonical CRO tenant',()=>{
  const source=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
  assert.match(source,/isPowerhouseAdmin\(user/);
  assert.match(source,/tenant_id=eq\./);
  assert.match(source,/const allowedTenant='canonical'/);
  assert.doesNotMatch(source,/SELECT \*/i);
  assert.match(source,/private, no-store/);
});
test('source errors, truncation and unknown human counts are not reported green',()=>{
  const data=projectOtherData({
    readStates:{daily:'UNAVAILABLE',experiments:'TRUNCATED',policies:'LIVE'},
    policies:[{experiment_key:'one',status:'active',min_matured_per_arm:20}],
    experiments:[{experiment_id:'untrusted',status:'COMPLETE',realized_revenue_eur:123456}]
  });
  assert.equal(data.status,'PARTIAL');
  assert.equal(data.website,null);
  assert.equal(data.experiments,null);
  assert.equal(data.sources.experiments.status,'TRUNCATED');
  assert.equal(data.quality.deliveryAcknowledgement,'UNVERIFIED');
  assert.equal(data.quality.botFiltering,'UNKNOWN_IN_THIS_PROJECTION');
  assert.ok(data.quality.flags.includes('WEBSITE_DAILY_SOURCE_UNAVAILABLE'));
});
test('observed form intent does not imply verified revenue or causal success',()=>{
  const data=projectOtherData({
    readStates:{daily:'LIVE',experiments:'LIVE',policies:'LIVE'},
    daily:[{page_views:30,cta_clicks:2,qualified_leads:0,won_orders:0,revenue_eur:0}],
    experiments:[{experiment_id:'intent',status:'ACTIVE',causal_status:'insufficient_evidence',
      treatment_assignments:1,holdout_assignments:0,promotion_eligible:false,realized_revenue_eur:null}]
  });
  assert.equal(data.experiments[0].realizedRevenue,null);
  assert.equal(data.experiments[0].eligible,false);
  assert.equal(data.website.wonOrders,0);
  assert.ok(data.quality.flags.includes('EXPERIMENT_EVIDENCE_INCOMPLETE'));
});

test('provider SDK is deferred until after rejection of missing JWT; no unauthenticated import',async()=>{
 const source=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 assert.doesNotMatch(source,/^import\s+.*?@netlify\/identity/m);
 assert.match(source,/await import\('@netlify\/identity'\)/);
 const denied=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/powerhouse-cro-other-data'));
 assert.equal(denied.status,401);
 assert.equal((await denied.json()).error,'UNAUTHENTICATED');
});
