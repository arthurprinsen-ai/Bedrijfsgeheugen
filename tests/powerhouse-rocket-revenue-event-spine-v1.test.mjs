import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath='supabase/migrations/20261005113000_powerhouse_rocket_revenue_event_spine_v1.sql';
const edgePath='supabase/functions/powerhouse-revenue-intelligence/index.ts';

test('revenue spine reuses canonical Powerhouse stores', async()=>{
  const sql=await readFile(migrationPath,'utf8');
  assert.match(sql,/powerhouse_revenue_event_spine_v1/i);
  assert.match(sql,/from public\.growth_events/i);
  assert.match(sql,/from public\.powerhouse_sales_actions/i);
  assert.match(sql,/from public\.powerhouse_sales_outcomes/i);
  assert.doesNotMatch(sql,/create\s+table[^;]+parallel_crm/i);
  assert.match(sql,/no_parallel_crm/i);
});

test('identity graph is privacy-bounded and idempotent', async()=>{
  const sql=await readFile(migrationPath,'utf8');
  assert.match(sql,/create table if not exists public\.powerhouse_identity_graph_v1/i);
  assert.match(sql,/identifier_hash/i);
  assert.match(sql,/md5\(lower\(trim/i);
  assert.match(sql,/distinct on\(entity_type,identifier_type,identifier_hash\)/i);
  assert.match(sql,/identifier values are not duplicated/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/to service_role/i);
});

test('multi-touch attribution is position based and revenue-balanced', async()=>{
  const sql=await readFile(migrationPath,'utf8');
  assert.match(sql,/powerhouse_revenue_attribution_v2/i);
  assert.match(sql,/position_based_20_40_40/i);
  assert.match(sql,/when touch_count=1 then 1\.0/i);
  assert.match(sql,/when touch_count=2 then \.5/i);
  assert.match(sql,/when rn_first=1 then \.20/i);
  assert.match(sql,/when rn_last=1 then \.40/i);
  assert.match(sql,/attribution_balanced/i);
  assert.match(sql,/it is not causal proof/i);
});

test('intent and next-best-action extend rather than replace existing intelligence', async()=>{
  const sql=await readFile(migrationPath,'utf8');
  assert.match(sql,/powerhouse_prospect_intent_score_v1/i);
  assert.match(sql,/intent_score/i);
  assert.match(sql,/hot/i);
  assert.match(sql,/warm/i);
  assert.match(sql,/powerhouse_next_best_action_contract_v1/i);
  assert.match(sql,/powerhouse_commercial_next_best_action_v5/i);
  assert.match(sql,/existing consent, pressure, identity, dedupe and provider gates remain authoritative/i);
});

test('orchestration is non-blocking and exposes all ten capabilities', async()=>{
  const sql=await readFile(migrationPath,'utf8');
  for(const capability of [
    'canonical_revenue_event_model','identity_company_graph','first_party_raw_events',
    'first_touch_multi_touch_conversion_attribution','continuous_intent_opportunity_score',
    'next_best_action','contextual_lineage','experiment_engine','revenue_writeback','won_lost_learning'
  ]) assert.match(sql,new RegExp(capability,'i'));
  assert.match(sql,/shared_lineage_non_blocking/i);
  assert.match(sql,/independent idempotent schedulers/i);
});

test('Revenue Intelligence edge function exposes the canonical spine', async()=>{
  const src=await readFile(edgePath,'utf8');
  assert.match(src,/version:'1\.4\.0'/);
  assert.match(src,/rocketRevenueSpine:true/);
  assert.match(src,/powerhouse_revenue_attribution_snapshot_v1/);
  assert.match(src,/powerhouse_revenue_event_spine_v1/);
  assert.match(src,/powerhouse_prospect_intent_score_v1/);
  assert.match(src,/powerhouse_next_best_action_contract_v1/);
  assert.match(src,/runRocketSpine\(date\)/);
  assert.match(src,/route==='event-spine'/);
  assert.match(src,/route==='intent'/);
  assert.match(src,/route==='next-best-actions'/);
  assert.match(src,/route==='spine-health'/);
});
