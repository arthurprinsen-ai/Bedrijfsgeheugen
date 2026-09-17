import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_COMPLETION_CATEGORIES, evaluateUniversalCompletion, assertUniversalCompletion } from '../scripts/brain/powerhouse-universal-completion-gate.mjs';

const evidence = (extra = {}) => ({ state: 'COMPLETE', evidence: [{ source: 'test', observedAt: '2026-09-17T09:15:00Z', ...extra }] });

function completeManifest() {
  return {
    version: 'POWERHOUSE-UNIVERSAL-COMPLETION-MANIFEST-v1',
    runId: 'run-1',
    terminalState: 'LIVE & BEWEZEN',
    candidateId: 'sha-abc',
    categories: Object.fromEntries(REQUIRED_COMPLETION_CATEGORIES.map(name => [name, evidence()])),
    openObligations: [],
    canonicalWriteback: ['brain/learning/example.json'],
    productionReadback: { candidateId: 'sha-abc', source: 'production', observedAt: '2026-09-17T09:15:00Z' }
  };
}

test('universal completion requires every category to be accounted for', () => {
  const manifest = completeManifest();
  delete manifest.categories.documentation;
  const result = evaluateUniversalCompletion(manifest);
  assert.equal(result.ok, false);
  assert.ok(result.failures.some(x => /documentation/.test(x)));
  assert.throws(() => assertUniversalCompletion(manifest), /UNIVERSAL_COMPLETION_BLOCKED/);
});

test('not-applicable is explicit and requires a reason', () => {
  const manifest = completeManifest();
  manifest.categories.cost_performance = { state: 'NOT_APPLICABLE', reason: 'No cost or performance behavior changed.' };
  assert.equal(evaluateUniversalCompletion(manifest).ok, true);
  manifest.categories.cost_performance = { state: 'NOT_APPLICABLE', reason: '' };
  assert.equal(evaluateUniversalCompletion(manifest).ok, false);
});

test('complete categories require evidence', () => {
  const manifest = completeManifest();
  manifest.categories.root_cause = { state: 'COMPLETE', evidence: [] };
  assert.equal(evaluateUniversalCompletion(manifest).ok, false);
});

test('LIVE & BEWEZEN requires zero open obligations, canonical writeback and exact-candidate production readback', () => {
  const manifest = completeManifest();
  assert.equal(evaluateUniversalCompletion(manifest).ok, true);

  const open = completeManifest();
  open.openObligations = [{ id: 'o1', state: 'OPEN' }];
  assert.equal(evaluateUniversalCompletion(open).ok, false);

  const noWriteback = completeManifest();
  noWriteback.canonicalWriteback = [];
  assert.equal(evaluateUniversalCompletion(noWriteback).ok, false);

  const staleCandidate = completeManifest();
  staleCandidate.productionReadback.candidateId = 'sha-other';
  assert.equal(evaluateUniversalCompletion(staleCandidate).ok, false);
});

test('material changes or failures make learning writeback mandatory', () => {
  const manifest = completeManifest();
  manifest.categories.learning_writeback = { state: 'NOT_APPLICABLE', reason: 'Nothing learned.' };
  assert.equal(evaluateUniversalCompletion(manifest).ok, false);
});

test('hard boundary is allowed only with explicit recovery path and evidence', () => {
  const manifest = completeManifest();
  manifest.terminalState = 'BLOCKED_HARD_BOUNDARY';
  manifest.openObligations = [{ id: 'external-provider', state: 'BLOCKED_HARD_BOUNDARY' }];
  manifest.hardBoundary = {
    reason: 'External provider cannot return exact final bytes.',
    evidence: [{ source: 'provider-readback', observedAt: '2026-09-17T09:15:00Z' }],
    recoveryPath: 'Retry exact provider readback when provider capability changes.'
  };
  assert.equal(evaluateUniversalCompletion(manifest).ok, true);

  delete manifest.hardBoundary.recoveryPath;
  assert.equal(evaluateUniversalCompletion(manifest).ok, false);
});

test('required categories cover complete Powerhouse closed-loop accountability', () => {
  for (const category of [
    'goal_context', 'actions', 'changed_components', 'decisions', 'errors_incidents',
    'root_cause', 'fixes', 'tests_gates', 'production_readback', 'outcome_value',
    'open_obligations', 'regression_prevention', 'documentation', 'learning_writeback',
    'architecture_adr_system_map', 'ownership_successor', 'security_privacy_secrets',
    'cost_performance', 'runtime_identity', 'interruption_recovery', 'evidence_lineage'
  ]) assert.ok(REQUIRED_COMPLETION_CATEGORIES.includes(category), `missing ${category}`);
});
