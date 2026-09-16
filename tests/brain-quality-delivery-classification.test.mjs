import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('Quality Intelligence control-plane paths are narrowly backend delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const paths = [
    'config/powerhouse-quality-autopilot.json',
    'config/powerhouse-vulnerability-baseline.json',
    'contracts/openapi/powerhouse-public-api.yaml',
    '.github/workflows/powerhouse-quality-intelligence.yml',
    '.github/workflows/powerhouse-quality-surface-gate.yml',
    'scripts/brain/powerhouse-quality-intelligence.mjs',
    'scripts/brain/quality/surface-discovery.mjs',
    'tests/brain-quality-autopilot.test.mjs',
  ];
  for (const path of paths) {
    const plan = createDeliveryPlan({ changedPaths: [path], headSha: 'abcdef1234567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend'], `${path} must be backend delivery work`);
  }
});

test('Quality delivery scoping does not weaken unknown-path fail closed behavior', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  assert.throws(
    () => createDeliveryPlan({ changedPaths: ['contracts/unowned-future-api/spec.yaml'], headSha: 'abcdef1234567890', policy }),
    /unclassified delivery path/,
  );
});
