import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createSingleFlightPlan } from '../tools/ci/single-flight-release-kernel.mjs';

const policy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));
const headSha = '1234567890abcdef1234567890abcdef12345678';
const baseSha = 'abcdef1234567890abcdef1234567890abcdef12';

function planFor(changedPaths) {
  return createSingleFlightPlan({ baseSha, headSha, prNumber: 1161, changedPaths, policy });
}

test('planner preserves exact release identity and unique command ids', () => {
  const plan = planFor(['docs/superpowers/plans/example.md']);
  assert.equal(plan.version, 'single-flight-v1');
  assert.equal(plan.baseSha, baseSha);
  assert.equal(plan.headSha, headSha);
  assert.equal(plan.prNumber, 1161);
  assert.ok(Array.isArray(plan.commands));
  assert.equal(new Set(plan.commands.map(command => command.id)).size, plan.commands.length);
});

for (const fixture of [
  { name: 'backend', paths: ['brain/example.mjs'], expected: ['backend'] },
  { name: 'portal', paths: ['portal/example.mjs'], expected: ['portal'] },
  { name: 'website', paths: ['assets/example.js'], expected: ['website'] },
  { name: 'automation', paths: ['make/example.json'], expected: ['automation'] },
  { name: 'mixed', paths: ['brain/example.mjs', 'portal/example.mjs', 'assets/example.js', 'make/example.json'], expected: ['automation', 'backend', 'portal', 'website'] },
]) {
  test(`planner emits only selected executable lanes for ${fixture.name}`, () => {
    const plan = planFor(fixture.paths);
    const emitted = [...new Set(plan.commands.filter(command => command.lane !== 'shared').map(command => command.lane))].sort();
    assert.deepEqual(emitted, fixture.expected);
    assert.deepEqual([...plan.lanes].sort(), fixture.expected);
  });
}

test('workflow-only control-plane changes can select all lanes without duplicate commands', () => {
  const plan = planFor(['.github/workflows/required-test.yml']);
  assert.deepEqual([...plan.lanes].sort(), ['automation', 'backend', 'portal', 'website']);
  assert.equal(new Set(plan.commands.map(command => command.id)).size, plan.commands.length);
});
