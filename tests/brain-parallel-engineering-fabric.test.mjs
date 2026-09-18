import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  buildExecutionPlan,
  executePlanWaves,
  buildImpactGraph,
  selectAffectedTests,
  buildCacheIdentity,
  buildSpeculativeIntegrations,
  allocateMigrationVersion,
  loadParallelEngineeringPolicy,
  validateParallelEngineeringFabric
} from '../scripts/brain/parallel-engineering-fabric.mjs';

const deliveryConfig = {
  nonExecutableSharedPaths: ['docs/learning/', 'docs/changes/'],
  conflictContracts: [
    { id: 'delivery-control-plane', paths: ['config/', 'scripts/brain/', '.github/workflows/'] },
    { id: 'supabase-schema', paths: ['supabase/migrations/', 'supabase/schema/'] },
    { id: 'website-shell', paths: ['site/', 'index.html', 'styles.css'] }
  ],
  lanes: [
    { id: 'backend', owner: 'agent-backend', paths: ['brain/', 'scripts/brain/', 'supabase/', 'tests/brain-'] },
    { id: 'website', owner: 'agent-website', paths: ['site/', 'index.html', 'styles.css', 'tests/site-'] },
    { id: 'docs', owner: 'agent-docs', paths: ['docs/'] }
  ]
};

const policy = {
  fingerprint: 'powerhouse-parallel-engineering-fabric-v1', version: 2, fail_closed_unknown_material_scope: true,
  test_profiles: { docs: ['docs-contract'], backend: ['backend-unit','backend-contract'], website: ['website-unit','website-visual'], control_plane: ['engineering-os','delivery-contract','security'], full: ['required'] }
};

test('impact graph resolves lanes contracts resources and targeted tests', () => {
  const graph = buildImpactGraph({ paths: ['supabase/migrations/1.sql'], resources: ['table:customers'], deliveryConfig, policy });
  assert.deepEqual(graph.lanes, ['backend']);
  assert.ok(graph.contracts.includes('supabase-schema'));
  assert.ok(graph.testProfiles.includes('backend-contract'));
  assert.deepEqual(graph.resources, ['table:customers']);
});

test('unknown impact graph fails closed to full required tests', () => {
  const graph = buildImpactGraph({ paths: ['mystery/runtime.bin'], deliveryConfig, policy });
  assert.equal(graph.failClosed, true); assert.deepEqual(graph.testProfiles, ['required']);
});

test('independent backend and website packages execute in the same wave', () => {
  const plan = buildExecutionPlan({ workPackages: [
    { id:'A', paths:['brain/a.mjs'], baseSha:'base', candidateSha:'a' },
    { id:'B', paths:['site/home.js'], baseSha:'base', candidateSha:'b' }
  ], deliveryConfig, policy });
  assert.deepEqual(plan.waves.map(w => w.map(p => p.id)), [['A','B']]);
});

test('coordinator executes independent specialist packages concurrently and waves sequentially', async () => {
  const plan = buildExecutionPlan({ workPackages: [
    { id:'A', paths:['brain/a.mjs'], baseSha:'base', candidateSha:'a', specialist:'backend' },
    { id:'B', paths:['site/b.js'], baseSha:'base', candidateSha:'b', specialist:'website' },
    { id:'C', paths:['brain/c.mjs'], dependsOn:['A'], baseSha:'base', candidateSha:'c', specialist:'backend' }
  ], deliveryConfig, policy });
  const starts = []; const finishes = [];
  const workers = {
    backend: async pkg => { starts.push(pkg.id); await new Promise(resolve => setTimeout(resolve, 20)); finishes.push(pkg.id); return `done:${pkg.id}`; },
    website: async pkg => { starts.push(pkg.id); await new Promise(resolve => setTimeout(resolve, 20)); finishes.push(pkg.id); return `done:${pkg.id}`; }
  };
  const result = await executePlanWaves(plan, workers);
  assert.deepEqual(starts.slice(0, 2).sort(), ['A','B']);
  assert.equal(starts[2], 'C');
  assert.ok(finishes.indexOf('A') < starts.indexOf('C'));
  assert.deepEqual(result.results, { A:'done:A', B:'done:B', C:'done:C' });
  assert.equal(result.promotionAuthority, false);
});

test('path contract dependency and mutable-resource conflicts serialize deterministically', () => {
  const plan = buildExecutionPlan({ workPackages: [
    { id:'A', paths:['brain/a.mjs'], resources:['table:shared'], baseSha:'base', candidateSha:'a' },
    { id:'B', paths:['site/b.js'], resources:['table:shared'], baseSha:'base', candidateSha:'b' },
    { id:'C', paths:['config/c.json'], baseSha:'base', candidateSha:'c' },
    { id:'D', paths:['scripts/brain/d.mjs'], baseSha:'base', candidateSha:'d' }
  ], deliveryConfig, policy });
  assert.deepEqual(plan.waves.map(w => w.map(p => p.id)), [['A','C'],['B','D']]);
});

