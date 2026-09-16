import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

import { loadEngineeringContract, validateEngineeringOS } from '../scripts/brain/powerhouse-engineering-os.mjs';

test('Engineering OS exposes the canonical v1 contract and complete improvement path', async () => {
  const contract = await loadEngineeringContract();
  assert.equal(contract.fingerprint, 'powerhouse-engineering-os-v1');
  assert.equal(contract.delivery_contract, 'BRAIN-DELIVERY-v2');
  assert.deepEqual(contract.golden_path, [
    'CONTEXT', 'SCOPE', 'PLAN', 'CHANGE', 'TEST', 'PREVIEW',
    'VERIFY', 'PROMOTE', 'PROD_READBACK', 'WRITEBACK', 'LEARN', 'IMPROVE'
  ]);
  assert.ok(contract.principles.includes('SHARED-LEARNING'));
  assert.ok(contract.principles.includes('TEAM-OF-AGENTS'));
  assert.equal(contract.canonical_authorities.agent_contract, 'AGENTS.md');
  assert.equal(contract.canonical_authorities.delivery, 'config/brain-delivery-system.json');
  assert.equal(contract.canonical_authorities.learning_preflight, 'config/brain-chat-learning-contract.json');
  assert.equal(contract.platform_roles.notion.includes('never deployed identity authority'), true);
});

test('Engineering OS exposes shared learning, skill evolution and architecture evolution gates', async () => {
  const contract = await loadEngineeringContract();
  assert.equal(contract.shared_learning.fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.equal(contract.shared_learning.preflight.read_current_shared_context, true);
  assert.equal(contract.shared_learning.preflight.read_explicit_required_evidence, true);
  assert.equal(contract.shared_learning.dedupe_before_write, true);
  assert.equal(contract.shared_learning.separate_audit_from_current_projection, true);
  assert.equal(contract.shared_learning.refresh_after_new_verified_learning, true);
  assert.equal(contract.shared_learning.explicit_evidence_not_replaceable_by_shared_context, true);
  assert.equal(contract.shared_learning.reuse_known_fix_before_experiment, true);

  assert.equal(contract.skill_evolution.requires.baseline, true);
  assert.equal(contract.skill_evolution.requires.representative_eval, true);
  assert.equal(contract.skill_evolution.requires.success_metric, true);
  assert.equal(contract.skill_evolution.requires.compatibility, true);
  assert.equal(contract.skill_evolution.requires.rollback_or_fallback, true);
  assert.equal(contract.skill_evolution.requires.post_promotion_outcome, true);

  assert.equal(contract.architecture_evolution.requires.compare_to_current, true);
  assert.equal(contract.architecture_evolution.requires.measurable_improvement, true);
  assert.equal(contract.architecture_evolution.requires.migration_compatibility, true);
  assert.equal(contract.architecture_evolution.requires.security_privacy_cost_review, true);
  assert.equal(contract.architecture_evolution.requires.representative_tests_or_benchmarks, true);
  assert.equal(contract.architecture_evolution.requires.rollback_or_recovery, true);
  assert.equal(contract.architecture_evolution.requires.production_readback, true);
  assert.equal(contract.architecture_evolution.requires.system_map_and_decision_lineage_update, true);
});

test('Engineering OS validator fails closed on authority and evolution drift', async () => {
  const result = await validateEngineeringOS();
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(result.shared_learning_fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
});

test('existing Brain learning authority stays canonical and reusable', async () => {
  const learning = JSON.parse(await readFile(new URL('../config/brain-chat-learning-contract.json', import.meta.url), 'utf8'));
  assert.equal(learning.version, 'BRAIN-CHAT-LEARNING-v1');
  assert.equal(learning.policy.reuseKnownFixBeforeExperimenting, true);
  assert.equal(learning.policy.writeNewMaterialLearningBack, true);
  assert.equal(learning.policy.refreshSharedContextAfterNewLearning, true);
  assert.equal(learning.policy.keepAuditHistoryAppendOnly, true);
  assert.equal(learning.policy.keepCurrentProjectionFreeOfTestArtifacts, true);
});

test('Engineering OS does not create parallel durable learning or architecture authorities', async () => {
  const contract = await loadEngineeringContract();
  const serializedAuthorities = JSON.stringify(contract.canonical_authorities);
  for (const forbidden of ['learning_store', 'memory_store', 'agent_registry', 'architecture_registry']) {
    assert.equal(serializedAuthorities.includes(forbidden), false);
  }
});

test('Development OS documents the shared learning and evolution lifecycle', async () => {
  const content = await readFile(new URL('../docs/development-operating-system.md', import.meta.url), 'utf8');
  assert.match(content, /BRAIN-DELIVERY-v2/);
  assert.doesNotMatch(content, /BRAIN-DELIVERY-v1/);
  assert.match(content, /powerhouse-engineering-os-v1/);
  assert.match(content, /powerhouse-shared-learning-architecture-evolution-v1/);
  assert.match(content, /SHARED-LEARNING/);
  assert.match(content, /TEAM-OF-AGENTS/);
  assert.match(content, /LEARN -> IMPROVE/);
  assert.match(content, /Architecture Evolution/);
  assert.match(content, /Skill Evolution/);
  assert.match(content, /node scripts\/brain\/powerhouse-engineering-os\.mjs --check/);
});

test('Required test executes this regression contract', async () => {
  const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(workflow, /tests\/brain-powerhouse-engineering-os-contract\.test\.mjs/);
});

test('CLI emits READY only after the complete contract validates', () => {
  const output = execFileSync(process.execPath, ['scripts/brain/powerhouse-engineering-os.mjs', '--check'], { encoding: 'utf8' });
  const parsed = JSON.parse(output);
  assert.equal(parsed.status, 'ENGINEERING_OS_READY');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.delivery_contract, 'BRAIN-DELIVERY-v2');
  assert.equal(parsed.shared_learning_fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
});

test('packet exposes the effective learning and evolution rules', () => {
  const output = execFileSync(process.execPath, ['scripts/brain/powerhouse-engineering-os.mjs', '--packet'], { encoding: 'utf8' });
  const parsed = JSON.parse(output);
  assert.equal(parsed.status, 'ENGINEERING_OS_READY');
  assert.equal(parsed.contract.shared_learning.fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.ok(parsed.contract.skill_evolution);
  assert.ok(parsed.contract.architecture_evolution);
});
