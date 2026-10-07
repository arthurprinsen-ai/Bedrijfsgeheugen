import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20261007075530_decouple_revenue_attribution_refresh_from_heartbeat_v1.sql','utf8');
const mux=fs.readFileSync('supabase/migrations/20261007063127_powerhouse_runtime_scheduler_mux_v1.sql','utf8');

test('commercial heartbeat revenue spine never refreshes attribution synchronously',()=>{
  assert.match(migration,/create or replace function public\.powerhouse_revenue_event_spine_cycle_v1/i);
  assert.match(migration,/powerhouse_sync_identity_graph_batch_v1\(25\)/);
  assert.match(migration,/powerhouse_revenue_event_spine_health_v1/);
  assert.match(migration,/critical_path_refresh',false/);
  assert.match(migration,/attribution_heartbeat_mode','read_only_snapshot/);
  assert.doesNotMatch(migration,/v_attribution\s*:=\s*public\.powerhouse_refresh_revenue_attribution_snapshot_v1\s*\(/i);
});

test('scheduler mux remains the single attribution materialization owner',()=>{
  assert.match(mux,/if m in \(7,22,37,52\) then/);
  assert.match(mux,/'revenue-attribution-snapshot'/);
  assert.match(mux,/'select public\.powerhouse_refresh_revenue_attribution_snapshot_v1\(\)'/);
  assert.match(migration,/'refresh_owner','powerhouse-runtime-scheduler-mux-v1'/);
  assert.match(migration,/'refresh_minutes',jsonb_build_array\(7,22,37,52\)/);
});

test('attribution quality truth remains fail closed in the heartbeat evidence',()=>{
  assert.match(migration,/'attribution_balanced',coalesce\(\(v_health->>'attribution_balanced'\)::boolean,true\)/);
  assert.match(migration,/'revenue_outcomes_without_touches'/);
  assert.match(migration,/'attribution_refreshed_at'/);
  assert.match(migration,/case when coalesce\(\(v_health->>'attribution_balanced'\)::boolean,true\) then 'actioned' else 'error' end/);
  assert.match(migration,/'VERIFIED'/);
});
