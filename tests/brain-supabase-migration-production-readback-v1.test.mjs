import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrationVersions,assertExactProviderRows,verifyMigrationProduction} from '../tools/delivery/supabase-migration-production-readback.mjs';
const workflow=readFileSync(new URL('../.github/workflows/obligation-terminal-closure.yml',import.meta.url),'utf8');
test('migration-only terminal closure requires Supabase provider readback, never Netlify',()=>{
  assert.ok(workflow.includes('migration_files=') && workflow.includes('migration_provider_only='));
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
    called=true;assert.equal(new URL(url).origin,'https://api.supabase.com');assert.equal(new URL(url).pathname,'/v1/projects/adhjwmvyoixzjtmiroln/database/query');
    assert.match(options.body,/20261008104000/);
    return {ok:true,json:async()=>[{version:'20261008104000'}]};
  }});
  assert.ok(called);assert.equal(result.mode,'supabase_migration');
});
test('provider errors are not silently converted to green',async()=>{
  await assert.rejects(()=>verifyMigrationProduction({changedPaths:['supabase/migrations/20261008104000_test.sql'],projectRef:'adhjwmvyoixzjtmiroln',token:'test-secret',request:async()=>({ok:false,status:403})}),/HTTP_403/);
});

test('canonical replay workflow has one valid manual trigger and no duplicated jobs',()=>{
  assert.match(workflow,/^on:\n  pull_request:\n[\s\S]*?  workflow_dispatch:/m);
  assert.equal((workflow.match(/^jobs:$/gm)||[]).length,1);
  assert.equal((workflow.match(/^      - name: Wait for canonical production release readback$/gm)||[]).length,1);
  assert.equal((workflow.match(/^          source_run_id=""$/gm)||[]).length,1);
  assert.equal((workflow.match(/^          changed_paths="\$\(git diff --name-only/gm)||[]).length>=1,true);
  assert.ok(workflow.endsWith('          retention-days: 90\n'));
  assert.ok(workflow.includes('SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}'));
  assert.ok(workflow.includes('migration_files='));
  assert.ok(workflow.includes('migration_provider_only='));
  assert.ok(workflow.includes('node tools/delivery/supabase-migration-production-readback.mjs'));
});
test('migration-only provider proof maps to established canonical terminal mode',()=>{
  const helper=readFileSync(new URL('../tools/delivery/supabase-migration-production-readback.mjs',import.meta.url),'utf8');
  assert.ok(helper.includes('mode=github_main'));
  assert.ok(helper.includes('SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN'));
});
