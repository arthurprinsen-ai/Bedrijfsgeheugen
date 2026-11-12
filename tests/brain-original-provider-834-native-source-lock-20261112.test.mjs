import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));

test('original native #834 preserves immutable prior 833 and appends exactly one verified provider identity',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.equal(lock.applied.length,834);
  assert.deepEqual(lock.applied[832],{version:'20261112194500',name:'original_growth_source_revision_identity_fix_v1'});
  assert.deepEqual(lock.applied[833],{version:'20261112203000',name:'original_seo_keyword_tenant_alignment_v1'});
  assert.equal(new Set(lock.applied.map(item=>item.version)).size,lock.applied.length);
  assert.ok(existsSync(new URL('../supabase/migrations/20261112203000_original_seo_keyword_tenant_alignment_v1.sql',import.meta.url)));
});
test('original native 834 SEO source correction is not an empty replay or duplicate schedule',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/20261112203000_original_seo_keyword_tenant_alignment_v1.sql',import.meta.url),'utf8');
  assert.match(sql,/pg_get_functiondef/);
  assert.match(sql,/KEYWORD_TENANT_SOURCE_READBACK_FAILED/);
  assert.match(sql,/tenant_id=''canonical''/);
  assert.doesNotMatch(sql,/\bcron\.schedule\s*\(/i);
});
