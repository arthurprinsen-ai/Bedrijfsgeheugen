import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path = 'brain/learning/incidents/github-pr-reused-head-no-workflow-run-2026-08-31.json';

test('canonical observed PR workflow incident requires stale-lineage prediagnosis before scheduling claims', async () => {
  const incident = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(incident.status, 'OBSERVED');
  assert.equal(incident.rootCause, 'UNKNOWN_NOT_YET_PROVEN');
  assert.ok(Array.isArray(incident.requiredPreDiagnosisChecks));
  assert.ok(incident.requiredPreDiagnosisChecks.includes('read current main SHA'));
  assert.ok(incident.requiredPreDiagnosisChecks.includes('check PR mergeability'));
  assert.ok(incident.requiredPreDiagnosisChecks.includes('check file and semantic overlap against current main'));
  assert.ok(Array.isArray(incident.provenEvidence));
  assert.ok(incident.provenEvidence.some(item => /148 commits/i.test(item)));
  assert.match(incident.safeContainment, /stale|mergeab|overlap/i);
  assert.match(incident.learningRule, /do not diagnose|must not diagnose|unknown/i);
});
