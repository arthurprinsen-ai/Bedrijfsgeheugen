import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan, deriveConflictContracts } from '../tools/brain-delivery-system.mjs';

test('canonical shell source files are classified as bounded website delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const path = '.github/canoniek/kop.html';
  const plan = createDeliveryPlan({ changedPaths:[path], headSha:'cab1ca1123456789', policy });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['website']);
  assert.ok(deriveConflictContracts([path], policy).includes('website-shell-contract'));
});
