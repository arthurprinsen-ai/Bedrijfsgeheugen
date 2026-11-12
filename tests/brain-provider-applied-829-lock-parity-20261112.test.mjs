import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('provider applied 829th migration is the ONLY exact newly attested authoritative history row',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,829);
 assert.deepEqual(lock.applied.at(-1),{version:'20261112144500',name:'original_social_legacy_alias_acks_v1'});
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,829);
 assert.equal(lock.applied.filter(x=>x.version==='20261112144500').length,1);
 assert.equal(lock.applied.filter(x=>x.version==='20261112162500').length,0,
   'Never predeclare the separate pending temporal ACK migration applied');
 const sql=readFileSync(new URL('../supabase/migrations/20261112144500_original_social_legacy_alias_acks_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/ORIGINAL_SOCIAL_WINDOW_LEGACY_ALIAS_ACK_V1/);
 assert.match(sql,/original-content-handoff-no-aging-gap-v2/);
 assert.match(sql,/TO service_role/);
});
test('one original executable SQL is present for every attested provider version',()=>{
 const files=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(x=>x.endsWith('.sql'));
 const names=new Set(files.map(x=>x.slice(0,14)));
 for(const r of lock.applied) assert.ok(names.has(r.version),'missing original executable '+r.version);
 assert.ok(files.some(f=>f==='20261112144500_original_social_legacy_alias_acks_v1.sql'));
});
