import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync('config/powerhouse-runtime-identities.json', 'utf8'));

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

test('current Mission Control BG139 is identified by scenario id, not historical label', () => {
  const bg139 = registry.current.filter((item) => item.label === 'BG139');
  assert.equal(bg139.length, 1);
  assert.equal(bg139[0].scenario_id, 7071153);
  assert.equal(bg139[0].canonical_role, 'Mission Control API');
  assert.match(bg139[0].notes, /namesake history only/i);
});

test('Mission Control shadow contract keeps BG139 legacy-live until BG191 promotion', () => {
  const c = registry.mission_control_cache_contract;
  const owners = [c.request_owner, c.projection_owner, c.equivalence_owner, c.cache_canary_owner, c.promotion_owner];
  assert.equal(new Set(owners).size, owners.length);
  assert.equal(c.request_owner, 7071153);
  assert.equal(c.cache_canary_owner, 7152387);
  assert.equal(c.promotion_owner, 7152400);
  assert.deepEqual(c.shadow_legacy_live_modules, [1, 2, 3, 6, 4, 5, 8]);
  assert.deepEqual(c.projection_safe_modes_before_promotion, ['SHADOW', 'BYPASS']);
  assert.match(c.promotion_precondition, /eq:<n>:EQUIVALENT/i);
  assert.match(c.promotion_precondition, /n>=25/i);
  assert.match(c.promotion_precondition, /fresh=true/i);
  assert.equal(c.permanent_bg190_shadow_insert_forbidden, true);
  assert.equal(c.bg191_only_active_authority, true);
  assert.equal(c.exact_legacy_rollback_required, true);
});

test('prevention rules retain independent delivery, green-until-done, rate-limit, secret and authority-outage contracts', () => {
  assert.match(registry.prevention.branch_drift, /Generic main drift alone is not a blocker/i);
  assert.match(registry.prevention.branch_drift, /changed-path overlap/i);
  assert.match(registry.prevention.branch_drift, /contract overlap/i);
  assert.match(registry.prevention.branch_drift, /dependency conflict/i);
  assert.match(registry.prevention.green_until_done, /two identical retries/i);
  assert.match(registry.prevention.rate_limit, /429/);
  assert.match(registry.prevention.secrets, /Never place API keys, PATs or tokens/i);
  assert.match(registry.prevention.production_authority_unavailable, /do not bypass/i);
  assert.match(registry.prevention.production_authority_unavailable, /Preserve exact candidate SHA/i);
  assert.match(registry.prevention.production_authority_unavailable, /resume from the same identity/i);
});
