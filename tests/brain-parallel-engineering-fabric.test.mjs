import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExecutionPlan,
  selectAffectedTests,
  buildCacheIdentity,
  buildSpeculativeIntegrations
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
  fingerprint: 'powerhouse-parallel-engineering-fabric-v1',
  version: 1,
  fail_closed_unknown_material_scope: true,
  test_profiles: {
    docs: ['docs-contract'],
    backend: ['backend-unit', 'backend-contract'],
    website: ['website-unit', 'website-visual'],
    control_plane: ['engineering-os', 'delivery-contract', 'security'],
    full: ['required']
  }
};

test('independent backend and website packages execute in the same wave', () => {
  const plan = buildExecutionPlan({
    workPackages: [
      { id: 'A', component: 'backend', paths: ['brain/a.mjs'], baseSha: 'base', candidateSha: 'a' },
      { id: 'B', component: 'website', paths: ['site/home.js'], baseSha: 'base', candidateSha: 'b' }
    ], deliveryConfig, policy
  });
  assert.deepEqual(plan.waves.map(w => w.map(p => p.id)), [['A', 'B']]);
});

test('packages sharing a conflict contract serialize deterministically', () => {
  const plan = buildExecutionPlan({
    workPackages: [
      { id: 'B', component: 'backend', paths: ['scripts/brain/b.mjs'], baseSha: 'base', candidateSha: 'b' },
      { id: 'A', component: 'backend', paths: ['config/a.json'], baseSha: 'base', candidateSha: 'a' }
    ], deliveryConfig, policy
  });
  assert.deepEqual(plan.waves.map(w => w.map(p => p.id)), [['A'], ['B']]);
});

test('explicit dependencies order waves even without path overlap', () => {
  const plan = buildExecutionPlan({
    workPackages: [
      { id: 'A', component: 'backend', paths: ['brain/a.mjs'], baseSha: 'base', candidateSha: 'a' },
      { id: 'B', component: 'website', paths: ['site/b.js'], dependsOn: ['A'], baseSha: 'base', candidateSha: 'b' }
    ], deliveryConfig, policy
  });
  assert.deepEqual(plan.waves.map(w => w.map(p => p.id)), [['A'], ['B']]);
});

test('missing dependency targets and cycles fail closed', () => {
  assert.throws(() => buildExecutionPlan({ workPackages: [{ id: 'A', paths: ['brain/a.mjs'], dependsOn: ['Z'], baseSha: 'b', candidateSha: 'a' }], deliveryConfig, policy }), /missing dependency/i);
  assert.throws(() => buildExecutionPlan({ workPackages: [
    { id: 'A', paths: ['brain/a.mjs'], dependsOn: ['B'], baseSha: 'b', candidateSha: 'a' },
    { id: 'B', paths: ['site/b.js'], dependsOn: ['A'], baseSha: 'b', candidateSha: 'c' }
  ], deliveryConfig, policy }), /cycle/i);
});

test('affected tests use minimal docs profile for known non-executable docs', () => {
  const affected = selectAffectedTests({ paths: ['docs/learning/x.md'], deliveryConfig, policy });
  assert.deepEqual(affected.profiles, ['docs-contract']);
  assert.equal(affected.failClosed, false);
});

test('control-plane changes expand to protected control-plane profile', () => {
  const affected = selectAffectedTests({ paths: ['config/powerhouse-engineering-os.json'], deliveryConfig, policy });
  assert.deepEqual(affected.profiles, ['delivery-contract', 'engineering-os', 'security']);
  assert.deepEqual(affected.contracts, ['delivery-control-plane']);
});

test('unknown material scope fails closed', () => {
  const affected = selectAffectedTests({ paths: ['mystery/runtime.bin'], deliveryConfig, policy });
  assert.equal(affected.failClosed, true);
  assert.deepEqual(affected.profiles, ['required']);
  assert.match(affected.reason, /unknown material scope/i);
});

test('cache identity is stable across path and profile ordering but changes with candidate identity', () => {
  const a = buildCacheIdentity({ baseSha: 'base', candidateSha: 'c1', paths: ['b', 'a'], contracts: ['y', 'x'], tests: ['t2', 't1'], policyVersion: 1 });
  const b = buildCacheIdentity({ baseSha: 'base', candidateSha: 'c1', paths: ['a', 'b'], contracts: ['x', 'y'], tests: ['t1', 't2'], policyVersion: 1 });
  const c = buildCacheIdentity({ baseSha: 'base', candidateSha: 'c2', paths: ['a', 'b'], contracts: ['x', 'y'], tests: ['t1', 't2'], policyVersion: 1 });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test('speculative integrations include only conflict-free packages from the same wave', () => {
  const plan = buildExecutionPlan({
    workPackages: [
      { id: 'A', paths: ['brain/a.mjs'], baseSha: 'base', candidateSha: 'a' },
      { id: 'B', paths: ['site/b.js'], baseSha: 'base', candidateSha: 'b' },
      { id: 'C', paths: ['config/c.json'], baseSha: 'base', candidateSha: 'c' },
      { id: 'D', paths: ['scripts/brain/d.mjs'], baseSha: 'base', candidateSha: 'd' }
    ], deliveryConfig, policy
  });
  const combos = buildSpeculativeIntegrations(plan).map(x => x.packageIds.join('+'));
  assert.ok(combos.includes('A+B'));
  assert.ok(!combos.includes('C+D'));
});

test('exact base and candidate identities are mandatory', () => {
  assert.throws(() => buildExecutionPlan({ workPackages: [{ id: 'A', paths: ['brain/a.mjs'] }], deliveryConfig, policy }), /identity/i);
});
