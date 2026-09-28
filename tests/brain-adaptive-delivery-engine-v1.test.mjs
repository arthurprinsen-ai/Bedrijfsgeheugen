import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAdaptiveDeliveryPlan } from '../tools/delivery/adaptive-delivery-engine.mjs';
import policy from '../config/powerhouse-adaptive-delivery-v1.json' with { type: 'json' };

test('docs-only work stays R0 and avoids the full shared suite', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['docs/notes/example.md'], policy });
  assert.equal(plan.risk, 'R0');
  assert.equal(plan.fullSharedSuite, false);
});

test('delivery control-plane work routes to capability-specific tests', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['.github/workflows/required-test.yml'], policy });
  assert.equal(plan.hot, true);
  assert.ok(['R2','R3','R4'].includes(plan.risk));
  assert.ok(plan.capabilities.includes('delivery-control-plane'));
  assert.ok(plan.tests.includes('tests/brain-ci-admission-single-flight.test.mjs'));
});

test('portal runtime receives production-grade risk and portal tests', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['portal-v2/app.js'], policy });
  assert.equal(plan.risk, 'R3');
  assert.equal(plan.fullSharedSuite, true);
  assert.ok(plan.capabilities.includes('portal-runtime'));
  assert.ok(plan.tests.includes('tests/portal-production-contract.test.mjs'));
});

test('Supabase changes escalate to R4 and remain fail-closed', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['supabase/migrations/20260928_x.sql'], policy });
  assert.equal(plan.risk, 'R4');
  assert.equal(plan.fullSharedSuite, true);
  assert.ok(plan.capabilities.includes('supabase-security'));
});

test('unknown path escalates instead of silently taking a cheap lane', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['future-runtime/new-engine.xyz'], policy });
  assert.equal(plan.risk, 'R3');
  assert.equal(plan.fullSharedSuite, true);
  assert.deepEqual(plan.unknownPaths, ['future-runtime/new-engine.xyz']);
});


test('Required test consumes adaptive outputs through the Integration Bundle before the heavy shared suite', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml', 'utf8');
  assert.match(workflow, /id: integration[\s\S]*integration-bundle-compiler\.mjs/);
  assert.match(workflow, /Verify adaptive and integration compiler regressions/);
  assert.match(workflow, /Execute fast impact quality gate[\s\S]*steps\.integration\.outputs\.full_shared_suite == 'false'/);
  assert.match(workflow, /Verify previously unwired test contracts[\s\S]*steps\.integration\.outputs\.full_shared_suite == 'true'/);
  assert.match(workflow, /Verify composable release control plane[\s\S]*steps\.integration\.outputs\.full_shared_suite == 'true'/);
});


test('nested low-risk learning path overrides broader brain runtime rule', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['brain/learning/example.json'], policy });
  assert.equal(plan.risk, 'R0');
  assert.equal(plan.fullSharedSuite, false);
});

test('specific production workflow rule outranks broad .github governance rule', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['.github/workflows/production-release-readback.yml'], policy });
  assert.equal(plan.risk, 'R4');
  assert.equal(plan.fullSharedSuite, true);
});


test('required-test hot root activates downstream capabilities through dependency graph', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['.github/workflows/required-test.yml'], policy });
  assert.equal(plan.risk, 'R2');
  assert.ok(plan.capabilities.includes('delivery-control-plane'));
  assert.ok(plan.capabilities.includes('brain-runtime'));
  assert.ok(plan.capabilities.includes('portal-runtime'));
  assert.ok(plan.capabilities.includes('website-runtime'));
  assert.ok(plan.capabilities.includes('automation-runtime'));
  assert.ok(plan.tests.includes('tests/brain-integration-bundle-compiler-v1.test.mjs'));
  assert.equal(plan.dependencyMatches.some(item => item.id === 'required-test-root'), true);
});

test('package manifest propagates to all runtime capabilities and raises risk floor to R3', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['package.json'], policy });
  assert.equal(plan.risk, 'R3');
  assert.ok(plan.capabilities.includes('brain-runtime'));
  assert.ok(plan.capabilities.includes('portal-runtime'));
  assert.ok(plan.capabilities.includes('website-runtime'));
  assert.ok(plan.capabilities.includes('automation-runtime'));
});

test('supabase authority roots remain R4 and propagate brain runtime evidence', () => {
  const plan = createAdaptiveDeliveryPlan({ changedPaths:['supabase/migrations/20260928_x.sql'], policy });
  assert.equal(plan.risk, 'R4');
  assert.ok(plan.capabilities.includes('supabase-security'));
  assert.ok(plan.capabilities.includes('brain-runtime'));
  assert.ok(plan.tests.includes('tests/control-plane-supabase-terminal-readback-v1.test.mjs'));
});
