import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
const controlPlaneBudget = JSON.parse(await readFile('config/control-plane-budget.json','utf8'));

test('repository schemas are classified as automation control-plane work', () => {
  const plan = createDeliveryPlan({
    changedPaths: ['schemas/delivery-evidence.schema.json'],
    headSha: 'a'.repeat(40),
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation']);
});


test('control-plane lifecycle tooling is classified as automation work', () => {
  const changedPaths = [
  "tests/build/artifact-id.test.mjs",
  "tests/netlify/ephemeral-janitor.test.mjs",
  "tests/notion/root-lifecycle.test.mjs",
  "tests/release-artifact-identity.test.mjs",
  "tests/supabase/edge-function-registry.test.mjs",
  "tools/build/artifact-id.mjs",
  "tools/build/release-evidence.mjs",
  "tools/netlify/ephemeral-janitor.mjs",
  "tools/notion/root-lifecycle.mjs",
  "tools/supabase/edge-function-registry.mjs"
];
  const plan = createDeliveryPlan({
    changedPaths,
    headSha: 'b'.repeat(40),
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation']);
  assert.deepEqual(plan.changedPaths, [...changedPaths].sort());
});

test('control-plane budget separates current ceilings from the canonical admission target', () => {
  const github = controlPlaneBudget.budgets.github;
  const baseline = controlPlaneBudget.baseline.github;
  assert.equal(github.maxDirectPrTriggerWorkflows, 10);
  assert.equal(github.maxDirectPrAdmissionWorkflows, 5);
  assert.equal(github.maxLifecyclePrAuthorityWorkflows, 5);
  assert.equal(github.targetDirectPrAdmissionWorkflows, 1);
  assert.equal(baseline.directPrTriggerCount, 10);
  assert.equal(baseline.directPrAdmissionCount, 5);
  assert.equal(baseline.lifecyclePrAuthorityCount, 5);
});


test('writer authority workflows are scoped to automation lane', () => {
  const plan = createDeliveryPlan({
    changedPaths: [
      '.github/workflows/repo-writer-candidate-shadow.yml',
      '.github/workflows/repo-writer-cheap-canary.yml',
      '.github/workflows/repo-writer-operational-verification.yml',
      '.github/workflows/repo-writer-parity-rollback.yml',
    ],
    headSha: 'c'.repeat(40),
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation']);
});
