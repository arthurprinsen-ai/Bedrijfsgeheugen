import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const learningPath='brain/learning/2026-11-12-seo-money-page-trust-v1.json';
const fingerprint='seo|original-money-page-exact-owner-ack|20261113-v1';
const expectedSha='8ff9f1a1084dff5973b69e0cf1877592a5d02b5345932659ac094af91a8f9b34';

test('original site owner receipt is evidenced, but real customer outcomes stay open',async()=>{
 const o=JSON.parse(await read(learningPath));
 assert.equal(o.status,'WEBSITE_DELIVERED_PROVEN_CRO_OUTCOME_OPEN');
 assert.equal(o.evidence.original_owner_execution_proven,true);
 assert.equal(o.evidence.commercial_outcome_proven,false);
 assert.equal(o.evidence.original_2026_11_13_producer_consumer_heartbeat_sha,expectedSha);
 assert.equal(o.evidence.netlify_provider.state,'READY');
 assert.equal(o.evidence.netlify_provider.current_main_sha,'462eca7c5a36565a449f1a28a1a344245ad4dd60');
 assert.equal(o.evidence.netlify_provider.canonical_pages_verified,2);
 assert.equal(o.evidence.current_date_recommendations.length,2);
 assert.ok(o.evidence.current_date_recommendations.every(x=>x.status==='done' && x.stage==='WEBSITE_CHANGE_LIVE_PROVEN_METRICS_DUE' && x.public_http_status===200 && x.request_id));
 assert.equal(o.evidence.historical_duplicate_reconciliation.count,4);
 assert.equal(o.evidence.historical_duplicate_reconciliation.status,'skipped');
 assert.equal(o.evidence.historical_duplicate_reconciliation.stage,'SUPERSEDED_BY_VERIFIED_CANONICAL_OWNER_EXECUTION');
 assert.equal(o.evidence.original_revenue_order_conversion_attribution_proven,false);
 assert.equal(o.evidence.actual_holdout_treatment_experiment_proven,false);
 assert.equal(o.delivery.cro_effect,'OPEN');
 assert.equal(o.delivery.commercial_outcome,'OPEN');
 assert.equal(o.delivery.causal_cro,'EVIDENCE_DUE');
});

test('original SEO agent and two existing skills explicitly enforce same-SHA owner ACK without fake revenue',async()=>{
 const [a,s1,s2]=await Promise.all([
  read('platform/agents/agent-team.mjs'),
  read('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md'),
  read('.agents/skills/seo-revenue-growth/SKILL.md')
 ]);
 assert.match(a,/verify-original-money-owner-two-delivered-four-superseded-idempotent-source-sha-consumer-ack-with-metrics-due/);
 assert.ok(s1.includes(fingerprint));
 assert.ok(s2.includes('seo|owner-delivered-not-causal-revenue|20261113-v1'));
 assert.match(s1,/powerhouse_daily_source_consume_v1/);
 assert.match(s1,/powerhouse_commercial_intelligence_heartbeat_v1/);
 assert.match(s2,/SUPERSEDED_BY_VERIFIED_CANONICAL_OWNER_EXECUTION/);
 assert.match(s2,/ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME/);
});

test('existing resolver cross-day canonical dedupe stays in same original owner, never second job',async()=>{
 const [index,handoff]=await Promise.all([
  read('supabase/functions/powerhouse-seo-opportunity-resolver/index.ts'),
  read('supabase/functions/powerhouse-seo-opportunity-resolver/money-page-handoff.mjs')
 ]);
 assert.match(index,/reconcileOriginalSeoMoneyHandoffs/);
 assert.match(index,/owner_handoffs_suppressed/);
 assert.match(handoff,/ORIGINAL_OWNER_HANDOFF_STILL_UNCONSUMED/);
 assert.match(handoff,/ORIGINAL_OWNER_SOURCE_UNCHANGED/);
 assert.doesNotMatch(index,/new\s+\w*Scheduler|cron\.schedule\(/);
});
