import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const version='20261116105000';
const name='original_infinity_missing_signal_isolated_mux_v3';
test('native 874 source identities exactly ordered and unique',()=>{
 // De lock groeit mee met latere native migraties; deze test bewaakt alleen dat de 874-positie
 // (mux v3) exact op zijn plek staat en dat de lock uniek en geordend blijft.
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=874);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.deepEqual(lock.applied[873],{version,name});
 assert.deepEqual(lock.applied[872],{version:'20261115235900',name:'company_intelligence_existing_daily_source_receipt_v1'});
 const versions=lock.applied.map(x=>x.version);
 assert.deepEqual(versions,[...versions].sort());
});
test('every locked production migration has an immutable executable source',()=>{
 const filenames=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(x=>x.endsWith('.sql'));
 const names=new Set(filenames);
 for(const row of lock.applied)assert.ok(names.has(row.version+'_'+row.name+'.sql'),row.version+' '+row.name);
});
test('new original runtime mux migration is source-backed, not fabricated history',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261116105000_original_infinity_missing_signal_isolated_mux_v3.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_runtime_scheduler_mux_v3/);
 assert.match(sql,/POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED/);
 assert.match(sql,/REVOKE ALL ON FUNCTION/);
 assert.match(sql,/TO service_role/);
 assert.ok(sql.length>1000);
});
