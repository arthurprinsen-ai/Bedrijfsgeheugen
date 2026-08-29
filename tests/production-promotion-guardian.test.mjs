import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateProductionPromotion } from '../tools/evaluate-production-promotion.mjs';

const policy = JSON.parse(await readFile(new URL('../config/production-promotion.json', import.meta.url), 'utf8'));

const base = {
  candidateSha: 'sha-green',
  candidateGreen: true,
  candidateEvidenceComplete: true,
  mainSha: 'sha-green',
  productionCommitRef: 'sha-green',
  deployState: 'ready',
  deployAgeSeconds: 60,
  smokePass: true,
  regressionPass: true,
  protectedMetricsPass: true,
  productionRegression: false,
  lastKnownGoodSha: 'sha-lkg',
  hardBoundary: false
};

test('production policy binds exact Bedrijfsgeheugen production ownership', () => {
  assert.equal(policy.ownerAgent, 'Powerhouse Production Promotion Guardian');
  assert.equal(policy.repository, 'arthurprinsen-ai/Bedrijfsgeheugen');
  assert.equal(policy.branch, 'main');
  assert.equal(policy.siteId, 'fd527056-493a-4d8a-8125-d00370104fa3');
  assert.equal(policy.greenCandidateCreatesProductionObligation, true);
  assert.equal(policy.productionExactShaRequired, true);
  assert.equal(policy.graceSeconds, 180);
  assert.deepEqual(policy.terminalStates, ['PRODUCTION_GREEN', 'ROLLED_BACK_GREEN', 'BLOCKED_HARD_BOUNDARY']);
  for (const required of ['candidate_tests','preview_or_equivalent','main_sha','production_commit_ref','deploy_ready','smoke','regression','protected_metrics']) {
    assert.ok(policy.requiredEvidence.includes(required), `missing required evidence ${required}`);
  }
});

test('green exact candidate not on main must be promoted rather than treated as done', () => {
  const result = evaluateProductionPromotion({ ...base, mainSha: 'sha-main-old' }, policy);
  assert.equal(result.state, 'PROMOTING_TO_MAIN');
  assert.equal(result.nextAction, 'PROMOTE_EXACT_CANDIDATE');
  assert.equal(result.obligationOpen, true);
});

test('red candidate remains repair work and never deploys', () => {
  const result = evaluateProductionPromotion({ ...base, candidateGreen: false }, policy);
  assert.equal(result.state, 'CANDIDATE_RED');
  assert.equal(result.nextAction, 'REPAIR_CANDIDATE');
  assert.equal(result.obligationOpen, true);
});

test('incomplete candidate evidence fails closed before promotion', () => {
  const result = evaluateProductionPromotion({ ...base, candidateEvidenceComplete: false }, policy);
  assert.equal(result.state, 'CANDIDATE_RED');
  assert.equal(result.nextAction, 'VERIFY_CANDIDATE');
});

test('main ahead of production inside grace waits for normal auto deploy', () => {
  const result = evaluateProductionPromotion({
    ...base,
    productionCommitRef: 'sha-prod-old',
    deployAgeSeconds: 120
  }, policy);
  assert.equal(result.state, 'DEPLOY_PENDING');
  assert.equal(result.nextAction, 'WAIT_FOR_AUTO_DEPLOY');
});

test('main ahead of production beyond grace requires autonomous deploy trigger', () => {
  const result = evaluateProductionPromotion({
    ...base,
    productionCommitRef: 'sha-prod-old',
    deployAgeSeconds: 181
  }, policy);
  assert.equal(result.state, 'DEPLOY_STALE');
  assert.equal(result.nextAction, 'TRIGGER_DEPLOY');
  assert.equal(result.obligationOpen, true);
});

test('ready deploy on the wrong SHA is never production green', () => {
  const result = evaluateProductionPromotion({
    ...base,
    productionCommitRef: 'wrong-sha',
    deployState: 'ready',
    deployAgeSeconds: 181
  }, policy);
  assert.notEqual(result.state, 'PRODUCTION_GREEN');
  assert.equal(result.nextAction, 'TRIGGER_DEPLOY');
});

test('exact ready production without smoke evidence remains verification work', () => {
  const result = evaluateProductionPromotion({ ...base, smokePass: false }, policy);
  assert.equal(result.state, 'VERIFYING_PRODUCTION');
  assert.equal(result.nextAction, 'VERIFY_PRODUCTION_EVIDENCE');
  assert.deepEqual(result.missingEvidence, ['smoke']);
});

test('exact SHA plus ready plus all required evidence is production green', () => {
  const result = evaluateProductionPromotion(base, policy);
  assert.equal(result.state, 'PRODUCTION_GREEN');
  assert.equal(result.nextAction, 'PRODUCTION_GREEN');
  assert.equal(result.obligationOpen, false);
  assert.equal(result.productionSha, 'sha-green');
});

test('production regression requires rollback to distinct LKG', () => {
  const result = evaluateProductionPromotion({ ...base, productionRegression: true }, policy);
  assert.equal(result.state, 'ROLLING_BACK');
  assert.equal(result.nextAction, 'ROLLBACK_TO_LKG');
  assert.equal(result.rollbackSha, 'sha-lkg');
});

test('production regression without distinct LKG remains red instead of guessing', () => {
  const result = evaluateProductionPromotion({
    ...base,
    productionRegression: true,
    lastKnownGoodSha: 'sha-green'
  }, policy);
  assert.equal(result.state, 'PRODUCTION_RED');
  assert.equal(result.nextAction, 'VERIFY_LAST_KNOWN_GOOD');
});

test('hard boundary is an explicit terminal state', () => {
  const result = evaluateProductionPromotion({
    ...base,
    hardBoundary: true,
    hardBoundaryReason: 'credentials change required'
  }, policy);
  assert.equal(result.state, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(result.obligationOpen, false);
});

test('superseded intermediate candidate closes only with explicit current-main supersession evidence', () => {
  const result = evaluateProductionPromotion({
    ...base,
    candidateSha: 'sha-intermediate',
    mainSha: 'sha-newest',
    supersededBySha: 'sha-newest'
  }, policy);
  assert.equal(result.state, 'MAIN_ACCEPTED');
  assert.equal(result.closedBySupersession, true);
  assert.equal(result.activeSha, 'sha-newest');
  assert.equal(result.obligationOpen, false);
  assert.equal(result.nextAction, 'RECONCILE_NEWEST_MAIN');
});

test('unproven supersession remains open', () => {
  const result = evaluateProductionPromotion({
    ...base,
    candidateSha: 'sha-intermediate',
    mainSha: 'other-main',
    supersededBySha: 'sha-newest'
  }, policy);
  assert.equal(result.state, 'CANDIDATE_GREEN');
  assert.equal(result.nextAction, 'VERIFY_SUPERSESSION');
  assert.equal(result.obligationOpen, true);
});
