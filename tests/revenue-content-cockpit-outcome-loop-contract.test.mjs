import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../supabase/migrations/20260917135656_close_cockpit_execution_outcome_feedback_loop_v2.sql', import.meta.url),
  'utf8',
);

test('cockpit zero revenue is not treated as realized revenue', () => {
  assert.match(sql, /v_has_realized_revenue boolean := coalesce\(p_revenue_eur,0\) > 0/);
  assert.match(sql, /v_revenue numeric := coalesce\(p_revenue_eur,0\)/);
});

test('realized revenue aliases used by the cockpit are accepted', () => {
  assert.match(sql, /order_won/);
  assert.match(sql, /revenue_observed/);
});

test('human cockpit outcomes are persisted as first-class feedback', () => {
  assert.match(sql, /powerhouse_record_human_feedback_v1/);
  assert.match(sql, /cockpit-outcome:/);
});

test('defer and no-response remain waiting instead of false completion', () => {
  assert.match(sql, /'waiting','no_response','no_reply','defer','deferred','not_now'/);
  assert.match(sql, /then 'waiting'/);
});
