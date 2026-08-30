import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const incident = JSON.parse(await readFile('brain/learning/incidents/delivery-learning-test-family-unclassified-2026-08-30.json', 'utf8'));
const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

test('delivery learning-test classification incident remains machine-readable and guarded', () => {
  assert.equal(incident.version, 'DELIVERY-LEARNING-TEST-FAMILY-UNCLASSIFIED-v1');
  assert.equal(incident.fingerprint, 'delivery|classifier|learning-test-family-unclassified-v1');
  assert.equal(incident.status, 'GUARDED');
  assert.ok(incident.failedApproaches.length >= 4);
  assert.ok(incident.preventionRules.length >= 5);
});

test('incident regression contract matches live delivery classifier behavior', () => {
  for (const path of incident.regressionContract.mustClassifyAsBackend) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abc123def4567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend']);
  }
  for (const path of incident.regressionContract.mustRemainUnclassified) {
    assert.throws(() => createDeliveryPlan({ changedPaths:[path], headSha:'abc123def4567890', policy }), /unclassified delivery path/);
  }
});
