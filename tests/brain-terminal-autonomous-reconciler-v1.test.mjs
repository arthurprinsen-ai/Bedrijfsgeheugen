import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal autonomous reconciler is fail-closed and scheduled', async () => {
  const sql = await readFile('supabase/migrations/20260920095500_terminal_autonomous_reconciler_v1.sql', 'utf8');
  assert.match(sql, /powerhouse_terminal_control_plane_health_v1/);
  assert.match(sql, /powerhouse_terminal_autonomous_reconcile_v1/);
  assert.match(sql, /GREEN_STALE/);
  assert.match(sql, /side_effect_state/);
  assert.match(sql, /NOT_STARTED/);
  assert.match(sql, /Never auto-fulfil obligations without outcome evidence/);
  assert.match(sql, /powerhouse-terminal-autonomous-reconciler-v1/);
  assert.doesNotMatch(sql, /update\s+public\.brain_obligations[\s\S]*FULFILLED/i);
});

test('terminal reconciler policy separates production and preview health', async () => {
  const policy = JSON.parse(await readFile('config/terminal-autonomous-reconciler-v1.json', 'utf8'));
  assert.equal(policy.fingerprint, 'terminal-autonomous-reconciler-v1');
  assert.ok(policy.rules.includes('PRODUCTION_HEALTH_AND_PREVIEW_BRANCH_HEALTH_ARE_SEPARATE_SIGNALS'));
  assert.ok(policy.rules.includes('NO_OBLIGATION_MAY_BE_AUTO_FULFILLED_WITHOUT_OUTCOME_EVIDENCE'));
});
