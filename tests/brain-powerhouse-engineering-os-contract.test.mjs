import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

import { loadEngineeringContract, validateEngineeringOS } from '../scripts/brain/powerhouse-engineering-os.mjs';

test('Engineering OS exposes the canonical v1 contract and golden path', async () => {
  const contract = await loadEngineeringContract();
  assert.equal(contract.fingerprint, 'powerhouse-engineering-os-v1');
  assert.equal(contract.delivery_contract, 'BRAIN-DELIVERY-v2');
  assert.deepEqual(contract.golden_path, [
    'CONTEXT', 'SCOPE', 'PLAN', 'CHANGE', 'TEST', 'PREVIEW',
    'VERIFY', 'PROMOTE', 'PROD_READBACK', 'WRITEBACK', 'LEARN'
  ]);
  assert.equal(contract.canonical_authorities.agent_contract, 'AGENTS.md');
  assert.equal(contract.canonical_authorities.delivery, 'config/brain-delivery-system.json');
  assert.equal(contract.platform_roles.notion.includes('never deployed identity authority'), true);
});

test('Engineering OS exposes complete autonomous governance controls', async () => {
  const contract = await loadEngineeringContract();
  const controls = contract.operating_controls;
  assert.ok(controls, 'operating_controls must exist');
  assert.equal(controls.fingerprint, 'powerhouse-autonomy-controls-v1');
  assert.deepEqual(Object.keys(controls.controls).sort(), [
    'agent_security_control_plane',
    'ai_eval_regression',
    'autonomy_budget',
    'disaster_recovery_drills',
    'knowledge_decay',
    'powerhouse_autonomy_scorecard',
    'service_level_objectives'
  ]);
  assert.equal(controls.controls.autonomy_budget.fail_closed, true);
  assert.equal(controls.controls.ai_eval_regression.require_baseline_comparison, true);
  assert.equal(controls.controls.agent_security_control_plane.least_privilege, true);
  assert.equal(controls.controls.knowledge_decay.require_revalidate_after, true);
  assert.equal(controls.controls.service_level_objectives.error_budget_policy, 'fail-closed-on-exhaustion');
  assert.equal(controls.controls.disaster_recovery_drills.require_restore_proof, true);
  assert.equal(controls.controls.powerhouse_autonomy_scorecard.no_single_magic_score, true);
});

test('All material agents receive autonomy controls through chat-learning preflight', () => {
  const output = execFileSync(process.execPath, ['scripts/brain/chat-learning-preflight.mjs'], { encoding: 'utf8' });
  const parsed = JSON.parse(output);
  assert.equal(parsed.status, 'READY');
  assert.ok(parsed.fingerprints.includes('powerhouse-autonomy-controls-v1'));
  assert.ok(parsed.sources.some(source => source.path === 'config/powerhouse-engineering-os.json'));
});

test('Engineering OS validator fails closed on authority and wiring drift', async () => {
  const result = await validateEngineeringOS();
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(result.control_fingerprint, 'powerhouse-autonomy-controls-v1');
});

test('Development OS has no stale BRAIN-DELIVERY-v1 authority', async () => {
  const content = await readFile(new URL('../docs/development-operating-system.md', import.meta.url), 'utf8');
  assert.match(content, /BRAIN-DELIVERY-v2/);
  assert.doesNotMatch(content, /BRAIN-DELIVERY-v1/);
  assert.match(content, /powerhouse-engineering-os-v1/);
  assert.match(content, /powerhouse-autonomy-controls-v1/);
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
  assert.equal(parsed.control_fingerprint, 'powerhouse-autonomy-controls-v1');
});
