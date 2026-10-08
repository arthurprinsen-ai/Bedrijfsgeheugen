import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrationVersions,assertExactProviderRows,verifyMigrationProduction} from '../tools/delivery/supabase-migration-production-readback.mjs';
const workflow=readFileSync(new URL('../.github/workflows/obligation-terminal-closure.yml',import.meta.url),'utf8');
test('migration-only terminal closure requires Supabase provider readback, never Netlify',()=>{
  assert.ok(workflow.includes('SUPABASE_MIGRATION_PRODUCTION_TOKEN_MISSING'));
  assert.ok(workflow.includes('SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}'));
  assert.ok(workflow.includes('supabase-migration-production-readback.mjs'));
});
test('strict migration filename selection rejects fake paths',()=>{
  assert.deepEqual(migrationVersions(['supabase/migrations/20261008104000_foo.sql','supabase/migrations/20261008104000_foo.sql','supabase/migrations/../../fake.sql']),['20261008104000']);
});
test('provider must return exact versions; empty or partial rows fail closed',()=>{
  assert.throws(()=>assertExactProviderRows(['20261008104000'],[]),/VERSIONS_MISSING/);
  assert.throws(()=>assertExactProviderRows(['20261008104000'],[{version:'20261008104001'}]),/VERSIONS_MISSING/);
  assert.equal(assertExactProviderRows(['20261008104000'],[{version:'20261008104000'}]).verified,true);
});
test('production management API readback succeeds only with authenticated exact ledger rows',async()=>{
  let called=false;
  const result=await verifyMigrationProduction({changedPaths:['supabase/migrations/20261008104000_test.sql'],projectRef:'adhjwmvyoixzjtmiroln',token:'test-secret',request:async(url,options)=>{
    called=true;assert.match(url,/api.supabase.com\/v1\/projects\/adhjwmvyoixzjtmiroln\/database\/query/);
    assert.match(options.body,/20261008104000/);
    return {ok:true,json:async()=>[{version:'20261008104000'}]};
  }});
  assert.ok(called);assert.equal(result.mode,'supabase_migration');
});
test('provider errors are not silently converted to green',async()=>{
  await assert.rejects(()=>verifyMigrationProduction({changedPaths:['supabase/migrations/20261008104000_test.sql'],projectRef:'adhjwmvyoixzjtmiroln',token:'test-secret',request:async()=>({ok:false,status:403})}),/HTTP_403/);
});
