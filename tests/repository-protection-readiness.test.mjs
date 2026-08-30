import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeMainProtectionReady } from '../scripts/brain/writer-certification-state.mjs';

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

test('main protection readiness equals the canonical writer proof computation', () => {
  assert.equal(state.mainProtectionReady, computeMainProtectionReady(state.writers),
    'mainProtectionReady must equal the evidence-derived writer readiness state');
});

test('operational verification alone can never unlock writer proof readiness', () => {
  const operationalOnly = state.writers.map((writer) => ({
    ...writer,
    candidateMode: 'operational_verified',
    structuralContractVerified: true,
    operationalCandidateVerified: true,
    parityVerified: false,
    rollbackVerified: false,
    merged: true,
  }));
  assert.equal(computeMainProtectionReady(operationalOnly), false);
});

test('ready writer proof state requires verified parity and rollback lineage for every writer', () => {
  if (!state.mainProtectionReady) return;
  for (const writer of state.writers) {
    assert.equal(writer.parityVerified, true);
    assert.equal(writer.rollbackVerified, true);
    assert.equal(writer.parityRollbackEvidence?.truth_status, 'VERIFIED');
    assert.equal(writer.parityRollbackEvidence?.status, 'COMPLETED');
    assert.equal(writer.parityRollbackEvidence?.outcome_router, 'BG168');
    assert.equal(writer.parityRollbackEvidence?.current_state_projection, 'BG167');
    assert.match(writer.parityRollbackEvidence?.evidenceRef || '', /^github-run:\d+:writer:[a-z0-9-]+$/);
  }
});

test('prepared candidate PRs are not misrepresented as completed migration', () => {
  for (const writer of state.writers.filter((item) => item.candidateMode === 'prepared')) {
    assert.equal(typeof writer.pullRequest, 'number');
    assert.equal(writer.parityVerified, false);
    assert.equal(writer.rollbackVerified, false);
    assert.equal(writer.merged, false);
  }
});
