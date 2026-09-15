import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915143000_powerhouse_revenue_acceleration_mode_v1.sql', import.meta.url);
const sql = fs.readFileSync(migrationUrl, 'utf8');

test('revenue acceleration mode reuses canonical Powerhouse cycles', () => {
  assert.match(sql, /powerhouse_revenue_acceleration_cycle_v1/i);
  assert.match(sql, /powerhouse_commercial_learning_cycle_v1/i);
  assert.match(sql, /powerhouse_prepare_safe_actions_v1/i);
  assert.match(sql, /powerhouse_enrich_outbound_execution_gates_v1/i);
  assert.match(sql, /powerhouse_promote_commercial_learnings_v1/i);
  assert.doesNotMatch(sql, /\bmake\b/i);
});

test('all six outbound hard gates remain mandatory', () => {
  for (const gate of [
    'exact_destination_verified',
    'eligibility_verified',
    'contact_pressure_ok',
    'identity_verified',
    'truth_verified',
    'provider_capability_verified',
  ]) assert.match(sql, new RegExp(gate, 'i'));
  assert.match(sql, /outbound_daily_limit[^\n]*5/i);
});

test('gmail uses observed provider readback and linkedin remains fail closed without one', () => {
  assert.match(sql, /provider_readback_verified/i);
  assert.match(sql, /source\s*=\s*'gmail'/i);
  assert.match(sql, /source\s*=\s*'linkedin'/i);
  assert.match(sql, /gmail-outbound-replies/i);
  assert.match(sql, /linkedin-outbound/i);
});

test('commercial learnings promote and weaken only from evidence thresholds', () => {
  assert.match(sql, /'PROVEN'/);
  assert.match(sql, /'WEAKENING'/);
  assert.match(sql, /'REJECTED'/);
  assert.match(sql, /sample_size\s*>=\s*5/i);
  assert.match(sql, /confidence\s*>=\s*0\.70/i);
  assert.match(sql, /baseline_definition/i);
  assert.match(sql, /commercial_learning_status_changed/i);
});

test('revenue acceleration is hourly, fail closed, service-role only and writes learning evidence', () => {
  assert.match(sql, /powerhouse-revenue-acceleration-v1/i);
  assert.match(sql, /'32 \* \* \* \*'/);
  assert.match(sql, /revenue_acceleration_cycle/i);
  assert.match(sql, /learning:revenue-acceleration-gate-materialization-v1/i);
  assert.match(sql, /revoke execute on function public\.powerhouse_revenue_acceleration_cycle_v1\(date\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.powerhouse_revenue_acceleration_cycle_v1\(date\) to service_role/i);
});