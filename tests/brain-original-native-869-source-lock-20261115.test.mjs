import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const source=readFileSync(new URL('../supabase/migrations/20261115162000_personal_observation_source_no_resurrection_v1.sql',import.meta.url),'utf8');
test('real native #869 provider identity is appended once with prior immutable history',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=869);
 assert.equal(lock.applied.filter(m=>m.version==='20261115162000').length,1);
 assert.deepEqual(lock.applied.find(m=>m.version==='20261115162000'),{
  version:'20261115162000',name:'personal_observation_source_no_resurrection_v1'
 });
 assert.equal(new Set(lock.applied.map(m=>m.version)).size,lock.applied.length);
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-15T15:27:58.083020Z'));
});
test('the recorded native #869 migration is actual executable original source, not a dummy closure',()=>{
 assert.match(source,/powerhouse_ensure_personal_source_rotation_v2/i);
 assert.match(source,/create or replace function/i);
 assert.ok(source.length>500);
});
test('one retained executable source file exists for every prior version and no missing native #869',()=>{
 const files=new Set(readdirSync(new URL('../supabase/migrations/',import.meta.url)));
 for(const row of lock.applied){
   const filename=row.version+'_'+row.name+'.sql';
   assert.ok(files.has(filename),'missing original executable migration '+filename);
 }
});
