import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validateContract } from '../scripts/brain/validate-universal-closed-loop-learning.mjs';

const canonical = JSON.parse(fs.readFileSync(new URL('../config/universal-closed-loop-learning.json', import.meta.url), 'utf8'));

test('canonical estate-wide closed-loop contract is ready', () => {
  const result = validateContract(canonical);
  assert.equal(result.ok, true, result.errors.join(', '));
});

test('fails closed when learning writeback is bypassed', () => {
  const broken = structuredClone(canonical);
  broken.required_lifecycle = broken.required_lifecycle.filter(x => x !== 'learning_writeback');
  broken.policies.dedupe_before_write = false;
  broken.cost_guards.fleet_wide_per_scenario_polling_for_errors = true;
  const result = validateContract(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('lifecycle.learning_writeback'));
  assert.ok(result.errors.includes('policy.dedupe_before_write'));
  assert.ok(result.errors.includes('cost_guard.fleet_wide_per_scenario_polling_for_errors'));
});

test('fails closed when canonical Brain routes disappear', () => {
  const broken = structuredClone(canonical);
  delete broken.canonical.learning_router;
  delete broken.canonical.learning_writer;
  const result = validateContract(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('canonical.learning_router'));
  assert.ok(result.errors.includes('canonical.learning_writer'));
});
