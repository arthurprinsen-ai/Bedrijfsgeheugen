import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loadJson = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

test('all chats and agents inherit autonomous completion and no-repeat-approval authority', async () => {
  const contract = await loadJson('config/powerhouse-engineering-os.json');
  const policy = contract.interaction_authority;

  assert.equal(policy.fingerprint, 'powerhouse-autonomous-completion-authority-v1');
  assert.deepEqual(policy.applies_to, [
    'all_existing_chats',
    'all_future_chats',
    'all_existing_agents',
    'all_future_agents',
    'all_material_workflows',
  ]);
  assert.equal(policy.autonomous_decision_default, true);
  assert.equal(policy.reuse_existing_authority_without_reapproval, true);
  assert.equal(policy.repeat_approval_for_established_rules, false);
  assert.equal(policy.keep_working_until_live_verified, true);
  assert.equal(policy.documentation_and_learning_are_completion_requirements, true);
  assert.equal(policy.machine_readable_writeback_required, true);
  assert.equal(policy.human_readable_documentation_required, true);
  assert.equal(policy.interrupt_only_for_novel_unresolved_choice_or_hard_boundary, true);
  assert.deepEqual(policy.allowed_interruptions, [
    'novel_choice_not_resolvable_from_existing_authority',
    'secrets_credentials_permissions',
    'security_control_weakening',
    'destructive_irreversible_data',
    'paid_resource_increase',
    'legal_financial_commitment',
  ]);
});

test('autonomous completion authority is exposed through the canonical agent contract', async () => {
  const agents = await readFile(new URL('../AGENTS.md', import.meta.url), 'utf8');
  assert.match(agents, /powerhouse-autonomous-completion-authority-v1/);
  assert.match(agents, /geen herhaalde goedkeuring/i);
  assert.match(agents, /LIVE & BEWEZEN/);
  assert.match(agents, /menselijk én machineleesbaar/i);
});

test('Required CI executes the autonomous completion authority regression contract', async () => {
  const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(workflow, /tests\/brain-powerhouse-autonomous-completion-authority\.test\.mjs/);
});
