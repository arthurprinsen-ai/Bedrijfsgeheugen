import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production readback excludes GitHub control-plane files from runtime lane classification', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  // Runtime classification is owned by the shared applicability module, not a local prefix list.
  assert.match(workflow, /deriveNetlifyDeploymentApplicability\(\{/);
  const { deriveNetlifyDeploymentApplicability } = await import('../tools/delivery/netlify-deployment-applicability.mjs');
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['docs/x.md', '.agents/skills/x/SKILL.md', 'tests/x.test.mjs', '.github/workflows/x.yml', 'brain/learning/x.json', 'brain/policies/x.md', 'tools/delivery/x.mjs']) {
    const result = deriveNetlifyDeploymentApplicability({ changedPaths: [path], headSha: 'a'.repeat(40), policy });
    assert.deepEqual(result.runtimeChangedPaths, [], `${path} must not be runtime`);
  }
});

test('terminalizer routes migration-history recovery without a fake Netlify dependency', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.match(workflow, /Candidate-Type: recovery/);
  assert.match(workflow, /Obligation-ID: supabase-\(migration-history-\(parity\|canonical\)\|\(current-\)\?production-ledger-parity\)-/);
  assert.match(workflow, /SUPABASE_HISTORY_PARITY_RECOVERY_RUNTIME_NOT_APPLICABLE/);
  assert.match(workflow, /readback_mode=supabase_history_parity_recovery/);
  assert.match(workflow, /supabase\/migration-history\/\*/);
  assert.match(workflow, /supabase\/migration-history\.lock\.json/);
  assert.match(workflow, /supabase\/production-baseline\/\*/);
});

test('terminalizer fails closed for non-Netlify runtime without a dedicated readback authority', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.match(workflow, /UNWIRED_NON_NETLIFY_RUNTIME_READBACK/);
  assert.match(workflow, /netlify_required="\$\(jq -r '\(\.netlify\|length\)>0' <<<"\$runtime_classes"\)"/);
  assert.match(workflow, /if \[ "\$netlify_required" != true \]; then/);
  const applicability = await readFile('tools/delivery/netlify-deployment-applicability.mjs', 'utf8');
  assert.match(applicability, /'netlify\/functions\/'/);
});

test('terminal evidence distinguishes performed runtime readback from not-applicable recovery', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.match(workflow, /readback_mode:process\.env\.READBACK_MODE/);
  assert.match(workflow, /deploy_promotion_readback:runtimeReadbackModes\.includes\(process\.env\.READBACK_MODE\)/);
  assert.match(workflow, /production_readback_not_applicable:\['non_runtime','supabase_history_parity_recovery'\]/);
  assert.match(workflow, /TERMINAL_PRODUCTION_READBACK_MODE_UNPROVEN/);
});


test('terminalizer workflow body remains singular and structurally intact', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.equal((workflow.match(/- name: Verify production promotion and runtime readback/g) || []).length, 1);
  assert.equal((workflow.match(/- name: Verify learning and skill projection/g) || []).length, 1);
  assert.equal((workflow.match(/- name: Materialize terminal outcome evidence/g) || []).length, 1);
  assert.match(workflow, /grep -q '\^Candidate-Type: recovery\$'/);
  assert.match(workflow, /grep -Eq '\^Obligation-ID: supabase-\(migration-history-\(parity\|canonical\)\|\(current-\)\?production-ledger-parity\)-'/);
});
