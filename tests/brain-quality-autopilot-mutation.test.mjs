import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTOPILOT_FINGERPRINT,
  V2_FINGERPRINT,
  FINGERPRINT,
  validateQualityAutopilotContract,
} from '../scripts/brain/powerhouse-quality-intelligence.mjs';

const CAPABILITIES = ['deep_sensor_history','dynamic_surface_discovery','vulnerability_delta_gate','test_effectiveness_learning','business_invariant_shadow','escaped_defect_prevention_rate','performance_root_cause_attribution','safe_game_days','innovation_self_benchmarking'];
const NON_GREEN = ['RED','UNKNOWN','NOT_REGISTERED','UNTESTED'];

const autopilot = () => ({
  fingerprint: AUTOPILOT_FINGERPRINT,
  extends: V2_FINGERPRINT,
  release_authority: FINGERPRINT,
  capabilities: [...CAPABILITIES],
  green_states: ['GREEN'],
  non_green_states: [...NON_GREEN],
  deep_sensor_history: { installed_is_proven: false, history_required: true },
  learning: { authority: 'BRAIN-CLOSED-LOOP-v1', parallel_store_forbidden: true, critical_test_auto_removal: false },
  game_days: { production_destructive_forbidden: true },
  innovation: { auto_promote_without_benchmark: false },
  registration_obligations: {
    openapi_api_contract: 'fail_closed_until_registered',
    postgres_testcontainers_profile: 'fail_closed_until_registered',
  },
});

const onlyGap = (result, expected) => {
  assert.equal(result.ok, false);
  assert.deepEqual(result.gaps, [expected]);
};

test('complete Autopilot contract is exactly green', () => {
  assert.deepEqual(validateQualityAutopilotContract(autopilot()), { ok: true, gaps: [] });
});

test('Autopilot rejects scalar authority and safety mutations exactly', () => {
  const cases = [
    [c => { c.fingerprint = 'wrong'; }, `fingerprint must be ${AUTOPILOT_FINGERPRINT}`],
    [c => { c.extends = 'wrong'; }, `autopilot must extend ${V2_FINGERPRINT}`],
    [c => { c.release_authority = 'wrong'; }, 'v1 must remain release authority'],
    [c => { c.green_states = ['GREEN','RED']; }, 'GREEN must remain the only green state'],
    [c => { c.deep_sensor_history.installed_is_proven = true; }, 'installed sensors must not count as proven without history'],
    [c => { c.deep_sensor_history.history_required = false; }, 'installed sensors must not count as proven without history'],
    [c => { c.learning.authority = 'parallel'; }, 'autopilot learning must reuse BRAIN-CLOSED-LOOP-v1 without a parallel store'],
    [c => { c.learning.parallel_store_forbidden = false; }, 'autopilot learning must reuse BRAIN-CLOSED-LOOP-v1 without a parallel store'],
    [c => { c.learning.critical_test_auto_removal = true; }, 'critical tests may not be auto-removed'],
    [c => { c.game_days.production_destructive_forbidden = false; }, 'destructive production game days must be forbidden'],
    [c => { c.innovation.auto_promote_without_benchmark = true; }, 'innovation may not auto-promote without benchmark evidence'],
    [c => { c.registration_obligations.openapi_api_contract = 'optional'; }, 'OpenAPI/API contract registration must fail closed'],
    [c => { c.registration_obligations.postgres_testcontainers_profile = 'optional'; }, 'PostgreSQL/Testcontainers registration must fail closed'],
  ];
  for (const [mutate, expected] of cases) {
    const c = autopilot(); mutate(c); onlyGap(validateQualityAutopilotContract(c), expected);
  }
});

test('Autopilot rejects every missing capability', () => {
  for (const item of CAPABILITIES) {
    const c = autopilot(); c.capabilities = CAPABILITIES.filter(x => x !== item);
    onlyGap(validateQualityAutopilotContract(c), `autopilot capabilities missing: ${item}`);
  }
});

test('Autopilot rejects every missing non-green state', () => {
  for (const item of NON_GREEN) {
    const c = autopilot(); c.non_green_states = NON_GREEN.filter(x => x !== item);
    onlyGap(validateQualityAutopilotContract(c), `non-green state missing: ${item}`);
  }
});

test('missing Autopilot policy subtrees fail closed instead of throwing', () => {
  for (const key of ['deep_sensor_history','learning','game_days','innovation','registration_obligations']) {
    const c = autopilot(); delete c[key];
    const result = validateQualityAutopilotContract(c);
    assert.equal(result.ok, false);
    assert.ok(result.gaps.length > 0);
  }
});
