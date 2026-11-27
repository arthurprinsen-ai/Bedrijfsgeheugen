import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(
  'supabase/migrations/20261115235500_sales_action_reexecution_immutable_attempt_lineage_v1.sql','utf8');
const readmodel=readFileSync(
  'platform/portal/powerhouse-existing-integration-read-model.mjs','utf8');
const portal=readFileSync('portal-v2/control-plane-cockpit.js','utf8');

test('same protected original writer remains the ONLY SQL authority and serializes source action',()=>{
  assert.match(migration,/CREATE OR REPLACE FUNCTION public\.powerhouse_advance_sales_action_v1\(p_action_id uuid\)/i);
  assert.match(migration,/for update;/i);
  assert.match(migration,/v_action\.status='done' and v_action\.executed_at is not null/);
  assert.match(migration,/v_action\.executed_at>v_last_execution/);
  assert.match(migration,/SALES_ACTION_EXECUTION_TIME_IN_FUTURE/);
  assert.match(migration,/v_last_execution is not null/,
    'no extra cycle is created before the original first execution');
  assert.doesNotMatch(migration,/\bcreate\s+table\b|\bdrop\s+table\b|\bdelete\s+from\b/i);
  assert.doesNotMatch(migration,/\bsecurity\s+definer\b/i);
  assert.doesNotMatch(migration,/\bpg_net\b|\bhttp_post\b/i);
});

test('new reexecution uses original bounded monotonic stage writer in a distinct idempotent original cycle',()=>{
  assert.match(migration,/source_signal_ref=v_attempt_ref/);
  assert.match(migration,/v_attempt_ref := v_ref\|\|':reexecution:'\|\|/);
  assert.match(migration,/returning cycle_id into v_attempt_cycle/);
  assert.match(migration,/public\.powerhouse_append_cycle_event_v2\(/);
  assert.match(migration,/v_attempt_ref\|\|':signal'/);
  assert.match(migration,/v_attempt_ref\|\|':analysis'/);
  assert.match(migration,/v_attempt_ref\|\|':prediction'/);
  assert.match(migration,/v_attempt_ref\|\|':decision'/);
  assert.match(migration,/v_attempt_ref\|\|':execution'/);
  assert.match(migration,/v_ref\|\|':execution',v_attempt_ref\|\|':execution'/,
    'immutable historical source-ref contract stays unchanged; retry key is unique');
  assert.match(migration,/status='outcome_pending'/);
  assert.match(migration,/late_registered/);
  assert.match(migration,/truth_class','observed_action_state'/);
  assert.match(migration,/agent_attribution','UNKNOWN_NOT_ATTESTED'/);
  assert.doesNotMatch(migration,/external_provider_(?:verified|proof)/i);
});

test('admin audit treats old real writer events as historical, but later mutable action executions require a distinct event',()=>{
  assert.match(readmodel,/currentExecutionWithoutEventSample/);
  assert.match(readmodel,/CURRENT_EXECUTION_EVENT_MISSING/);
  assert.match(readmodel,/CURRENT_SALES_ACTION_EXECUTION_NOT_IMMUTABLY_LOGGED/);
  assert.match(readmodel,/currentStoredExecutionAt>=historyAt/);
  assert.match(readmodel,/latestRecordedExecutionByAction/);
  assert.match(portal,/nieuwste uitvoering zonder onveranderlijk event/);
  assert.match(portal,/externe provider-uitvoering niet bewezen/);
});

test('historical source still rejects phantom execution for missing/failed action and preserves old guard',()=>{
  const before=migration.indexOf("if v_action.status='done' and v_action.executed_at is not null");
  assert.ok(before>=0);
  assert.match(migration,/elsif v_action.status in \('error','expired','skipped'\)/);
  assert.match(migration,/return v_cycle;/);
});
