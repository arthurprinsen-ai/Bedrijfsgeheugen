import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production readback excludes GitHub control-plane files from runtime lane classification', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(workflow, /governanceOnlyPrefixes=\['docs\/',\.agents\/',\'tests\/',\'.github\/'/);
});

test('terminalizer routes migration-history recovery without a fake Netlify dependency', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.match(workflow, /Candidate-Type: recovery/);
  assert.match(workflow, /Obligation-ID: supabase-migration-history-parity-/);
  assert.match(workflow, /SUPABASE_HISTORY_PARITY_RECOVERY_RUNTIME_NOT_APPLICABLE/);
  assert.match(workflow, /readback_mode=supabase_history_parity_recovery/);
});

test('terminalizer fails closed for non-Netlify runtime without a dedicated readback authority', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.match(workflow, /UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);
  assert.match(workflow, /netlify_required=false/);
  assert.match(workflow, /netlify\/functions\/\*/);
});

test('terminal evidence distinguishes performed runtime readback from not-applicable recovery', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.match(workflow, /readback_mode:process\.env\.READBACK_MODE/);
  assert.match(workflow, /deploy_promotion_readback:process\.env\.READBACK_MODE==='netlify_runtime'/);
  assert.match(workflow, /production_readback_not_applicable:\['non_runtime','supabase_history_parity_recovery'\]/);
});
