import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const migrationsDir=new URL('../supabase/migrations/',import.meta.url);
const names=readdirSync(migrationsDir).filter(n=>/^\d{14}_.+\.sql$/.test(n));
const sourceVersions=new Set(names.map(n=>n.slice(0,14)));
const applied=new Map(lock.applied.map(r=>[r.version,r.name]));
const recent=[
 ['20261028212459','bg_bedrijfsprofiel_v1'],
 ['20261028220000','bg_linkedin_lus_v1'],
 ['20261029101146','personal_observational_source_date_gate_20261029'],
 ['20261029101159','linkedin_personal_observational_source_freshness_20261029']
];

test('lock contains exactly 774 independently provider-recorded applied identities, including latest four',()=>{
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,774);
 assert.equal(applied.size,774,'no duplicate applied versions');
 assert.match(lock.captured_at,/2026-10-29/);
 for(const [version,name] of recent)assert.equal(applied.get(version),name);
});

test('every actually applied migration remains executable source with exact registered version and name',()=>{
 const missing=lock.applied.filter(row=>!names.includes(row.version+'_'+row.name+'.sql'));
 assert.deepEqual(missing,[],'never mark a missing or renamed SQL migration as applied');
 assert.equal(sourceVersions.size,names.length,'duplicate timestamp forbidden');
});

test('linked-in production migration remains active source with real DDL and service_role gates',()=>{
 const file=readFileSync(new URL('../supabase/migrations/20261028220000_bg_linkedin_lus_v1.sql',import.meta.url),'utf8');
 assert.match(file,/create table if not exists public\.bg_linkedin_bewijs/i);
 assert.match(file,/alter table public\.bg_linkedin_bewijs enable row level security/i);
 assert.match(file,/grant execute on function public\.bg_social_lus_cyclus\(text, date\) to service_role/i);
 assert.notEqual(createHash('sha256').update(file).digest('hex'),'','must keep actual nonempty SQL');
});

test('no quarantine or fake empty SQL was used to hide the already-applied migration',()=>{
 assert.ok(names.includes('20261028220000_bg_linkedin_lus_v1.sql'));
 assert.ok(!readdirSync(new URL('../supabase/migration-history/repository-only/',import.meta.url)).includes('20261028220000_bg_linkedin_lus_v1.sql'));
});
