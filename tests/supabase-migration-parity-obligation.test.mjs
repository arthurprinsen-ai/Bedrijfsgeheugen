import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const obligation = JSON.parse(
  fs.readFileSync(new URL('../config/supabase-migration-parity-obligation.json', import.meta.url), 'utf8')
);

test('migration-history parity cannot be declared terminal green while evidence is incomplete', () => {
  assert.equal(obligation.contract, 'supabase-migration-history-parity-v1');
  const o = obligation.latest_observed;
  const parityBroken =
    o.remote_only !== 0 ||
    o.local_only !== 0 ||
    o.name_mismatches !== 0;

  if (parityBroken) {
    assert.equal(obligation.state, 'OPEN');
    assert.equal(obligation.terminal_green_allowed, false);
  }
});

test('migration-history parity closure contract is fail-closed', () => {
  const required = new Set(obligation.closure_requires);
  for (const condition of [
    'remote_only=0',
    'local_only=0',
    'name_mismatches=0',
    'empty_active_migrations=0',
    'fresh_replay=PASS',
    'supabase_preview=PASS',
    'exact_head_checks=PASS',
  ]) {
    assert.ok(required.has(condition), `missing closure condition: ${condition}`);
  }

  assert.equal(obligation.invariant.empty_placeholder_migrations_forbidden, true);
  assert.equal(obligation.invariant.skipped_preview_is_not_proof, true);
  assert.equal(
    obligation.invariant.production_history_mutation_without_reproducible_baseline_forbidden,
    true
  );
});
