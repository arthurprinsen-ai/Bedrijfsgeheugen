import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('historical reconciliation explicitly supersedes legacy fabricated terminal proof', async () => {
  const source = await readFile('tools/delivery/historical-terminal-reconcile.mjs', 'utf8');
  assert.match(source, /legacy_terminal_evidence_authoritative: false/);
  assert.match(source, /stale_readback_authoritative: false/);
  assert.match(source, /runtime_function_readback: false/);
  assert.match(source, /outcome_evidence: false/);
});

test('historical parity recovery uses the current explicit not-applicable authority', async () => {
  const source = await readFile('tools/delivery/historical-terminal-reconcile.mjs', 'utf8');
  assert.match(source, /supabase_history_parity_recovery/);
  assert.match(source, /HISTORICAL_RECONCILIATION_UNEXPECTED_RUNTIME_PATH/);
  assert.match(source, /main_contains_merge: true/);
});

test('registry pins the exact #3741 merge and stale workflow ids', async () => {
  const config = JSON.parse(await readFile('config/historical-terminal-reconciliation.json', 'utf8'));
  assert.equal(config.entries[0].pr_number, 3741);
  assert.equal(config.entries[0].expected_merge_sha, '6a9452fa905073290c9274c2364d2aaaa52ad492');
  assert.equal(config.entries[0].supersedes_terminalizer_run_id, 37343578647);
  assert.equal(config.entries[0].stale_readback_run_id, 37343578411);
});

test('workflow runs automatically when reconciliation authority lands on main', async () => {
  const workflow = await readFile('.github/workflows/historical-terminal-reconciliation.yml', 'utf8');
  assert.match(workflow, /push:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /historical-terminal-reconcile\.mjs/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
});