test('explicit dependencies order waves and cycles fail closed', () => {
  const plan = buildExecutionPlan({ workPackages: [
    { id:'A', paths:['brain/a.mjs'], baseSha:'base', candidateSha:'a' },
    { id:'B', paths:['site/b.js'], dependsOn:['A'], baseSha:'base', candidateSha:'b' }
  ], deliveryConfig, policy });
  assert.deepEqual(plan.waves.map(w => w.map(p => p.id)), [['A'],['B']]);
  assert.throws(() => buildExecutionPlan({ workPackages:[{id:'A',paths:['brain/a.mjs'],dependsOn:['B'],baseSha:'b',candidateSha:'a'},{id:'B',paths:['site/b.js'],dependsOn:['A'],baseSha:'b',candidateSha:'c'}], deliveryConfig, policy }), /cycle/i);
});

test('affected tests keep docs fast path and control plane protected profile', () => {
  assert.deepEqual(selectAffectedTests({ paths:['docs/learning/x.md'], deliveryConfig, policy }).profiles, ['docs-contract']);
  const control = selectAffectedTests({ paths:['config/powerhouse-engineering-os.json'], deliveryConfig, policy });
  assert.deepEqual(control.profiles, ['delivery-contract','engineering-os','security']);
});

test('unknown material scope fails closed at planning', () => {
  assert.throws(() => buildExecutionPlan({ workPackages:[{id:'UNKNOWN',paths:['mystery/runtime.bin'],baseSha:'base',candidateSha:'candidate'}], deliveryConfig, policy }), /unknown material scope/i);
});

test('cache identity binds config schema dependency gate environment and contract digests', () => {
  const base = { baseSha:'base', candidateSha:'c1', paths:['a'], contracts:['x'], tests:['t1'], policyVersion:2, environment:'preview', configDigest:'cfg', schemaDigest:'sch', dependencyDigest:'dep', gateVersion:'g1', contractDigest:'ct' };
  const a = buildCacheIdentity(base); const b = buildCacheIdentity(base);
  assert.equal(a,b); assert.match(a,/^[a-f0-9]{64}$/);
  for (const [field,value] of [['configDigest','cfg2'],['schemaDigest','sch2'],['dependencyDigest','dep2'],['gateVersion','g2'],['environment','prod'],['contractDigest','ct2']]) assert.notEqual(a, buildCacheIdentity({ ...base, [field]:value }), field);
});

test('speculative integrations include only conflict-free packages from same wave and never promote', () => {
  const plan = buildExecutionPlan({ workPackages:[{id:'A',paths:['brain/a.mjs'],baseSha:'base',candidateSha:'a'},{id:'B',paths:['site/b.js'],baseSha:'base',candidateSha:'b'}], deliveryConfig, policy });
  const combos = buildSpeculativeIntegrations(plan);
  assert.deepEqual(combos[0].packageIds,['A','B']); assert.equal(combos[0].promotionAuthority,false);
});

test('migration versions are allocated at integration and skip occupied wall-clock seconds deterministically', () => {
  const allocated = allocateMigrationVersion({
    existingVersions:['20260918104500','20260918104501','20260918104502'],
    preferredVersion:'20260918104500'
  });
  assert.deepEqual(allocated,{version:'20260918104503',preferredVersion:'20260918104500',collisionResolved:true,offsetSeconds:3});
  assert.throws(()=>allocateMigrationVersion({existingVersions:[],preferredVersion:'20260918109999'}),/Invalid migration version timestamp/);
});

test('canonical fabric policy remains subordinate to Engineering OS and BG169', async () => {
  const actual = await loadParallelEngineeringPolicy();
  assert.equal(actual.fingerprint,'powerhouse-parallel-engineering-fabric-v1');
  assert.equal(actual.protocol_extension,'powerhouse-fast-development-protocol-v2');
  assert.equal(actual.authority.production_promotion,'BG169');
  assert.equal(actual.authority.creates_parallel_authority,false);
  assert.equal(actual.affected_testing.fast_path_never_replaces_release_gates,true);
  assert.equal(actual.cache.never_skips_production_readback,true);
  assert.equal(actual.version,3);
  assert.equal(actual.scheduling.rolling_candidate.one_candidate_per_conflict_contract,true);
  assert.equal(actual.migration_versioning.authority,'rolling-candidate-integrator');
  assert.equal(actual.migration_versioning.wall_clock_only_allocation_forbidden,true);
  assert.equal(actual.recovery.head_age_alone_never_cancels_in_progress,true);
  assert.ok(actual.cache.inputs.includes('schemaDigest'));
  const validation = await validateParallelEngineeringFabric(); assert.deepEqual(validation.errors,[]); assert.equal(validation.ok,true);
});

test('fabric CLI exposes canonical readiness', () => {
  const parsed = JSON.parse(execFileSync(process.execPath,['scripts/brain/parallel-engineering-fabric.mjs','--check'],{encoding:'utf8'}));
  assert.equal(parsed.status,'PARALLEL_ENGINEERING_READY');
});
