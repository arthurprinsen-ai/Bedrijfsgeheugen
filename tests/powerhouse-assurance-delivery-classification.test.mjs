import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(fs.readFileSync('config/brain-delivery-system.json', 'utf8'));
const assurancePaths = [
  'powerhouse/assurance/component-registry.json',
  'powerhouse/assurance/portal-v2-parity.json',
  'scripts/powerhouse-assurance-check.mjs',
  'tests/powerhouse-assurance.test.mjs',
  'tests/powerhouse-assurance-delivery-classification.test.mjs',
  'docs/powerhouse/POWERHOUSE_ASSURANCE_LAYER.md',
  'docs/portal-v2-parity-architecture.md',
];

test('Powerhouse assurance control-plane paths are classified by the canonical delivery policy', () => {
  const plan = createDeliveryPlan({
    changedPaths: assurancePaths,
    headSha: '0123456789abcdef0123456789abcdef01234567',
    policy,
  });
  assert.ok(plan.lanes.some((lane) => lane.id === 'backend'));
});

test('Powerhouse assurance documentation does not require an unrelated public website lane', () => {
  const plan = createDeliveryPlan({
    changedPaths: [
      'docs/powerhouse/POWERHOUSE_ASSURANCE_LAYER.md',
      'docs/portal-v2-parity-architecture.md',
    ],
    headSha: '0123456789abcdef0123456789abcdef01234567',
    policy,
  });
  assert.deepEqual(plan.lanes.map((lane) => lane.id), []);
});
