import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile('supabase/migrations/20261005135948_powerhouse_one_commercial_heartbeat_terminal_lineage_v1_retry.sql','utf8');

test('commercial heartbeat is the single scheduler owner', () => {
  assert.match(sql, /powerhouse-one-commercial-heartbeat-v1/);
  assert.match(sql, /powerhouse_commercial_heartbeat_v1\(now\(\)\)/);
  for (const retired of [
    'powerhouse-human-commercial-composer-v1',
    'powerhouse-sales-machine-daily-v6',
    'powerhouse-human-sales-composer-v2',
    'powerhouse-commercial-action-closure-v1',
    'powerhouse-commercial-output-assurance-v1'
  ]) assert.match(sql, new RegExp(retired));
});

test('terminal actions receive explicit non-fabricated outcomes', () => {
  assert.match(sql, /powerhouse_terminalize_action_outcome_lineage_v1/);
  assert.match(sql, /not_executed/);
  assert.match(sql, /synthetic_business_result','?false/);
  assert.match(sql, /terminal_missing_outcome/);
  assert.match(sql, /terminal_coverage_pct/);
});

test('regression gate prevents v2 drift and secondary owners', () => {
  assert.match(sql, /powerhouse_one_commercial_decision_loop_v2/);
  assert.match(sql, /powerhouse_commercial_heartbeat_v2/);
  assert.match(sql, /direct_secondary_scheduler_owners/);
  assert.match(sql, /v_owner_count=1/);
  assert.match(sql, /v_direct_composer_owners=0/);
  assert.match(sql, /v_missing=0/);
});
