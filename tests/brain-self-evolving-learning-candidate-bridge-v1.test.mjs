import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {POWERHOUSE_SYSTEM_MAP} from '../platform/system-map/canonical-system-map.mjs';

const sql = fs.readFileSync('supabase/migrations/20261008162000_self_evolving_learning_candidate_bridge_v1.sql', 'utf8');
const skill = fs.readFileSync('.agents/skills/powerhouse-self-improvement-layer/SKILL.md', 'utf8');
const ledger = JSON.parse(fs.readFileSync('brain/learning/2026-10-08-self-evolving-learning-candidate-bridge-v1.json','utf8'));

test('existing daily owner is extended, never a new cron/parallel store', () => {
  assert.match(sql, /create or replace function public\.powerhouse_run_self_improvement_layer_v1/);
  assert.doesNotMatch(sql, /cron\.schedule|create table|create materialized view/i);
  assert.match(sql, /from public\.powerhouse_learning_compiler_queue_v1/);
  assert.match(sql, /insert into public\.powerhouse_optimization_candidate_v1/);
  assert.match(sql, /from public\.powerhouse_compound_intelligence_v1/);
});

test('only verified learning with regression and evidence enters candidate pipeline', () => {
  for (const guard of [
    /l\.source_type = 'quality_event'/,
    /l\.compiler_state = 'READY'/,
    /l\.verified_evidence is true/,
    /l\.regression_proven is true/,
    /l\.material is true/,
    /q\.production_evidence_ref/,
    /q\.regression_guard_ref/
  ]) assert.match(sql, guard);
  assert.match(sql, /not exists\s*\(/);
  assert.match(sql, /on conflict \(source_key\) do nothing/);
  assert.match(sql, /limit 3/);
  assert.match(sql, /get diagnostics v_candidates_created = row_count/);
});

test('candidates cannot become shipping, approved, causal or economic proof', () => {
  assert.match(sql, /0, 'review_required'/);
  assert.match(sql, /'candidate', 'BG169'/);
  assert.match(sql, /'provider_dispatch_authorized', false/);
  assert.match(sql, /'direct_production_mutation', false/);
  assert.match(sql, /'regression_proven', false/);
  assert.match(sql, /'causal_effect_verified', false/);
  assert.match(sql, /'predicted_value_eur', null/);
  assert.match(sql, /'measured_improvement', null/);
  assert.match(sql, /revoke execute[\s\S]+from public, anon, authenticated/);
  assert.doesNotMatch(sql, /grant execute[\s\S]+to anon|grant execute[\s\S]+to authenticated/i);
});

test('same-lineage policy, ledger and System Map record the real authority', () => {
  const capability = POWERHOUSE_SYSTEM_MAP.runtimeCapabilities.find(x=>x.id==='self-evolving-learning-candidate-bridge-v1');
  assert.ok(capability,'canonical System Map must register the bridge');
  assert.match(JSON.stringify(capability),/powerhouse_optimization_candidate_v1/);
  assert.match(skill,/self-evolving-learning-candidate-bridge-20261008-v1/);
  assert.equal(ledger.status,'CANDIDATE_PROTECTED_DELIVERY');
  assert.equal(ledger.unknown_is_not_green,true);
});
