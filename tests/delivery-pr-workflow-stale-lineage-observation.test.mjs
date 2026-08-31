import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const incidentPath = 'brain/learning/incidents/github-pr-workflow-stale-lineage-observation-2026-08-31.json';

test('missing PR workflow evidence stays OBSERVED until stale lineage and overlap are ruled out', async () => {
  const incident = JSON.parse(await readFile(incidentPath, 'utf8'));
  assert.equal(incident.fingerprint, 'github|pull-request|missing-workflow-evidence-with-stale-lineage-confounder-v1');
  assert.equal(incident.status, 'OBSERVED');
  assert.equal(incident.rootCause, 'UNKNOWN_NOT_YET_PROVEN');
  assert.equal(incident.autoPromoteToProven, false);
  assert.ok(incident.provenEvidence.some(item => item.includes('148 commits')));
  assert.ok(incident.requiredPreDiagnosisChecks.includes('read current main SHA'));
  assert.ok(incident.requiredPreDiagnosisChecks.includes('check PR mergeability'));
  assert.ok(incident.requiredPreDiagnosisChecks.includes('check file and semantic overlap against current main'));
  assert.match(incident.safeRule, /must not diagnose.*workflow scheduling/i);
});
