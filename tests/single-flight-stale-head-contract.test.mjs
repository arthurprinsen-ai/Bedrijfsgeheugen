import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assertCurrentHead } from '../tools/ci/single-flight-release-kernel.mjs';

const requiredWorkflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
const agents = await readFile(new URL('../AGENTS.md', import.meta.url), 'utf8');
const config = JSON.parse(await readFile(new URL('../config/single-flight-release-kernel.json', import.meta.url), 'utf8'));

test('current head identity is accepted and stale head identity is rejected', () => {
  assert.doesNotThrow(() => assertCurrentHead({ plannedHeadSha: 'abc', observedHeadSha: 'abc' }));
  assert.throws(() => assertCurrentHead({ plannedHeadSha: 'abc', observedHeadSha: 'def' }), /STALE_HEAD_SUPERSEDED/);
});

test('Required test cancels superseded work per PR', () => {
  assert.match(requiredWorkflow, /group:\s*required-test-pr-\$\{\{\s*github\.event\.pull_request\.number\s*\|\|\s*github\.ref\s*\}\}/);
  assert.match(requiredWorkflow, /cancel-in-progress:\s*true/);
  assert.equal(config.staleHeadPolicy, 'cancel-in-progress');
  assert.equal(config.promotionIdentity, 'exact-tested-head');
});

test('agent contract preserves exact tested candidate identity as production invariant', () => {
  assert.match(agents, /exact de geteste kandidaatidentiteit moet worden gepromoveerd/i);
  assert.match(agents, /een andere SHA\/artifact\/revisie is automatisch niet groen/i);
});
