import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const l=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('original provider-applied exact 831 migrations recorded, with next proposal not preapplied',()=>{
 assert.equal(l.source,'supabase_migration_history');assert.equal(l.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(l.applied.length,831);assert.deepEqual(l.applied.at(-1),{version:'20261112173000',name:'original_daily_source_brain_heartbeat_v1'});
 assert.equal(new Set(l.applied.map(v=>v.version)).size,831);
 assert.equal(l.applied.filter(v=>v.version==='20261112173000').length,1);
 assert.equal(l.applied.filter(v=>v.version==='20261112184500').length,0);
 assert.match(readFileSync(new URL('../supabase/migrations/20261112173000_original_daily_source_brain_heartbeat_v1.sql',import.meta.url),'utf8'),/powerhouse_daily_source_consume_v1/);
});
