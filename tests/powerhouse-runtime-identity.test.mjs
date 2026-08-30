import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync('config/powerhouse-runtime-identities.json', 'utf8'));
const incident = JSON.parse(fs.readFileSync('config/chat-learning/2026-08-30-bg190-unauthorized-activation.json', 'utf8'));

test('runtime identity contract requires scenario id plus canonical role', () => {
  assert.equal(registry.contract, 'POWERHOUSE-RUNTIME-IDENTITY-v1');
  assert.match(registry.identity_rule, /scenario_id \+ canonical_role \+ latest_verified_state/i);
  assert.ok(Array.isArray(registry.current) && registry.current.length >= 5);
  for (const item of registry.current) {
    assert.equal(Number.isInteger(item.scenario_id), true);
    assert.ok(item.scenario_id > 0);
    assert.equal(typeof item.canonical_role, 'string');
    assert.ok(item.canonical_role.length > 0);
  }
});

test('Mission Control shadow contract keeps BG139 legacy-live until BG191 promotion', () => {
  const bg139 = registry.current.find((item) => item.scenario_id === 7071153);
  const c = registry.mission_control_cache_contract;
  assert.equal(bg139.canonical_role, 'Mission Control API');
  assert.match(bg139.notes, /legacy-live modules 1→2→3→6→4→5→8/i);
  assert.equal(c.request_owner, 7071153);
  assert.equal(c.projection_owner, 7152183);
  assert.equal(c.equivalence_owner, 7152314);
  assert.equal(c.cache_canary_owner, 7152387);
  assert.equal(c.promotion_owner, 7152400);
  assert.deepEqual(c.shadow_legacy_live_modules, [1, 2, 3, 6, 4, 5, 8]);
  assert.deepEqual(c.projection_safe_modes_before_promotion, ['SHADOW', 'BYPASS']);
  assert.match(c.promotion_precondition, /eq:<n>:EQUIVALENT/i);
  assert.match(c.promotion_precondition, /n>=25/i);
  assert.equal(c.bg191_only_active_authority, true);
  assert.equal(c.exact_legacy_rollback_required, true);
});

test('BG190 unauthorized activation incident is retained as a proven prevention contract', () => {
  assert.equal(incident.root_cause_class, 'UNAUTHORIZED_PROMOTION_SIDE_EFFECT');
  assert.equal(incident.evidence.bg190_scenario_id, 7152387);
  assert.equal(incident.evidence.bg191_scenario_id, 7152400);
  assert.equal(incident.evidence.runtime_fix.operation, 'WRITE_SHADOW');
  assert.equal(incident.evidence.final_independent_bg186_read.mode, 'SHADOW');
  assert.equal(incident.evidence.final_independent_bg186_read.usable, false);
  assert.equal(incident.prevention_rule, 'CACHE_FALLBACK_MUST_NOT_OWN_PROMOTION');
  assert.match(incident.completion_rule, /BG139/i);
});
