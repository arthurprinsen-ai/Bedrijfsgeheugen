import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminalizer reads verifier-only path classification from the canonical production-readback contract', async()=>{
  const [workflow,contract] = await Promise.all([
    readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8'),
    readFile('brain/contracts/production-readback-v1.json','utf8').then(JSON.parse),
  ]);
  assert.match(workflow,/verifier_only_paths=/);
  assert.match(workflow,/verifier_only_prefixes=/);
  assert.match(workflow,/productionTruth\?\.verifierOnlyPaths/);
  assert.match(workflow,/productionTruth\?\.verifierOnlyPrefixes/);
  assert.match(workflow,/grep -Fxq -- "\$1"/);
  assert.match(workflow,/\[\[ "\$1" == "\$prefix"\* \]\]/);
  assert.match(workflow,/UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);

  const prefixes=contract.productionTruth.verifierOnlyPrefixes;
  for (const prefix of [
    'docs/','.agents/','tests/','.github/','brain/learning/','brain/policies/',
    'schemas/','scripts/brain/','scripts/ci/','tools/delivery/','tools/ci/',
    'tools/build/','tools/netlify/','tools/notion/','tools/supabase/',
  ]) assert.ok(prefixes.includes(prefix), prefix);
});

test('control-plane config changed by PR 3984 is verifier-only without widening all config', async()=>{
  const contract=JSON.parse(await readFile('brain/contracts/production-readback-v1.json','utf8'));
  const paths=contract.productionTruth.verifierOnlyPaths;
  for (const path of [
    'config/build-contract.json',
    'config/control-plane-budget.json',
    'config/netlify-project-registry.json',
    'config/notion-root-lifecycle.json',
    'config/pr-trigger-baseline.json',
    'config/supabase-edge-functions.json',
    'config/powerhouse-quality-surface-contracts.json',
    'config/powerhouse-runtime-backpressure-v1.json',
    'config/brain-delivery-system.json',
    'config/powerhouse-agent-delivery-scheduler-v1.json',
  ]) assert.ok(paths.includes(path), path);
  assert.equal(contract.productionTruth.verifierOnlyPrefixes.includes('config/'),false);
});

test('unknown non-Netlify and non-Supabase runtime paths remain fail-closed', async()=>{
  const workflow=await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(workflow,/const unknown=paths\.filter/);
  assert.match(workflow,/UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);
  assert.match(workflow,/exit 78/);
});


test('migration runtime requires explicit provider-applied evidence', async()=>{
  const [workflow,contract] = await Promise.all([
    readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8'),
    readFile('brain/contracts/production-readback-v1.json','utf8').then(JSON.parse),
  ]);
  const migration=contract.productionTruth.supabaseMigrationReadback;
  assert.equal(migration.requiredForMigrationRuntime,true);
  assert.equal(migration.marker,'Terminal-Supabase-Migration-Readback');
  assert.equal(migration.projectRef,'adhjwmvyoixzjtmiroln');
  assert.equal(migration.state,'APPLIED');
  assert.equal(migration.failClosedWhenMissing,true);

  assert.match(workflow,/const migrations=paths\.filter/);
  assert.match(workflow,/Terminal-Supabase-Migration-Readback/);
  assert.match(workflow,/SUPABASE_MIGRATION_PROVIDER_READBACK_MISSING/);
  assert.match(workflow,/supabase_migration_provider/);
  assert.match(workflow,/supabase_edge_and_migration_provider/);
  assert.match(workflow,/TERMINAL_SUPABASE_MIGRATION_READBACK_EVIDENCE_MISSING/);
  assert.match(workflow,/project=adhjwmvyoixzjtmiroln/);
});

test('unknown backend paths remain fail-closed after migration routing', async()=>{
  const workflow=await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(workflow,/!migrations\.includes\(path\)/);
  assert.match(workflow,/UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);
});

test('migration-history lock is verifier-only evidence while executable migrations stay provider-readback', async()=>{
  const [workflow,contract] = await Promise.all([
    readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8'),
    readFile('brain/contracts/production-readback-v1.json','utf8').then(JSON.parse),
  ]);
  assert.ok(contract.productionTruth.verifierOnlyPaths.includes('supabase/migration-history.lock.json'));
  assert.equal(contract.productionTruth.verifierOnlyPrefixes.includes('supabase/'),false);
  assert.equal(contract.productionTruth.verifierOnlyPrefixes.includes('supabase/migrations/'),false);
  assert.match(workflow,/const migrations=paths\.filter/);
  assert.match(workflow,/SUPABASE_MIGRATION_PROVIDER_READBACK_MISSING/);
  assert.match(workflow,/UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);
});
