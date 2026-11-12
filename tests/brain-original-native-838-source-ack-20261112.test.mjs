import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));

test('actual native 838 is appended to canonical source lock without rewriting earlier rows',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,838);
 assert.deepEqual(lock.applied[835],{version:'20261112211600',name:'original_seo_opportunity_source_registry_v1'});
 assert.deepEqual(lock.applied[836],{version:'20261112214500',name:'original_seo_derived_brain_manifest_handoff_v1'});
 assert.deepEqual(lock.applied[837],{version:'20261112230000',name:'original_seo_daily_archive_cardinality_guard_v1'});
 assert.equal(new Set(lock.applied.map(z=>z.version)).size,lock.applied.length);
 assert.ok(existsSync(new URL('../supabase/migrations/20261112230000_original_seo_daily_archive_cardinality_guard_v1.sql',import.meta.url)));
});
test('source observation time is not before actual native provider readback',()=>{
 assert.ok(Number.isFinite(new Date(lock.captured_at).getTime()));
 assert.ok(new Date(lock.captured_at).getTime()>=Date.parse('2026-11-12T21:47:11.470Z'));
 const sql=readFileSync(new URL('../supabase/migrations/20261112230000_original_seo_daily_archive_cardinality_guard_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/ORIGINAL_SEO_ARCHIVE_CARDINALITY_READBACK_FAILED/);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(/i);
});
