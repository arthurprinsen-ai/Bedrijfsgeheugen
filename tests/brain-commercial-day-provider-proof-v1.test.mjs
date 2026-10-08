import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  'supabase/migrations/20261008094000_commercial_day_provider_proof_brain_v1.sql',
  'utf8'
);

test('provider-proof gate requires exact Gmail provider message and thread identifiers', () => {
  assert.match(sql, /'provider_ack_verified'/);
  assert.match(sql, /'provider_readback_verified'/);
  assert.match(sql, /'provider_message_id'/);
  assert.match(sql, /'provider_thread_id'/);
  assert.match(sql, /a\.status='done'/);
  assert.match(sql, /'Europe\/Amsterdam'/);
});

test('social proof requires provider ack and post/comment identity', () => {
  assert.match(sql, /'provider_post_id'/);
  assert.match(sql, /'provider_comment_id'/);
  assert.match(sql, /'provider_object_id'/);
  assert.match(sql, /v_proven := v_email\+v_social>0/);
});

test('no-send is safe but does not close the daily commercial Brain obligation', () => {
  assert.match(sql, /v_safe_no_send := v_set>0 and v_decisions=v_set/);
  assert.match(sql, /'commercial_day_proven',v_proven/);
  assert.match(sql, /'safe_no_send_decision',v_safe_no_send/);
  assert.match(sql, /'COMMERCIAL_EXECUTION','daily-commercial-provider-proof-v1'/);
  assert.match(sql, /case when v_proven then 'FULFILLED' else 'OPEN' end/);
  assert.match(sql, /on conflict \(obligation_type,capability_id,business_entity,business_period,business_timezone\)/);
  assert.match(sql, /'daily_commercial_execution_sla','MET_ONLY_WITH_PROVIDER_PROOF'/);
});

test('canonical heartbeat says observed, not actioned, when output is not proven', () => {
  assert.match(sql, /when v_proven then 'actioned'\s+else 'observed' end/);
  assert.match(sql, /'commercial_day_proven',v_proven/);
  assert.match(sql, /v_gate->>'healthy'/);
  assert.match(sql, /v_output->>'healthy'/);
  assert.match(sql, /'scheduler_authority','NETLIFY_SUPABASE_EDGE'/);
});

test('no parallel cron, publisher, credential bypass or public auth granted', () => {
  assert.doesNotMatch(sql, /cron\.schedule|net\.http_post|grant\s+execute|grant\s+all|create\s+policy|disable\s+row\s+level\s+security/i);
  assert.doesNotMatch(sql, /insert into public\.powerhouse_sales_actions|insert into public\.powerhouse_sales_outcomes/i);
});
