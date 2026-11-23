import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('original provider-applied 837 source identity preserves the first 836 and executable SQL',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=837);
 assert.deepEqual(lock.applied[835],{version:'20261112211600',name:'original_seo_opportunity_source_registry_v1'});
 assert.deepEqual(lock.applied[836],{version:'20261112214500',name:'original_seo_derived_brain_manifest_handoff_v1'});
 assert.equal(new Set(lock.applied.map(z=>z.version)).size,lock.applied.length);
 assert.ok(existsSync(new URL('../supabase/migrations/20261112214500_original_seo_derived_brain_manifest_handoff_v1.sql',import.meta.url)));
});
test('source lock observed timestamp cannot predate the independently verified provider #837 readback',()=>{
 assert.ok(Number.isFinite(new Date(lock.captured_at).getTime()));
 assert.ok(new Date(lock.captured_at).getTime()>=Date.parse('2026-11-12T20:39:22.938Z'));
 const sql=readFileSync(new URL('../supabase/migrations/20261112214500_original_seo_derived_brain_manifest_handoff_v1.sql',import.meta.url),'utf8');
 assert.ok(sql.trim().length>100);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(/i);
});
