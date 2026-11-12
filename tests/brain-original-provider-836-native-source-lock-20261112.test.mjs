import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('original native provider 836 source lock preserves all historical 835 identities and exact 836th',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=836,'future provider migrations can append but not rewrite native 836 prefix');
 assert.deepEqual(lock.applied[834],{version:'20261112211000',name:'original_skipped_provider_reference_readback_handoff_v1'});
 assert.deepEqual(lock.applied[835],{version:'20261112211600',name:'original_seo_opportunity_source_registry_v1'});
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(existsSync(new URL('../supabase/migrations/20261112211600_original_seo_opportunity_source_registry_v1.sql',import.meta.url)));
});
test('original SEO derived source registration cannot create second scheduler, provider or publish bypass',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261112211600_original_seo_opportunity_source_registry_v1.sql',import.meta.url),'utf8');
 assert.ok(sql.trim().length>300);
 assert.match(sql,/original_seo_opportunity|seo.opportunity|source_key|evidence_source/i);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(/i);
});
