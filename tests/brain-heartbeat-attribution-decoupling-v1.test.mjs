import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration=readFileSync('supabase/migrations/20261007081000_decouple_attribution_from_commercial_heartbeat_v1.sql','utf8');
const external=JSON.parse(readFileSync('config/powerhouse-external-heartbeat-v1.json','utf8'));

const spine=migration.split('create or replace function public.powerhouse_revenue_event_spine_cycle_v1')[1]
  .split('comment on function public.powerhouse_revenue_event_spine_cycle_v1')[0];

test('commercial heartbeat spine reuses attribution cache instead of refreshing it',()=>{
  assert.match(spine,/powerhouse_revenue_attribution_cached_status_v1\(\)/);
  assert.doesNotMatch(spine,/powerhouse_refresh_revenue_attribution_snapshot_v1\(\)/);
  assert.match(spine,/attribution_refresh_in_critical_path',false/);
});

test('runtime mux avoids both legacy and external heartbeat slots',()=>{
  const muxSchedule='1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59';
  const mux=new Set(muxSchedule.split(',').map(Number));
  const legacy=new Set(Array.from({length:12},(_,i)=>i*5));
  const externalSlots=new Set(Array.from({length:12},(_,i)=>2+i*5));

  for(const minute of legacy)assert.equal(mux.has(minute),false,'legacy heartbeat collision at '+minute);
  for(const minute of externalSlots)assert.equal(mux.has(minute),false,'external heartbeat collision at '+minute);
  assert.equal(external.scheduler.schedule_utc,'2-57/5 * * * *');
  assert.match(migration,new RegExp(muxSchedule.replaceAll(',','\\,')));
});

test('attribution maintenance and moved mux tasks remain reachable off heartbeat slots',()=>{
  for(const minute of [4,19,34,49]){
    assert.notEqual(minute%5,0);
    assert.notEqual(minute%5,2);
  }
  assert.match(migration,/if m in \(4,19,34,49\) then[\s\S]*revenue-attribution-snapshot/);
  assert.match(migration,/if \(m % 5\) = 4 then[\s\S]*content-closed-loop/);
  assert.match(migration,/if \(m % 10\) = 1 then[\s\S]*data-spine-watchdog/);
});

test('cached attribution receipt remains explicit and provider-quality gates are not weakened',()=>{
  assert.match(migration,/powerhouse-revenue-attribution-cached-status-v1/);
  assert.match(migration,/critical_path_refresh',false/);
  assert.match(migration,/powerhouse_revenue_event_spine_health_v1/);
  assert.doesNotMatch(migration,/drop function public\.powerhouse_commercial_regression_gate_v1/);
});


test('fresh preview receives the production snapshot schema contract before heartbeat decoupling',()=>{
  assert.match(migration,/create table if not exists public\.powerhouse_revenue_attribution_snapshot_v1/);
  for(const column of [
    'outcome_id uuid not null',
    'touch_type text not null',
    'touch_id text not null',
    'touch_at timestamptz not null',
    'conversion_at timestamptz not null',
    "evidence jsonb not null default '{}'::jsonb",
    'refreshed_at timestamptz not null default now()'
  ]) assert.ok(migration.includes(column),column);
  assert.match(migration,/primary key\(outcome_id,touch_type,touch_id\)/);
  assert.match(migration,/idx_revenue_attribution_snapshot_company_v1/);
  assert.match(migration,/idx_revenue_attribution_snapshot_conversion_v1/);
  assert.match(migration,/enable row level security/);
  assert.match(migration,/to service_role[\s\S]*using \(true\)[\s\S]*with check \(true\)/);
});
