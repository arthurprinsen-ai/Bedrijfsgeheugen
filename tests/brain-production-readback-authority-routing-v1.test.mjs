import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveNetlifyDeploymentApplicability, NETLIFY_GOVERNANCE_PREFIXES } from '../tools/delivery/netlify-deployment-applicability.mjs';

test('production readback excludes GitHub control-plane files from runtime lane classification', async () => {
  const [workflow, authority] = await Promise.all([
    readFile('.github/workflows/production-release-readback.yml', 'utf8'),
    readFile('tools/delivery/netlify-deployment-applicability.mjs', 'utf8'),
  ]);
  assert.match(workflow, /deriveNetlifyDeploymentApplicability/);
  assert.match(authority, /NETLIFY_GOVERNANCE_PREFIXES/);
  for (const prefix of ['docs/', '.agents/', 'tests/', '.github/']) assert.ok(NETLIFY_GOVERNANCE_PREFIXES.includes(prefix), prefix);
  const result = deriveNetlifyDeploymentApplicability({
    changedPaths: ['.github/workflows/production-release-readback.yml', 'tests/brain-production-readback-authority-routing-v1.test.mjs'],
    headSha: 'f627153ed569820917a2dc5787dd210613f0395e',
  });
  assert.deepEqual(result.runtimeChangedPaths, []);
  assert.equal(result.deploymentRequired, false);
  assert.equal(result.browserRequired, false);
  assert.match(authority, /netlifyRuntimeRequired=runtimeChangedPaths\.some/);
  assert.ok(workflow.includes("if: steps.scope.outputs.deployment_required != 'true'"));
});

test('terminalizer routes migration-history recovery without a fake Netlify dependency', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.ok(workflow.includes("grep -q '^Candidate-Type: recovery$'"));
  assert.ok(workflow.includes("grep -Eq '^Obligation-ID: supabase-(migration-history-(parity|canonical)|(current-)?production-ledger-parity)-'"));
  assert.match(workflow, /SUPABASE_HISTORY_PARITY_RECOVERY_RUNTIME_NOT_APPLICABLE/);
  assert.match(workflow, /readback_mode=supabase_history_parity_recovery/);
  for (const path of ['supabase/migration-history/*', 'supabase/migration-history.lock.json', 'supabase/production-baseline/*']) assert.ok(workflow.includes(path), path);
  assert.match(workflow, /SUPABASE_PARITY_RECOVERY_CONTAINS_RUNTIME_PATH/);
  assert.match(workflow, /prove_main_containment/);
});

test('terminalizer fails closed for non-Netlify runtime without a dedicated readback authority', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  for (const token of ['UNWIRED_NON_NETLIFY_RUNTIME_READBACK','unknown_runtime_paths','supabase_required','migration_required','netlify_required','const netlify=paths.filter','SUPABASE_MIGRATION_PROVIDER_READBACK_INCOMPLETE','SUPABASE_EDGE_PROVIDER_READBACK_PROVEN','SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN']) assert.ok(workflow.includes(token), token);
});

test('terminal evidence distinguishes performed runtime readback from not-applicable recovery', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  for (const token of ['const runtimeReadbackModes=[','deploy_promotion_readback:runtimeReadbackModes.includes(process.env.READBACK_MODE)','runtime_function_readback:runtimeReadbackModes.includes(process.env.READBACK_MODE)',"production_readback_not_applicable:['non_runtime','supabase_history_parity_recovery'].includes(process.env.READBACK_MODE)",'supabase_provider_readback:','supabase_migration_readback:','TERMINAL_PRODUCTION_READBACK_MODE_UNPROVEN','TERMINAL_SUPABASE_PROVIDER_READBACK_EVIDENCE_MISSING','TERMINAL_SUPABASE_MIGRATION_READBACK_EVIDENCE_MISSING']) assert.ok(workflow.includes(token), token);
});

test('terminalizer workflow body remains singular and structurally intact', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  for (const name of ['- name: Verify production promotion and runtime readback','- name: Verify learning and skill projection','- name: Materialize terminal outcome evidence']) assert.equal(workflow.split(name).length - 1, 1, name);
  assert.ok(workflow.includes("grep -q '^Candidate-Type: recovery$'"));
  assert.ok(workflow.includes("grep -Eq '^Obligation-ID: supabase-(migration-history-(parity|canonical)|(current-)?production-ledger-parity)-'"));
});