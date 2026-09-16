import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { loadEngineeringContract, validateEngineeringOS } from '../scripts/brain/powerhouse-engineering-os.mjs';

test('Engineering OS exposes canonical complete improvement path', async () => {
  const contract = await loadEngineeringContract();
  assert.equal(contract.fingerprint, 'powerhouse-engineering-os-v1');
  assert.equal(contract.delivery_contract, 'BRAIN-DELIVERY-v2');
  assert.deepEqual(contract.golden_path, ['CONTEXT','SCOPE','PLAN','CHANGE','TEST','PREVIEW','VERIFY','PROMOTE','PROD_READBACK','WRITEBACK','LEARN','IMPROVE']);
  for (const principle of ['SHARED-LEARNING','TEAM-OF-AGENTS','BOUNDED-AUTONOMY','MEASURED-SELF-IMPROVEMENT']) assert.ok(contract.principles.includes(principle));
});

test('shared learning, skill evolution and architecture evolution remain protected', async () => {
  const c = await loadEngineeringContract();
  assert.equal(c.shared_learning.fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.equal(c.shared_learning.preflight.read_current_shared_context, true);
  assert.equal(c.shared_learning.preflight.read_explicit_required_evidence, true);
  assert.equal(c.shared_learning.dedupe_before_write, true);
  for (const key of ['baseline','representative_eval','success_metric','compatibility','rollback_or_fallback','post_promotion_outcome']) assert.equal(c.skill_evolution.requires[key], true);
  for (const key of ['compare_to_current','measurable_improvement','migration_compatibility','security_privacy_cost_review','representative_tests_or_benchmarks','rollback_or_recovery','production_readback','system_map_and_decision_lineage_update']) assert.equal(c.architecture_evolution.requires[key], true);
});

test('bounded autonomy exposes all seven controls', async () => {
  const c = await loadEngineeringContract();
  const o = c.operating_controls;
  assert.equal(o.fingerprint, 'powerhouse-autonomy-controls-v1');
  assert.deepEqual(Object.keys(o.controls).sort(), ['agent_security_control_plane','ai_eval_regression','autonomy_budget','disaster_recovery_drills','knowledge_decay','powerhouse_autonomy_scorecard','service_level_objectives']);
  assert.equal(o.controls.autonomy_budget.fail_closed, true);
  assert.equal(o.controls.ai_eval_regression.require_baseline_comparison, true);
  assert.equal(o.controls.agent_security_control_plane.least_privilege, true);
  assert.equal(o.controls.knowledge_decay.require_revalidate_after, true);
  assert.equal(o.controls.service_level_objectives.error_budget_policy, 'fail-closed-on-exhaustion');
  assert.equal(o.controls.disaster_recovery_drills.require_restore_proof, true);
  assert.equal(o.controls.powerhouse_autonomy_scorecard.no_single_magic_score, true);
  assert.equal(o.controls.powerhouse_autonomy_scorecard.unknown_is_not_zero, true);
});

test('all material agents receive autonomy controls through chat-learning preflight', () => {
  const parsed = JSON.parse(execFileSync(process.execPath, ['scripts/brain/chat-learning-preflight.mjs'], { encoding: 'utf8' }));
  assert.equal(parsed.status, 'READY');
  assert.ok(parsed.fingerprints.includes('powerhouse-autonomy-controls-v1'));
  assert.ok(parsed.sources.some(source => source.path === 'config/powerhouse-engineering-os.json'));
});

test('Engineering OS validator fails closed on evolution and autonomy drift', async () => {
  const r = await validateEngineeringOS();
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.equal(r.shared_learning_fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.equal(r.control_fingerprint, 'powerhouse-autonomy-controls-v1');
});

test('existing Brain learning authority stays canonical', async () => {
  const learning = JSON.parse(await readFile(new URL('../config/brain-chat-learning-contract.json', import.meta.url), 'utf8'));
  assert.equal(learning.policy.reuseKnownFixBeforeExperimenting, true);
  assert.equal(learning.policy.writeNewMaterialLearningBack, true);
  assert.equal(learning.policy.refreshSharedContextAfterNewLearning, true);
});

test('Development OS keeps current shared-learning documentation and delivery authority', async () => {
  const content = await readFile(new URL('../docs/development-operating-system.md', import.meta.url), 'utf8');
  assert.match(content, /BRAIN-DELIVERY-v2/);
  assert.doesNotMatch(content, /BRAIN-DELIVERY-v1/);
  assert.match(content, /powerhouse-shared-learning-architecture-evolution-v1/);
  assert.match(content, /LEARN -> IMPROVE/);
});

test('Required test executes this regression contract', async () => {
  const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(workflow, /tests\/brain-powerhouse-engineering-os-contract\.test\.mjs/);
});

test('CLI and packet expose both shared-learning and autonomy controls', () => {
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/brain/powerhouse-engineering-os.mjs', '--check'], { encoding: 'utf8' }));
  assert.equal(checked.status, 'ENGINEERING_OS_READY');
  assert.equal(checked.control_fingerprint, 'powerhouse-autonomy-controls-v1');
  const packet = JSON.parse(execFileSync(process.execPath, ['scripts/brain/powerhouse-engineering-os.mjs', '--packet'], { encoding: 'utf8' }));
  assert.equal(packet.contract.shared_learning.fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.equal(packet.contract.operating_controls.fingerprint, 'powerhouse-autonomy-controls-v1');
});
