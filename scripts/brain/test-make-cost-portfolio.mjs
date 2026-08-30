import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contract = JSON.parse(await readFile('make/contracts/cost-portfolio-v1.json', 'utf8'));
const obligations = JSON.parse(await readFile('config/outcome-obligations.json', 'utf8'));

test('Make cost portfolio contract is fail-closed and BRAIN governed', () => {
  assert.equal(contract.version, 'MAKE-COST-PORTFOLIO-v1');
  assert.equal(contract.delivery_contract, 'BRAIN-DELIVERY-v2');
  assert.equal(contract.candidate_limit, 1);
  assert.equal(contract.selection_mode, 'TWO_STAGE_CHEAP_THEN_DEEP');
  assert.equal(contract.production_authority, 'BG169');
  assert.deepEqual(contract.shared_learning_path, ['BG168', 'BG166', 'BG167']);
  assert.ok(contract.required_evidence.includes('credits_per_verified_outcome'));
  assert.ok(contract.required_evidence.includes('protected_outcome_verification'));
  assert.ok(contract.required_evidence.includes('exact_rollback_state'));
  assert.ok(contract.required_evidence.includes('positive_net_savings'));
  assert.deepEqual(contract.allowed_actions.filter(action => action.enabled).map(action => action.id).sort(), ['SAFE_POLLING_CHANGE', 'SAFE_SCHEDULE_CHANGE']);
  assert.ok(contract.allowed_actions.filter(action => !action.enabled).length > 0);
  assert.equal(contract.mission_control_policy.free_form_rewrite_allowed, false);
  assert.equal(contract.mission_control_policy.generic_cost_mutation_allowed, false);
  assert.equal(contract.mission_control_policy.promotion_executor, 'BG191');
  assert.equal(contract.mission_control_policy.shadow_insert_known_failed, true);
});

test('daily Make portfolio decision remains an outcome obligation until evidenced', () => {
  const obligation = obligations.registeredObligations.find(item => item.id === 'cost-portfolio-decision-daily');
  assert.ok(obligation, 'cost-portfolio-decision-daily must be registered');
  assert.equal(obligation.domain, 'cost');
  assert.equal(obligation.ownerAgent, 'agent-cost');
  assert.equal(obligation.dueAt, 'daily_after_inventory_refresh');
  assert.equal(obligation.idempotencyKey, 'cost-portfolio|date|inventory-fingerprint');
  assert.match(obligation.evidencePolicy, /SAFE_OPTIMIZATION_CANDIDATE/);
  assert.match(obligation.evidencePolicy, /VERIFIED_NO_ACTION/);
  assert.match(obligation.evidencePolicy, /BLOCKED_HARD_BOUNDARY/);
  assert.match(obligation.evidencePolicy, /BG167/);
  assert.match(obligation.recoveryPolicy, /fingerprint/i);
  assert.match(obligation.recoveryPolicy, /duplicate/i);
});
