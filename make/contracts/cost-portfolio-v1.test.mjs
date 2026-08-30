import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contractPath = new URL('./cost-portfolio-v1.json', import.meta.url);

test('Make cost portfolio contract is fail-closed and BRAIN governed', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));

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

  assert.deepEqual(
    contract.allowed_actions.filter(action => action.enabled).map(action => action.id).sort(),
    ['SAFE_POLLING_CHANGE', 'SAFE_SCHEDULE_CHANGE']
  );
  assert.ok(contract.allowed_actions.filter(action => !action.enabled).length > 0);

  assert.equal(contract.mission_control_policy.free_form_rewrite_allowed, false);
  assert.equal(contract.mission_control_policy.generic_cost_mutation_allowed, false);
  assert.equal(contract.mission_control_policy.promotion_executor, 'BG191');
  assert.equal(contract.mission_control_policy.shadow_insert_known_failed, true);
});
