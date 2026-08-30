import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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

test('main protection cannot become ready before every writer has operational migration, parity, rollback and merge evidence', () => {
  const allReady = state.writers.every((writer) =>
    writer.candidateMode === 'operational_verified' &&
    writer.operationalCandidateVerified === true &&
    writer.parityVerified === true &&
    writer.rollbackVerified === true &&
    writer.merged === true
  );
  assert.equal(state.mainProtectionReady, allReady,
    'mainProtectionReady must equal the evidence-derived writer readiness state');
});

test('operational verification alone can never unlock main protection without parity and rollback', () => {
  assert.equal(state.writers.every((writer) => writer.structuralContractVerified === true), true);
  assert.equal(state.writers.every((writer) => writer.operationalCandidateVerified === true), true);
  assert.equal(state.writers.every((writer) => writer.candidateMode === 'operational_verified'), true);
  assert.equal(state.writers.some((writer) => writer.parityVerified !== true), true);
  assert.equal(state.writers.some((writer) => writer.rollbackVerified !== true), true);
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
