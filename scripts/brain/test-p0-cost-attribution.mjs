import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20260831_brain_cost_attribution.sql';

test('P0 cost attribution is append-only, operation-linked and replay-safe',()=>{
  assert.equal(fs.existsSync(migration),true,'missing canonical cost attribution migration');
  const sql=fs.readFileSync(migration,'utf8');
  for(const required of [
    'create table if not exists public.brain_budget_usage',
    'usage_id text not null',
    'operation_id uuid not null references public.brain_operations(id)',
    'provider_usage_id text',
    'unique (usage_id)',
    'brain_record_usage',
    'USAGE_IDENTITY_CONFLICT',
    'PROVIDER_USAGE_IDENTITY_CONFLICT',
    'ADJUSTMENT_REQUIRES_ORIGINAL_USAGE',
    'revoke all on table public.brain_budget_usage from public, anon, authenticated, service_role',
    'grant select, insert on table public.brain_budget_usage to service_role',
    'enable row level security'
  ]) assert.ok(sql.includes(required),`missing cost attribution contract: ${required}`);

  assert.ok(!/grant\s+update\s+on\s+table\s+public\.brain_budget_usage/i.test(sql),'cost facts must be append-only: UPDATE grant forbidden');
  assert.ok(!/grant\s+delete\s+on\s+table\s+public\.brain_budget_usage/i.test(sql),'cost facts must be append-only: DELETE grant forbidden');
});
