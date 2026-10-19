import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const earlierPath = 'supabase/migrations/20261006085100_legacy_cron_replay_preconditions.sql';
const gatePath = 'supabase/migrations/20261006085416_stagger_cron_database_pressure_v1.sql';
const sql = readFileSync(earlierPath,'utf8');
const gate = readFileSync(gatePath,'utf8');

test('additive precondition precedes immutable historical cron pressure migration',()=>{
  assert.ok(earlierPath<gatePath);
  assert.match(gate,/powerhouse-identity-graph-v1/);
  assert.match(sql,/DO \$replay_preconditions\$/);
  assert.doesNotMatch(sql,/supabase_migrations\.schema_migrations/i);
  assert.doesNotMatch(sql,/delete\s+from\s+cron\.job|cron\.unschedule|cron\.alter_job/i);
});

test('only 3 missing legacy authorities are restored with real work, guarded against production canonical mux',()=>{
  assert.match(sql,/to_regprocedure\('public\.powerhouse_runtime_scheduler_mux_v1\(timestamptz\)'\) IS NOT NULL/);
  assert.match(sql,/RETURN;/);
  const scheduled = [...sql.matchAll(/PERFORM\s+cron\.schedule\(/g)];
  assert.equal(scheduled.length,3);
  for(const n of [
    'powerhouse-identity-graph-v1',
    'powerhouse-connection-activation-daily-v1',
    'powerhouse-content-orchestrator-daily-v1'
  ]){
    assert.match(sql,new RegExp("NOT EXISTS \\(SELECT 1 FROM cron\\.job WHERE jobname='"+n+"'\\)"));
    assert.match(sql,new RegExp("cron\\.schedule\\(\\s*'"+n+"'"));
  }
  assert.match(sql,/powerhouse_sync_identity_graph_batch_v1\(100\)/);
  assert.match(sql,/powerhouse_prepare_connection_activation_v1/);
  assert.match(sql,/powerhouse_content_closed_loop_tick_v1/);
  assert.doesNotMatch(sql,/select 1\s*;/i);
});

test('historical asserted jobs remain protected and never auto-green',()=>{
  assert.match(sql,/CANONICAL_SCHEDULER_PRESENT: skipping historical job bootstrap/);
  assert.match(gate,/cron\.alter_job/);
  assert.match(gate,/powerhouse-identity-graph-v1/);
});
