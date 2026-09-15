import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915133500_powerhouse_commercial_closed_loop_v2.sql';

function sql(){ return readFileSync(migration,'utf8'); }

test('commercial closed loop reuses existing intelligence and learning',()=>{
  const s=sql();
  assert.match(s,/create or replace function public\.powerhouse_commercial_closed_loop_v2/i);
  assert.match(s,/powerhouse_refresh_linkedin_sales_intelligence_v1\s*\(/i);
  assert.match(s,/powerhouse_commercial_learning_cycle_v1\s*\(/i);
  assert.match(s,/powerhouse_daily_execution_guard\s*\(/i);
  assert.match(s,/powerhouse_prepare_safe_actions_v1\s*\(/i);
});

test('source freshness is internal and service-role only',()=>{
  const s=sql();
  assert.match(s,/create or replace view public\.powerhouse_source_freshness_v1/i);
  assert.match(s,/alter view public\.powerhouse_source_freshness_v1 set \(security_invoker = true\)/i);
  assert.match(s,/revoke all on table public\.powerhouse_source_freshness_v1 from public, anon, authenticated/i);
  assert.match(s,/grant select on table public\.powerhouse_source_freshness_v1 to service_role/i);
});

test('external outreach stays fail closed without explicit proof',()=>{
  const s=sql();
  assert.match(s,/exact_destination_verified/i);
  assert.match(s,/eligibility_verified/i);
  assert.match(s,/contact_pressure_ok/i);
  assert.match(s,/identity_verified/i);
  assert.match(s,/truth_verified/i);
  assert.match(s,/provider_capability_verified/i);
  assert.match(s,/linkedin_dm|email/i);
  assert.match(s,/fail_closed/i);
});

test('closed-loop evidence includes freshness and observed-revenue truth boundary',()=>{
  const s=sql();
  assert.match(s,/source_freshness/i);
  assert.match(s,/observed realized revenue/i);
  assert.match(s,/insufficient_evidence/i);
  assert.match(s,/powerhouse_daily_runs/i);
  assert.match(s,/powerhouse_sales_learnings/i);
  assert.match(s,/powerhouse_runtime_events/i);
});

test('existing scheduler is retargeted instead of creating a parallel cron',()=>{
  const s=sql();
  assert.match(s,/cron\.alter_job/i);
  assert.match(s,/powerhouse_commercial_closed_loop_v2\(\)/i);
  assert.doesNotMatch(s,/cron\.schedule\s*\(/i);
});
