import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration=readFileSync(
  'supabase/migrations/20261113164000_original_seo_one_chain_outcome_assurance_v2.sql','utf8');
const skill=readFileSync('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md','utf8');

test('SEO assurance consumes exactly the ORIGINAL daily Brain handoff and its revision ACK',()=>{
  assert.match(migration,/obligation_type='GROWTH_SOURCE_DAILY_HANDOFF'/);
  assert.match(migration,/capability_id='website-seo-dataforseo-ai-cro'/);
  assert.match(migration,/consumer_ack,consumed_revision/);
  assert.match(migration,/analysis,source_revision/);
  assert.match(migration,/v_ack_revision=v_source_revision/);
  assert.match(migration,/consumer_ack,accepted/);
  assert.match(migration,/v_original\.state='FULFILLED'/);
});

test('recommendations cannot make SEO one-chain guard green without production result',()=>{
  assert.match(migration,/v_guard := \(v_recs>0 OR v_forecasts>0\)/);
  for (const check of ['v_ack_exact','v_execution_proven','v_measurement_proven',
    'v_outcome_proven','v_learning_proven']) {
    assert.match(migration,new RegExp('AND '+check+'\\b'));
  }
  assert.match(migration,/production_readback,deploy_sha/);
  assert.match(migration,/production_readback,canonical_url/);
  assert.match(migration,/measurement,source_event_id/);
  assert.match(migration,/measurement,source_revision/);
  assert.match(migration,/learning,next_original_run_readback_verified/);
  assert.match(migration,/v_guard := coalesce\(v_guard,false\)/);
});

test('missing sources are UNKNOWN and stale SEO never passes full handoff assurance',()=>{
  assert.match(migration,/tenant_id='canonical'/);
  assert.match(migration,/tenant_id='bedrijfsgeheugen'/);
  assert.match(migration,/v_missing_sources=0/);
  assert.match(migration,/quality LIKE 'MISSING%'/);
  assert.match(migration,/quality LIKE 'STALE%'/);
  assert.match(migration,/quality LIKE 'AWAITING%'/);
  assert.match(migration,/keyword_rows_7d/);
  assert.match(migration,/v_source_rows>=6/);
});

test('existing SEO scheduler and canonical receipts stay exclusive',()=>{
  assert.match(migration,/REVOKE ALL ON FUNCTION public\\.powerhouse_refresh_seo_assurance_v1\\(timestamptz\\)/);
  assert.match(migration,/FROM PUBLIC, anon, authenticated/);
  assert.match(migration,/powerhouse_record_loop_stage_v1/);
  assert.match(migration,/seo-opportunity-resolver/);
  assert.doesNotMatch(migration,/\bcron\.(?:schedule|alter_job|unschedule)\s*\(/i);
  assert.doesNotMatch(migration,/\bcreate\s+(?:table|policy|trigger)\b/i);
  assert.doesNotMatch(migration,/\bgrant\s+/i);
  assert.match(skill,/P0_20261113_SEO_ONE_CHAIN_ORIGINAL_HANDOFF/);
});
