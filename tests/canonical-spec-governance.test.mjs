import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan, deriveConflictContracts } from '../tools/brain-delivery-system.mjs';

test('canonical architecture specs are governed by all BRAIN lanes and delivery-control-plane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const canonicalPath = 'docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md';
  const plan = createDeliveryPlan({ changedPaths:[canonicalPath], headSha:'deadcafe12345678', policy });
  assert.deepEqual(plan.ignoredPaths, []);
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation','backend','portal','website']);
  assert.deepEqual(deriveConflictContracts([canonicalPath], policy), ['delivery-control-plane']);
  assert.equal(policy.ignoredPaths.includes('docs/superpowers/'), false);
});
