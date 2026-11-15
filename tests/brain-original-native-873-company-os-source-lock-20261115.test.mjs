import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const root=new URL('../supabase/',import.meta.url);
const lock=JSON.parse(readFileSync(new URL('migration-history.lock.json',root),'utf8'));
const sql=readFileSync(new URL('migrations/20261115235900_company_intelligence_existing_daily_source_receipt_v1.sql',root),'utf8');

test('original provider #873 exact native version/name is appended after immutable 872 without inventing future rows',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.equal(lock.applied.length,873);
  assert.deepEqual(lock.applied[872],{
    version:'20261115235900',name:'company_intelligence_existing_daily_source_receipt_v1'
  });
  assert.equal(lock.applied[871].version,'20261115235500');
  assert.equal(lock.applied.filter(x=>x.version==='20261115235900').length,1);
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-15T17:37:27.655996Z'));
});
test('native #873 has executable private original observer SQL and no second provider writer',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_run_company_intelligence_os_v1/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_run_self_improvement_layer_v1/);
  assert.match(sql,/event_type='trigger_based_mkb_acquisition_cycle'/);
  assert.match(sql,/original_source_event_id/);
  assert.match(sql,/'company-intelligence-os:'\|\|p_run_date::text/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_run_company_intelligence_os_v1\(date\) FROM PUBLIC, anon, authenticated/i);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_run_company_intelligence_os_v1\(date\) TO service_role/i);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_run_self_improvement_layer_v1\(date\) FROM PUBLIC, anon, authenticated/i);
  assert.doesNotMatch(sql,/v_execution\s*:=\s*public\.powerhouse_trigger_based_mkb_acquisition_cycle_v1\s*\(|cron\.schedule|net\.http_post|delete\s+from\s+supabase_migrations/i);
});
test('all 873 original provider-applied versions have exactly matching executable Git migration SQL',()=>{
  const source=readdirSync(new URL('migrations/',root))
    .filter(name=>/^\d{14}_[a-z0-9_]+\.sql$/.test(name))
    .map(name=>({version:name.slice(0,14),name:name.slice(15,-4)}))
    .sort((a,b)=>a.version.localeCompare(b.version));
  assert.deepEqual(source,lock.applied);
});
