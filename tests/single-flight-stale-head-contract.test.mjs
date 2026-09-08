import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assertCurrentHead } from '../tools/ci/single-flight-release-kernel.mjs';

const requiredWorkflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
const agents = await readFile(new URL('../AGENTS.md', import.meta.url), 'utf8');

test('current head identity is accepted and stale head identity is rejected', () => {
  assert.doesNotThrow(() => assertCurrentHead({ plannedHeadSha: 'abc', observedHeadSha: 'abc' }));
  assert.throws(() => assertCurrentHead({ plannedHeadSha: 'abc', observedHeadSha: 'def' }), /STALE_HEAD_SUPERSEDED/);
});

test('Required test cancels superseded work per PR', () => {
  assert.match(requiredWorkflow, /group:\s*required-test-pr-\$\{\{\s*github\.event\.pull_request\.number\s*\|\|\s*github\.ref\s*\}\}/);
  assert.match(requiredWorkflow, /cancel-in-progress:\s*true/);
});

test('agent contract forbids stale heads from owning release evidence', () => {
  assert.match(agents, /stale PR head/i);
  assert.match(agents, /kan geen succes-, failure-, merge- of productiebewijs bezitten/i);
});
