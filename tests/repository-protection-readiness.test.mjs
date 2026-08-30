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
  const liveNativeProtection = {
    observed: true,
    protected: false,
    rulesetsCount: 0,
    observedMainSha: '8d7deda93fe400aa0aae129ceaf109abedb1cb2f',
  };
  assert.equal(
    computeMainProtectionReady(state.writers, liveNativeProtection),
    false,
    'all writer migration proofs are insufficient while GitHub reports main as unprotected'
  );
});

test('missing native GitHub evidence always fails closed even when legacy migration state is green', () => {
  assert.equal(state.mainProtectionReady, true);
  assert.equal(computeMainProtectionReady(state.writers), false);
});

test('main protection readiness requires positive native GitHub protection evidence', () => {
  const liveNativeProtection = {
    observed: true,
    protected: true,
    rulesetsCount: 1,
    observedMainSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };
  assert.equal(computeMainProtectionReady(state.writers, liveNativeProtection), true);
});
