import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const state = JSON.parse(fs.readFileSync('config/repository-writer-migration.json', 'utf8'));
const lessons = JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json', 'utf8'));
const prevention = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json', 'utf8'));
const expected = [
  'approved-central-blog',
  'blog-bijwerken',
  'menu-balk-fix',
  'paginacontrole',
  'regelgeving-bijwerken',
  'seo-controle',
  'weekblog',
].sort();

test('migration state covers every governed direct-main writer exactly once', () => {
  const names = state.writers.map((writer) => writer.name).sort();
  assert.deepEqual(names, expected);
  assert.equal(new Set(names).size, names.length);
});

test('main protection cannot become ready before every writer has operational migration, parity, rollback and merge evidence', () => {
  const allReady = state.writers.every((writer) =>
    writer.candidateMode === 'verified' &&
    writer.operationalCandidateVerified === true &&
    writer.parityVerified === true &&
    writer.rollbackVerified === true &&
    writer.merged === true
  );
  assert.equal(state.mainProtectionReady, allReady,
    'mainProtectionReady must equal the evidence-derived operational readiness state');
});

test('structural verification alone can never unlock main protection', () => {
  assert.equal(state.writers.every((writer) => writer.structuralContractVerified === true), true);
  assert.equal(state.writers.some((writer) => writer.operationalCandidateVerified !== true), true);
  assert.equal(state.mainProtectionReady, false);
});

test('prepared candidate PRs are not misrepresented as completed migration', () => {
  for (const writer of state.writers.filter((item) => item.candidateMode === 'prepared')) {
    assert.equal(typeof writer.pullRequest, 'number');
    assert.equal(writer.parityVerified, false);
    assert.equal(writer.rollbackVerified, false);
    assert.equal(writer.merged, false);
  }
});

test('fresh approved writer shadow proof resolves the repository PR creation boundary without overclaiming other writers', () => {
  assert.equal(state.prCreationBoundary?.status, 'RESOLVED_PROVEN');
  assert.equal(state.prCreationBoundary?.evidenceCandidatePullRequest, 348);
  assert.equal(state.prCreationBoundary?.evidenceShadowRunId, 33313232371);
  assert.equal(state.prCreationBoundary?.evidenceArtifact, 'repo-writer-shadow-evidence-348');
  assert.equal(state.prCreationBoundary?.evidenceArtifactDigest, 'sha256:6dd7457f58770da8abc43630670a236f22a5a276839012de65e00280f461e2b6');
  const approved = state.writers.find((writer) => writer.name === 'approved-central-blog');
  assert.equal(approved?.candidateMode, 'operational_candidate_verified');
  assert.equal(approved?.operationalCandidateVerified, true);
  assert.equal(approved?.evidenceCandidatePullRequest, 348);
  assert.equal(approved?.evidenceShadowRunId, 33313232371);
  assert.equal(state.mainProtectionReady, false);
});

test('Brain learning replaces the resolved permission block with explicit recursive-trigger and exact-identity prevention', () => {
  const oldBlock = prevention.rules.find((rule) => rule.id === 'BLOCK_WRITER_CANARY_WHEN_ACTIONS_PR_CREATION_DISABLED');
  assert.equal(oldBlock?.active, false);
  for (const id of ['EXPLICIT_SHADOW_DISPATCH_FOR_ACTIONS_WRITER_PRS', 'SHADOW_EVIDENCE_BINDS_PR_API_IDENTITY']) {
    assert.equal(prevention.rules.find((rule) => rule.id === id)?.active, true, `${id} must be active`);
  }
  assert.equal(lessons.lessons.some((lesson) => lesson.preventionRule === 'EXPLICIT_SHADOW_DISPATCH_FOR_ACTIONS_WRITER_PRS' && lesson.status === 'PROVEN'), true);
  assert.equal(lessons.lessons.some((lesson) => lesson.preventionRule === 'SHADOW_EVIDENCE_BINDS_PR_API_IDENTITY' && lesson.status === 'PROVEN'), true);
});
