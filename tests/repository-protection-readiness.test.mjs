import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeMainProtectionReady, computeWriterMigrationReady } from '../scripts/brain/writer-certification-state.mjs';

const state = JSON.parse(fs.readFileSync('config/repository-writer-migration.json', 'utf8'));
const expected = [
  'approved-central-blog',
  'blog-bijwerken',
  'menu-balk-fix',
  'paginacontrole',
  'regelgeving-bijwerken',
  'seo-controle',
  'weekblog',
].sort();
const REQUIRED_CHECKS = ['Shared Agent Memory Tests', 'BRAIN delivery'];
const CURRENT_MAIN_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function protectedEvidence(overrides = {}) {
  return {
    observed: true,
    protected: true,
    rulesetsCount: 1,
    observedMainSha: CURRENT_MAIN_SHA,
    requiredChecks: [...REQUIRED_CHECKS],
    ...overrides,
  };
}

test('migration state covers every governed direct-main writer exactly once', () => {
  const names = state.writers.map((writer) => writer.name).sort();
  assert.deepEqual(names, expected);
  assert.equal(new Set(names).size, names.length);
});

test('writer migration readiness remains evidence-derived and distinct from live native protection', () => {
  const allReady = state.writers.every((writer) =>
    writer.candidateMode === 'operational_verified' &&
    writer.operationalCandidateVerified === true &&
    writer.parityVerified === true &&
    writer.rollbackVerified === true &&
    writer.merged === true
  );
  assert.equal(computeWriterMigrationReady(state.writers), allReady);
  assert.equal(state.mainProtectionReady, allReady,
    'legacy migration state currently records writer readiness, not authoritative live GitHub protection');
});

test('operational verification alone can never unlock writer migration readiness without parity and rollback', () => {
  const operationalOnly = state.writers.map((writer) => ({
    ...writer,
    candidateMode:'operational_verified',
    structuralContractVerified:true,
    operationalCandidateVerified:true,
    parityVerified:false,
    rollbackVerified:false,
    merged:true,
    parityRollbackEvidence:undefined,
  }));
  assert.equal(operationalOnly.every((writer) => writer.structuralContractVerified === true), true);
  assert.equal(operationalOnly.every((writer) => writer.operationalCandidateVerified === true), true);
  assert.equal(operationalOnly.every((writer) => writer.candidateMode === 'operational_verified'), true);
  assert.equal(operationalOnly.some((writer) => writer.parityVerified !== true), true);
  assert.equal(operationalOnly.some((writer) => writer.rollbackVerified !== true), true);
  assert.equal(computeWriterMigrationReady(operationalOnly), false);
});

test('prepared candidate PRs are not misrepresented as completed migration', () => {
  for (const writer of state.writers.filter((item) => item.candidateMode === 'prepared')) {
    assert.equal(typeof writer.pullRequest, 'number');
    assert.equal(writer.parityVerified, false);
    assert.equal(writer.rollbackVerified, false);
    assert.equal(writer.merged, false);
  }
});

test('writer readiness can never be misrepresented as live native main protection', () => {
  assert.equal(
    computeMainProtectionReady(state.writers, protectedEvidence({ protected:false, rulesetsCount:0 }), { currentMainSha:CURRENT_MAIN_SHA, requiredChecks:REQUIRED_CHECKS }),
    false,
    'all writer migration proofs are insufficient while GitHub reports main as unprotected'
  );
});

test('missing native GitHub evidence always fails closed even when legacy migration state is green', () => {
  assert.equal(state.mainProtectionReady, true);
  assert.equal(computeMainProtectionReady(state.writers, undefined, { currentMainSha:CURRENT_MAIN_SHA, requiredChecks:REQUIRED_CHECKS }), false);
});

test('ruleset evidence is mandatory for native main protection readiness', () => {
  assert.equal(
    computeMainProtectionReady(state.writers, protectedEvidence({ rulesetsCount:0 }), { currentMainSha:CURRENT_MAIN_SHA, requiredChecks:REQUIRED_CHECKS }),
    false
  );
});

test('stale native protection evidence from an older main SHA always fails closed', () => {
  assert.equal(
    computeMainProtectionReady(state.writers, protectedEvidence({ observedMainSha:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }), { currentMainSha:CURRENT_MAIN_SHA, requiredChecks:REQUIRED_CHECKS }),
    false
  );
});

test('missing required protection checks always fails closed', () => {
  assert.equal(
    computeMainProtectionReady(state.writers, protectedEvidence({ requiredChecks:['Shared Agent Memory Tests'] }), { currentMainSha:CURRENT_MAIN_SHA, requiredChecks:REQUIRED_CHECKS }),
    false
  );
});

test('main protection readiness requires fresh native GitHub protection, ruleset and required-check evidence', () => {
  assert.equal(
    computeMainProtectionReady(state.writers, protectedEvidence(), { currentMainSha:CURRENT_MAIN_SHA, requiredChecks:REQUIRED_CHECKS }),
    true
  );
});
