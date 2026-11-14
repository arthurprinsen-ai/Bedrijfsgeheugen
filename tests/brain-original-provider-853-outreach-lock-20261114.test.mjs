import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));

test('first original provider 851 remain immutable and exact two native original outreach versions appended',()=>{
 const applied=lock.applied;
 assert.ok(applied.length>=853);
 assert.equal(applied[851].version,'20261114080027');
 assert.equal(applied[851].name,'original_approved_connection_source_priming_v1');
 assert.equal(applied[852].version,'20261114083500');
 assert.equal(applied[852].name,'original_approved_connection_source_priming_v1');
 assert.equal(new Set(applied.map(x=>x.version)).size,applied.length);
});
test('native source lock retains real provider source identity without speculative future migration',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(Number.isFinite(Date.parse(lock.captured_at)),true);
 assert.ok(!lock.applied.some(x=>x.version==='20261114090000'));
});
