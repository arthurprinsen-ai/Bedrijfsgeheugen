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
    readStates:{daily:'LIVE',experiments:'LIVE',policies:'LIVE',behavior:'LIVE'},
    daily:[{page_views:30,cta_clicks:2,qualified_leads:0,won_orders:0,revenue_eur:0}],
    experiments:[{experiment_id:'intent',status:'ACTIVE',causal_status:'insufficient_evidence',
      treatment_assignments:1,holdout_assignments:0,promotion_eligible:false,realized_revenue_eur:null}]
  });
  assert.equal(data.experiments[0].realizedRevenue,null);
  assert.equal(data.experiments[0].eligible,false);
  assert.equal(data.website.wonOrders,0);
  assert.ok(data.quality.flags.includes('EXPERIMENT_EVIDENCE_INCOMPLETE'));
});

test('CRO raw ACK Brain incident remains recorded for all future agents',()=>{
  const source=JSON.parse(readFileSync('brain/learning/2026-10-29-cro-raw-ack-5141-v1.json','utf8'));
  assert.equal(source.parent_issue,5141);
  assert.equal(source.failure_class,'CRO_TELEMETRY_SILENT_LOSS');
  assert.match(source.fingerprint,/dequeue-before-durable-ack/);
  assert.match(source.terminal_rule,/NOT_VERIFIED|CANDIDATE/i);
  const human=readFileSync('docs/development-ledger-events/2026-10-29-cro-raw-ack-5141.md','utf8');
  const skill=readFileSync('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md','utf8');
  assert.match(human,/PR #5140|#5140/);
  assert.match(skill,/bg_meting_queue_overflow_v1/);
});
