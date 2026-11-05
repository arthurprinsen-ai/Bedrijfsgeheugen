import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
const exact={version:'20261105134200',name:'original_data_spine_decision_receipt_same_tick_v1'};

test('original provider-backed 808 migration identities are unique and chronological',()=>{
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.applied.length,808);
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,808);
  assert.deepEqual(lock.applied.at(-1),exact);
  assert.deepEqual(lock.applied.at(-2),{version:'20261105132000',name:'original_data_spine_same_tick_stage_receipts_v1'});
  assert.ok(lock.applied.every((x,i,a)=>i===0||x.version>a[i-1].version),'append history must be ordered, never rewritten');
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-05T13:42:00Z'));
});

test('original executable migration source exists and may never be invented by source-lock synchronization',()=>{
  assert.equal(existsSync('supabase/migrations/'+exact.version+'_'+exact.name+'.sql'),true);
  const sql=readFileSync('supabase/migrations/'+exact.version+'_'+exact.name+'.sql','utf8');
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_data_spine_watchdog_v1/);
  assert.match(sql,/revoke all on function public\.powerhouse_data_spine_watchdog_v1/);
  assert.match(sql,/grant execute on function public\.powerhouse_data_spine_watchdog_v1/);
});
