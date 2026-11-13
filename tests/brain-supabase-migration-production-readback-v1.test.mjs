import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrationVersions,migrationIdentities,assertExactProviderRows,assertExactProviderIdentities,assertCanonicalTerminalGuardProof,terminalGuardProofSql,verifyMigrationProduction} from '../tools/delivery/supabase-migration-production-readback.mjs';
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
    return {ok:true,json:async()=>[{version:'20261008104000',name:'test'}]};
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

test('permanent migration source identity rejects reused versions with different names',()=>{
  const identity=migrationIdentities(['supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql']);
  assert.deepEqual(identity,[{version:'20261113083000',name:'original_one_chain_content_terminal_proof_guard_v1'}]);
  assert.throws(()=>assertExactProviderIdentities(identity,[{version:'20261113083000',name:'some_other_migration'}]),/EXACT_IDENTITY_MISSING/);
  assert.throws(()=>assertExactProviderIdentities(identity,[{version:'20261113083000'}]),/EXACT_IDENTITY_MISSING/);
  assert.throws(()=>assertExactProviderIdentities(identity,[...identity,...identity]),/DUPLICATE_VERSION/);
  assert.throws(()=>migrationIdentities([
    'supabase/migrations/20261113083000_one.sql',
    'supabase/migrations/20261113083000_two.sql'
  ]),/VERSION_COLLISION/);
  assert.equal(assertExactProviderIdentities(identity,identity).exact_names_verified,true);
});

test('terminal migration and later migration releases must validate installed original guard',async()=>{
  const path='supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql';
  const queries=[];
  const goodRequest=async(_url,options)=>{
    const {query}=JSON.parse(options.body);
    queries.push(query);
    if(query.includes('supabase_migrations.schema_migrations'))
      return {ok:true,json:async()=>[{version:'20261113083000',name:'original_one_chain_content_terminal_proof_guard_v1'}]};
    if(query.includes('pg_trigger'))
      return {ok:true,json:async()=>[{guard_proven:true}]};
    throw new Error('unexpected query');
  };
  const result=await verifyMigrationProduction({changedPaths:[path],projectRef:'adhjwmvyoixzjtmiroln',token:'test-only',request:goodRequest});
  assert.equal(result.guard_proven,true);
  assert.equal(queries.length,2);
  assert.match(queries[0],/select version,name from supabase_migrations.schema_migrations/);
  assert.match(queries[1],/t\.tgenabled='O'/);
  assert.match(queries[1],/NOT has_function_privilege\('anon'/);
  assert.match(queries[1],/brain_guard_content_terminal_proof_v1/);
  assert.match(terminalGuardProofSql,/CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED/);
  assert.match(terminalGuardProofSql,/CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED/);
  assert.match(terminalGuardProofSql,/CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED/);
});

test('migration appears in provider history but absent or disabled original trigger never passes',async()=>{
  const path='supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql';
  const request=async(_url,options)=>{
    const {query}=JSON.parse(options.body);
    return {ok:true,json:async()=>query.includes('pg_trigger')?[{guard_proven:false}]:
      [{version:'20261113083000',name:'original_one_chain_content_terminal_proof_guard_v1'}]};
  };
  await assert.rejects(()=>verifyMigrationProduction({
    changedPaths:[path],projectRef:'adhjwmvyoixzjtmiroln',token:'test-only',request
  }),/TERMINAL_GUARD_NOT_ACTIVE/);
  assert.throws(()=>assertCanonicalTerminalGuardProof([]),/NOT_ACTIVE/);
  assert.throws(()=>assertCanonicalTerminalGuardProof([{guard_proven:'true'}]),/NOT_ACTIVE/);
  assert.throws(()=>assertCanonicalTerminalGuardProof([{guard_proven:false}]),/NOT_ACTIVE/);
});

test('later unrelated migration-only release still enforces original ONE BRAIN guard',async()=>{
  let calls=0;
  const request=async(_url,options)=>{
    calls++;
    const {query}=JSON.parse(options.body);
    return {ok:true,json:async()=>query.includes('pg_trigger')?[{guard_proven:true}]:
      [{version:'20261114000100',name:'later_backend_migration'}]};
  };
  const result=await verifyMigrationProduction({
    changedPaths:['supabase/migrations/20261114000100_later_backend_migration.sql'],
    projectRef:'adhjwmvyoixzjtmiroln',token:'test-only',request
  });
  assert.equal(calls,2);
  assert.equal(result.guard_proven,true);
});
