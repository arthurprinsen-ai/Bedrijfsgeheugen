import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('historical reconciliation explicitly supersedes legacy fabricated terminal proof', async () => {
  const source = await readFile('tools/delivery/historical-terminal-reconcile.mjs', 'utf8');
  assert.match(source, /legacy_terminal_evidence_authoritative: false/);
  assert.match(source, /stale_readback_authoritative: false/);
  assert.match(source, /runtime_function_readback: authority\.readback_mode === 'supabase_edge_provider'/);
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


test('registry revalidation is bound to repaired terminalizer authority and closed migration history', async () => {
  const config = JSON.parse(await readFile('config/historical-terminal-reconciliation.json', 'utf8'));
  assert.deepEqual(config.revalidation.terminalizer_authority_prs, [3812, 3822]);
  assert.deepEqual(config.revalidation.terminalizer_authority_merge_shas, [
    'b8cdcacac4efbfa40facc8a89dbc05a7805470b3',
    '2729dfd6dbf07426b1451e4469ea29cf295e692d',
  ]);
  assert.equal(config.revalidation.migration_history_closure_pr, 3824);
  assert.equal(config.revalidation.migration_history_closure_merge_sha, '908e4f03084ac0f446299aa70fcf43cc6e48ef1e');
});


test('historical reconciliation supports exact Supabase Edge provider readback', async () => {
  const source = await readFile('tools/delivery/historical-terminal-reconcile.mjs', 'utf8');
  assert.match(source, /supabase_edge_provider/);
  assert.match(source, /Terminal-Supabase-Provider-Readback/);
  assert.match(source, /HISTORICAL_RECONCILIATION_SUPABASE_PROVIDER_READBACK_MISSING/);
  assert.match(source, /HISTORICAL_RECONCILIATION_SUPABASE_PROVIDER_READBACK_DRIFT/);
  assert.match(source, /config\/powerhouse-quality-surface-contracts\.json/);
});

test('registry pins merged PR 3890 and its three production provider readbacks', async () => {
  const config = JSON.parse(await readFile('config/historical-terminal-reconciliation.json', 'utf8'));
  const entry = config.entries.find(item => item.pr_number === 3890);
  assert.ok(entry);
  assert.equal(entry.expected_merge_sha, '22d57fdcb0e7344914288091a75319c1198a73ef');
  assert.equal(entry.obligation_id, 'linkedin-company-fresh-org-oauth-terminal-20261006');
  assert.deepEqual(entry.supabase_provider_readbacks, [
    { function: 'powerhouse-composio-linkedin-setup', version: 23, runtime_sha256: '999f1ee8e1ecedc1e54eb709613e7dedc76f62db9d1fbaba6b53bbc77eb37bb3' },
    { function: 'powerhouse-content-loop', version: 31, runtime_sha256: '480980c112c71375d82edec7b2b92ac71d466539c79bf5517bc244d57ced764f' },
    { function: 'powerhouse-social-publisher', version: 115, runtime_sha256: 'bcb12595d92267841cced8fca0a2e564b65df0f77ad2694e77d35e1aa42b7d71' },
  ]);
});
