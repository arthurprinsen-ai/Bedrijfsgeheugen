import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contractPath = 'config/make-agent-learning-promotion.json';

async function readContract() {
  return JSON.parse(await readFile(contractPath, 'utf8'));
}

test('BG168 caller-side materiality promotion stays blocked until runtime evidence is complete', async () => {
  const contract = await readContract();

  assert.equal(contract.version, 'MAKE-AGENT-LEARNING-PROMOTION-v1');
  assert.equal(contract.ownerAgent, 'Powerhouse Production Promotion Guardian');
  assert.equal(contract.stagingScenarioId, 7165093);
  assert.equal(contract.targetLearningScenarioId, 7136176);
  assert.equal(contract.state, 'BLOCKED_PENDING_RUNTIME_EVIDENCE');
  assert.equal(contract.blueprintGreenIsProductionGreen, false);
  assert.equal(contract.ciGreenIsRuntimeGreen, false);
  assert.equal(contract.promotionAllowed, false);
});

test('promotion contract requires all three runtime proofs and bounded cost evidence', async () => {
  const contract = await readContract();

  for (const proof of [
    'non_material_exact_primary_result',
    'non_material_zero_BG168_calls',
    'material_exact_primary_result',
    'material_BG168_dispatch_observed',
    'learning_failure_preserves_primary_result',
    'credit_cost_bounded_vs_baseline'
  ]) {
    assert.ok(contract.requiredRuntimeEvidence.includes(proof), `missing runtime proof ${proof}`);
  }

  for (const invariant of [
    'primary_result_independent_of_optional_learning',
    'uncertain_outcome_defaults_to_material',
    'no_live_multi_step_partial_topology',
    'readback_before_retry_after_429_or_502',
    'no_production_promotion_from_blueprint_or_CI_alone'
  ]) {
    assert.ok(contract.protectedInvariants.includes(invariant), `missing protected invariant ${invariant}`);
  }
});

test('promotion requires exact staging identity and one-component-at-a-time rollout', async () => {
  const contract = await readContract();

  assert.equal(contract.promotionStrategy.stagingFirst, true);
  assert.equal(contract.promotionStrategy.oneAgentAtATime, true);
  assert.equal(contract.promotionStrategy.requireExactScenarioReadback, true);
  assert.equal(contract.promotionStrategy.rollbackOnCreditSlopeRegression, true);
  assert.equal(contract.promotionStrategy.rollbackOnPrimaryResultRegression, true);
  assert.equal(contract.promotionStrategy.keepBG167CanonicalOwner, 'BG166');
});
