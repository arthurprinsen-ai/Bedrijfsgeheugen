import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('native Supabase 835th provider row retains immutable historical 834 identity prefix',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.ok(lock.applied.length>=835,'future actually applied migrations may append, never overwrite the historical 835');
  assert.deepEqual(lock.applied[833],{version:'20261112203000',name:'original_seo_keyword_tenant_alignment_v1'});
  assert.deepEqual(lock.applied[834],{version:'20261112211000',name:'original_skipped_provider_reference_readback_handoff_v1'});
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.ok(existsSync(new URL('../supabase/migrations/20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql',import.meta.url)));
});
test('original provider 835 corrective migration is nonempty and never creates a second schedule',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql',import.meta.url),'utf8');
  assert.ok(sql.trim().length>200);
  assert.match(sql,/OVERDUE_PROVIDER_READBACK/);
  assert.doesNotMatch(sql,/\bcron\.schedule\s*\(/i);
});
