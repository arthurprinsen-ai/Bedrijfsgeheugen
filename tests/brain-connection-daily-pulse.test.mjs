import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync('supabase/migrations/20261011132000_powerhouse_connection_daily_pulse_v1.sql','utf8');
test('reuses canonical connection and enrichment state, no parallel CRM',()=>{
  assert.match(sql,/public\.bg_connecties/);
  assert.match(sql,/public\.powerhouse_connection_enrichment_state_v1/);
  assert.doesNotMatch(sql,/create\s+table\s/i);
});
test('does not create duplicate scheduler or provider sender',()=>{
  assert.match(sql,/cron\.alter_job\(\s*138\s*,/);
  assert.match(sql,/2,17,32,47 \* \* \* \*/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/);
  assert.doesNotMatch(sql,/net\.http_post\s*\(/);
});
test('all reviewed connection decisions are date-stamped and gated',()=>{
  assert.match(sql,/daily_decision/);
  assert.match(sql,/p_run_date::text/);
  assert.match(sql,/existing_canonical_channel_and_consent_gates/);
  assert.match(sql,/'direct_provider_action_executed',false/);
  assert.match(sql,/'fresh_external_lookup_performed',false/);
});
test('review and enrichment are bounded and idempotently keyed',()=>{
  assert.match(sql,/least\(coalesce\(p_batch_size,500\),500\)/);
  assert.match(sql,/pg_try_advisory_xact_lock/);
  assert.match(sql,/source_snapshot\s*#>>\s*'\{daily_decision,run_date\}'\s+is distinct from/);
});
test('low-quality and paused leads do not auto-send messages',()=>{
  assert.match(sql,/NO_ACTION_HOLD/);
  assert.match(sql,/CONTEXT_RESEARCH_REVIEW/);
  assert.match(sql,/NO_ACTION/);
  assert.doesNotMatch(sql,/perform\s+public\.(?:powerhouse_send|send_email)/i);
});
test('keep existing identity graph cadence and separate error guards',()=>{
  assert.match(sql,/extract\(minute from now\(\)\)::integer=32/);
  assert.match(sql,/perform public\.powerhouse_sync_identity_graph_batch_v1\(100\)/);
  assert.match(sql,/exception when others then/);
});
