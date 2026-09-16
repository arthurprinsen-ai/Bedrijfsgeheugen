import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const AUTOPILOT_PATH = 'config/powerhouse-quality-autopilot.json';

test('Quality Intelligence v2 registers the Quality Autopilot maturity contract', () => {
  assert.equal(fs.existsSync(AUTOPILOT_PATH), true, `${AUTOPILOT_PATH} must exist`);
  const contract = JSON.parse(fs.readFileSync(AUTOPILOT_PATH, 'utf8'));
  assert.equal(contract.fingerprint, 'powerhouse-quality-autopilot-v2');
  assert.equal(contract.extends, 'powerhouse-quality-intelligence-v2');
  assert.equal(contract.release_authority, 'powerhouse-quality-intelligence-v1');
  assert.deepEqual(contract.green_states, ['GREEN']);
  for (const capability of [
    'deep_sensor_history',
    'dynamic_surface_discovery',
    'vulnerability_delta_gate',
    'test_effectiveness_learning',
    'business_invariant_shadow',
    'escaped_defect_prevention_rate',
    'performance_root_cause_attribution',
    'safe_game_days',
    'innovation_self_benchmarking',
  ]) {
    assert.equal(contract.capabilities.includes(capability), true, `missing ${capability}`);
  }
});
