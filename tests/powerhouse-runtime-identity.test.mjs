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

test('Mission Control cache owners are singular and bounded stale cache is explicit', () => {
  const c = registry.mission_control_cache_contract;
  const owners = [c.request_owner, c.projection_owner, c.equivalence_owner, c.fallback_owner, c.promotion_owner];
  assert.equal(new Set(owners).size, owners.length);
  assert.equal(c.stale_grace_seconds, 21600);
  assert.deepEqual(c.observable_sources, ['CACHE_FRESH', 'CACHE_STALE', 'MISS']);
  assert.equal(c.synchronous_live_fallback_only_when_no_usable_payload, true);
  assert.equal(c.duplicate_cache_stack_forbidden, true);
  assert.equal(c.new_refresh_owner_requires_overlap_check, true);
});

test('prevention rules retain independent delivery, green-until-done, rate-limit and secret contracts', () => {
  assert.match(registry.prevention.branch_drift, /Unrelated main drift is not a blocker/i);
  assert.match(registry.prevention.branch_drift, /changed-path overlap/i);
  assert.match(registry.prevention.green_until_done, /two identical retries/i);
  assert.match(registry.prevention.rate_limit, /429/);
  assert.match(registry.prevention.secrets, /Never place API keys, PATs or tokens/i);
});
