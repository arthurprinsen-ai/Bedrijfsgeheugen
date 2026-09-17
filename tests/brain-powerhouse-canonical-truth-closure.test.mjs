import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLASSIFICATIONS,
  classifyClaim,
  evaluateAssurance,
  evaluateBusinessOutcomeLoop,
  evaluateMaterialClosure,
} from '../scripts/brain/powerhouse-canonical-truth-closure.mjs';

test('explicit synthetic production test state is terminal and non-material', () => {
  const result = classifyClaim({
    state: 'ACTIVE',
    scope: 'synthetic:p0-blocker-proof',
    evidence: { synthetic: true },
  }, { observed_at: '2026-09-16T19:00:00Z' });
  assert.equal(result.classification, CLASSIFICATIONS.SYNTHETIC_TEST_STATE);
  assert.equal(result.material, false);
});

test('fresh authority contradiction classifies an old claim as proven fixed', () => {
  const result = classifyClaim({
    claim: 'main_unprotected',
    updated_at: '2026-08-31T07:00:00Z',
  }, {
    observed_at: '2026-09-16T19:11:27Z',
    contradicts_claim: true,
    provenance: ['github:branches/main'],
  });
  assert.equal(result.classification, CLASSIFICATIONS.PROVEN_FIXED);
  assert.equal(result.material, false);
});

test('retired Make-only recovery path cannot remain an executable obligation', () => {
  const result = classifyClaim({
    dependency: 'Make',
    recovery_requires: ['BG168', 'BG166'],
  }, {
    observed_at: '2026-09-16T19:00:00Z',
    dependency_retired: true,
    canonical_replacement: 'Supabase/GitHub-native learning authority',
  });
  assert.equal(result.classification, CLASSIFICATIONS.RETIRED_DEPENDENCY);
  assert.equal(result.material, false);
});

test('current external provider boundary remains material', () => {
  const result = classifyClaim({ state: 'BLOCKED' }, {
    observed_at: '2026-09-16T19:35:45Z',
    external_boundary: true,
    error: 'NOTION_ACCESS',
  });
  assert.equal(result.classification, CLASSIFICATIONS.CURRENT_EXTERNAL_BOUNDARY);
  assert.equal(result.material, true);
});

test('missing fresh evidence fails closed', () => {
  const result = classifyClaim({ state: 'OPEN' }, {});
  assert.equal(result.classification, CLASSIFICATIONS.EVIDENCE_MISSING);
  assert.equal(result.material, true);
});

test('assurance requires fresh successful evidence for every required domain', () => {
  const result = evaluateAssurance({
    now: '2026-09-16T20:00:00Z',
    max_age_days: 90,
    required_domains: ['backup_restore', 'iam_review'],
    evidence: [{ domain: 'backup_restore', observed_at: '2026-09-15T20:00:00Z', success: true }],
  });
  assert.equal(result.proven, false);
  assert.deepEqual(result.blocking_domains, ['iam_review']);
});

test('synthetic outcome lineage never proves the commercial closed loop', () => {
  const result = evaluateBusinessOutcomeLoop({
    decision: { id: 'd1', production: true },
    action: { id: 'a1', decision_id: 'd1', production: true },
    provider_outcome: { id: 'o1', action_id: 'a1', production: true },
    impact: { provider_outcome_id: 'o1', revenue_eur: 100, production: true },
    calibration: { impact_id: 'o1', production: true },
    next_decision: { id: 'd2', calibration_applied: true, production: true },
    synthetic: true,
  });
  assert.equal(result.proven, false);
  assert.equal(result.reason, 'synthetic_lineage_not_accepted');
});

test('complete real production lineage proves the commercial closed loop', () => {
  const result = evaluateBusinessOutcomeLoop({
    decision: { id: 'd1', production: true },
    action: { id: 'a1', decision_id: 'd1', production: true },
    provider_outcome: { id: 'o1', action_id: 'a1', production: true },
    impact: { provider_outcome_id: 'o1', revenue_eur: 100, production: true },
    calibration: { impact_id: 'o1', production: true },
    next_decision: { id: 'd2', calibration_applied: true, changed_by_calibration: true, production: true },
  });
  assert.equal(result.proven, true);
});

test('closure is LIVE_BEWEZEN only with zero material claims and all proof lanes green', () => {
  const live = evaluateMaterialClosure({
    claims: [
      { classification: CLASSIFICATIONS.PROVEN_FIXED, material: false },
      { classification: CLASSIFICATIONS.SYNTHETIC_TEST_STATE, material: false },
    ],
    assurance: { proven: true },
    provider_readback: { proven: true },
    whole_brain: { proven: true },
    business_outcome_loop: { proven: true },
  });
  assert.equal(live.status, 'LIVE_BEWEZEN');

  const blocked = evaluateMaterialClosure({
    claims: [{ classification: CLASSIFICATIONS.CURRENT_EXTERNAL_BOUNDARY, material: true }],
    assurance: { proven: true },
    provider_readback: { proven: true },
    whole_brain: { proven: true },
    business_outcome_loop: { proven: true },
  });
  assert.equal(blocked.status, 'DEELS_LIVE');
  assert.equal(blocked.material_blockers, 1);
});