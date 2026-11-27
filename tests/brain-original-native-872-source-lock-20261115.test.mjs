import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';

const root=new URL('../supabase/',import.meta.url);
const lock=JSON.parse(readFileSync(new URL('migration-history.lock.json',root),'utf8'));
const sql=readFileSync(new URL('migrations/20261115235500_sales_action_reexecution_immutable_attempt_lineage_v1.sql',root),'utf8');

test('native 872 provider-applied identity is append-only and future provider versions remain allowed',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.ok(lock.applied.length>=872);
  assert.deepEqual(lock.applied[871],{version:'20261115235500',name:'sales_action_reexecution_immutable_attempt_lineage_v1'});
  assert.deepEqual(lock.applied[870],{version:'20261115170000',name:'outcome_memory_source_readback_truth_v1'});
  assert.equal(lock.applied.filter(x=>x.version==='20261115235500').length,1);
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-15T17:03:59.159987Z'));
});

test('native provider migration 872 has executable bounded original owner logic, never synthetic result',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_advance_sales_action_v1/);
  assert.match(sql,/for update/i);
  assert.match(sql,/v_attempt_ref := v_ref\|\|':reexecution:'\|\|/);
  assert.match(sql,/agent_attribution','UNKNOWN_NOT_ATTESTED'/);
  assert.doesNotMatch(sql,/delete\s+from\s+supabase_migrations|cron\.schedule\s*\(/i);
});

test('original provider-locked version/name and all executable SQL sources match exactly',()=>{
  const source=readdirSync(new URL('migrations/',root))
    .filter(name=>/^\d{14}_[a-z0-9_]+\.sql$/.test(name))
    .map(name=>({version:name.slice(0,14),name:name.slice(15,-4)}))
    .sort((a,b)=>a.version.localeCompare(b.version));
  assert.deepEqual(source,lock.applied);
});
