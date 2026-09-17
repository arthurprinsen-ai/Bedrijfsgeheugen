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

test('autonomous completion authority has reusable human-readable canonical documentation', async () => {
  const docs = await readFile(new URL('../docs/development-autonomous-completion-authority.md', import.meta.url), 'utf8');
  assert.match(docs, /powerhouse-autonomous-completion-authority-v1/);
  assert.match(docs, /herhaalde goedkeuring/i);
  assert.match(docs, /LIVE & BEWEZEN/);
  assert.match(docs, /menselijk én machineleesbaar/i);
  assert.match(docs, /volgende chats\/agents/i);
});

test('autonomous completion incident and prevention are reusable machine-readable learning', async () => {
  const learning = await loadJson('brain/learning/autonomous-completion-authority-v1-2026-09-17.json');
  assert.equal(learning.fingerprint, 'powerhouse-autonomous-completion-authority-v1');
  assert.equal(learning.outcome_class, 'IMPROVEMENT');
  assert.match(learning.root_cause, /interaction-authority/i);
  assert.match(learning.delivery_incident.repair, /tests\/brain-\*/i);
  assert.match(learning.delivery_incident.prevention, /Never weaken a fail-closed classifier/i);
  assert.ok(learning.prevention.some(rule => /No repeated approval prompt/i.test(rule)));
  assert.ok(learning.evidence_sources.includes('config/powerhouse-engineering-os.json#interaction_authority'));
});

test('Required CI executes the autonomous completion authority regression contract', async () => {
  const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(workflow, /tests\/brain-powerhouse-autonomous-completion-authority\.test\.mjs/);
});
