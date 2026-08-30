import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('ignored-only documentation change creates a valid zero-lane delivery plan', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths:['docs/superpowers/plans/2026-08-30-rollout-notes.md'],
    headSha:'abcdef1234567890',
    policy,
  });
  assert.deepEqual(plan.lanes, []);
  assert.equal(plan.integration.required, false);
});

test('workflow explicitly skips lane matrix and still completes handoff for zero-lane plans', async () => {
  const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
  assert.match(workflow, /has_lanes:\s*\$\{\{\s*steps\.plan\.outputs\.has_lanes\s*\}\}/);
  assert.match(workflow, /if:\s*needs\.plan\.outputs\.has_lanes\s*==\s*'true'/);
  assert.match(workflow, /needs\.lanes\.result\s*==\s*'skipped'/);
  assert.match(workflow, /No executable delivery lanes; ignored-only change is a successful no-op/);
});
