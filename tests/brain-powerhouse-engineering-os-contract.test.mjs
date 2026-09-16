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

test('Engineering OS validator fails closed on authority and wiring drift', async () => {
  const result = await validateEngineeringOS();
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('Development OS has no stale BRAIN-DELIVERY-v1 authority', async () => {
  const content = await readFile(new URL('../docs/development-operating-system.md', import.meta.url), 'utf8');
  assert.match(content, /BRAIN-DELIVERY-v2/);
  assert.doesNotMatch(content, /BRAIN-DELIVERY-v1/);
  assert.match(content, /powerhouse-engineering-os-v1/);
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
});
