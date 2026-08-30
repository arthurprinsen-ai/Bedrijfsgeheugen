import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('repository writer migration records the verified Actions PR boundary and immutable menu writer proof', async () => {
  const state = JSON.parse(await readFile('config/repository-writer-migration.json', 'utf8'));
  assert.equal(state.prCreationBoundary.status, 'RESOLVED_VERIFIED');
  assert.equal(state.prCreationBoundary.evidenceRunId, 33312942251);
  assert.equal(state.prCreationBoundary.evidencePullRequest, 343);
  assert.equal(state.prCreationBoundary.evidenceArtifactId, 9732547841);
  assert.equal(state.prCreationBoundary.requiredResolution, null);

  const menu = state.writers.find((writer) => writer.name === 'menu-balk-fix');
  assert.ok(menu);
  assert.equal(menu.candidateMode, 'operational_verified');
  assert.equal(menu.operationalCandidateVerified, true);
  assert.equal(menu.operationalEvidence.writerPullRequest, 343);
  assert.equal(menu.operationalEvidence.shadowRunId, 33312942251);
  assert.equal(menu.operationalEvidence.artifactId, 9732547841);
  assert.equal(menu.operationalEvidence.baseSha, '6240886f38ade95d61769048ce49e8280f8356cd');
  assert.equal(menu.operationalEvidence.headSha, '613ddfa3bae4d836aafa0e8546588923c391ca45');
  assert.equal(menu.operationalEvidence.pathPolicyVerified, true);
  assert.equal(menu.operationalEvidence.exactHeadVerified, true);
  assert.deepEqual(menu.operationalEvidence.changedFiles, ['writer-verification-menu-shadow-production-proof-20260830.html']);

  for (const writer of state.writers.filter((writer) => writer.name !== 'menu-balk-fix')) {
    assert.notEqual(writer.candidateMode, 'blocked_permission', `${writer.name}: global PR-creation permission boundary is resolved`);
  }
});
