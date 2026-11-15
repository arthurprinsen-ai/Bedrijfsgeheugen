import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../supabase/',import.meta.url);
const lock=JSON.parse(readFileSync(new URL('migration-history.lock.json',root),'utf8'));
const sql=readFileSync(new URL('migrations/20261115235900_company_intelligence_existing_daily_source_receipt_v1.sql',root),'utf8');
test('native provider applied Company OS version 873 is appended exactly once without changing old identities',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.ok(lock.applied.length>=873);
  assert.deepEqual(lock.applied[872],{version:'20261115235900',name:'company_intelligence_existing_daily_source_receipt_v1'});
  assert.deepEqual(lock.applied[871],{version:'20261115235500',name:'sales_action_reexecution_immutable_attempt_lineage_v1'});
  assert.equal(lock.applied.filter(x=>x.version==='20261115235900').length,1);
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-15T17:38:12.470160Z'));
});
test('actual migration is one service-only source observer and original owner handoff, not a second commercial dispatcher',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_run_company_intelligence_os_v1/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_run_self_improvement_layer_v1/);
  assert.match(sql,/source_event_id/);
  assert.match(sql,/ORIGINAL_COMMERCIAL_EVENT_OBSERVED/);
  assert.match(sql,/ORIGINAL_COMMERCIAL_SOURCE_EVENT_DUE/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_run_company_intelligence_os_v1\(date\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_run_self_improvement_layer_v1\(date\) TO service_role/);
  assert.doesNotMatch(sql,/v_execution:=public\.powerhouse_trigger_based_mkb_acquisition_cycle_v1/);
  assert.doesNotMatch(sql,/cron\.schedule|delete\s+from\s+supabase_migrations/i);
});
test('all executable Git SQL sources equal original native applied provider lock identities',()=>{
  const files=readdirSync(new URL('migrations/',root))
    .filter(z=>/^\d{14}_[a-z0-9_]+\.sql$/.test(z))
    .map(z=>({version:z.slice(0,14),name:z.slice(15,-4)}))
    .sort((a,b)=>a.version.localeCompare(b.version));
  assert.deepEqual(files,lock.applied);
});
