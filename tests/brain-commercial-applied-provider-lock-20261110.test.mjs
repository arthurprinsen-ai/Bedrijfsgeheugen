import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sourceFiles=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(name=>/^\d{14}_.+\.sql$/.test(name)).sort();
test('exact observed original commercial provider migration belongs to complete immutable migration lock',()=>{
 const expected='20261110131500_original_commercial_nested_gmail_provider_outcome_assurance_v1.sql';
 assert.ok(sourceFiles.includes(expected));
 const applied=lock.applied.map(x=>x.version+'_'+x.name+'.sql').sort();
 assert.deepEqual(applied,sourceFiles);
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.source,'supabase_migration_history');
 // The originally provider-observed 823 identities are an immutable PREFIX,
 // not a claim that the canonical ledger must stop growing at that date.
 const historic=lock.applied.filter(row=>row.version<='20261110134500');
 assert.equal(historic.length,823);
 assert.equal(new Set(lock.applied.map(row=>row.version)).size,lock.applied.length,'duplicate provider versions forbidden');
 assert.equal(lock.applied.length,sourceFiles.length,'every current locked migration must have its canonical source SQL');
 assert.ok(lock.applied.every(row=>/^\d{14}$/.test(row.version)&&/^[a-z0-9_]+$/.test(row.name)),'preserve every exact provider identity');
 assert.deepEqual(historic.at(-1),{version:'20261110134500',name:'original_source_wait_is_not_send_v1'});
 assert.ok(lock.applied.some(row=>row.version==='20261110160055'&&row.name==='linkedin_org_readback_sticky_provider_health_v1'),
   'independently observed subsequent provider history must remain preserved');
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-10T13:17:39.187581Z'));
 const sql=readFileSync(new URL('../supabase/migrations/'+expected,import.meta.url),'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_output_assurance_v1/);
 assert.match(sql,/autonomous-email-sent:/);
 assert.match(sql,/provider_readback_verified/);
 const waitSource='20261110134500_original_source_wait_is_not_send_v1.sql';
 assert.ok(sourceFiles.includes(waitSource));
 assert.equal(historic.at(-1).name,'original_source_wait_is_not_send_v1');
 const waitSql=readFileSync(new URL('../supabase/migrations/'+waitSource,import.meta.url),'utf8');
 assert.match(waitSql,/WAIT_FOR_VERIFIED_SOURCE/);
 assert.match(waitSql,/provider_send_forbidden/);
});
