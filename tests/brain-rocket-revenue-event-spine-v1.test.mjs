import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath='supabase/migrations/20261005113000_powerhouse_rocket_revenue_event_spine_v1.sql';
const edgePath='supabase/functions/powerhouse-revenue-intelligence/index.ts';
const learningPath='brain/learning/2026-10-05-rocket-revenue-event-spine-v1.json';

test('Rocket revenue spine remains one reuse-first Powerhouse lineage', async()=>{
  const [sql,edge,learningRaw]=await Promise.all([
    readFile(migrationPath,'utf8'),
    readFile(edgePath,'utf8'),
    readFile(learningPath,'utf8')
  ]);
  const learning=JSON.parse(learningRaw);
  for(const invariant of [
    'canonical_revenue_event_model',
    'identity_company_graph',
    'first_party_raw_events',
    'first_touch_multi_touch_conversion_attribution',
    'continuous_intent_opportunity_score',
    'next_best_action',
    'contextual_lineage',
    'experiment_engine',
    'revenue_writeback',
    'won_lost_learning'
  ]) assert.match(sql,new RegExp(invariant,'i'),invariant);
  assert.match(sql,/shared_lineage_non_blocking/i);
  assert.match(sql,/powerhouse_commercial_next_best_action_v5/i);
  assert.match(sql,/it is not causal proof/i);
  assert.match(edge,/rocketRevenueSpine:true/);
  assert.match(edge,/version:'1\.4\.0'/);
  assert.equal(learning.status,'ACTIVE_PREVENTION');
  assert.match(learning.decision,/reuse/i);
});

test('identity, attribution and execution truth boundaries remain explicit', async()=>{
  const sql=await readFile(migrationPath,'utf8');
  assert.match(sql,/identifier_hash/i);
  assert.match(sql,/distinct on\(entity_type,identifier_type,identifier_hash\)/i);
  assert.match(sql,/attribution_balanced/i);
  assert.match(sql,/existing consent, pressure, identity, dedupe and provider gates remain authoritative/i);
  assert.match(sql,/no_parallel_crm/i);
});
