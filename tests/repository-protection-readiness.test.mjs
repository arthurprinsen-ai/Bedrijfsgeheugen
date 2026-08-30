import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeWriterMigrationReady } from '../scripts/brain/writer-certification-state.mjs';

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

test('writer migration readiness is derived only from writer operational, parity, rollback and merge evidence', () => {
  const allReady = state.writers.every((writer) =>
    writer.candidateMode === 'operational_verified' &&
    writer.operationalCandidateVerified === true &&
    writer.parityVerified === true &&
    writer.rollbackVerified === true &&
    writer.merged === true
  );
  assert.equal(state.writerMigrationReady, allReady,
    'writerMigrationReady must equal the evidence-derived writer readiness state');
  assert.equal(state.writerMigrationReady, computeWriterMigrationReady(state.writers));
});

test('writer migration state never claims native GitHub main protection readiness', () => {
  assert.equal(Object.hasOwn(state, 'mainProtectionReady'), false,
    'native main protection must come from direct GitHub observation, never writer migration state');
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
