import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('observed GitHub PR scheduling anomaly remains durable without inventing a root cause', async () => {
  const incident = JSON.parse(await readFile('brain/learning/incidents/github-pr-reused-head-no-workflow-run-2026-08-31.json','utf8'));
  assert.equal(incident.fingerprint, 'github|pull-request|reused-head-pr-event-no-workflow-run-v1');
  assert.equal(incident.status, 'OBSERVED');
  assert.equal(incident.rootCause, 'UNKNOWN_NOT_YET_PROVEN');
  assert.match(incident.safeContainment, /Do not merge from push-only evidence/i);
  assert.match(incident.promotionRule, /Do not promote/i);
  assert.ok(Array.isArray(incident.failedApproaches) && incident.failedApproaches.length >= 3);
});
