import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBranchHygiene, parseScopeMetadata } from '../tools/delivery-branch-hygiene-guard.mjs';

test('small declared change stays inside exact owned scope', () => {
  const meta = parseScopeMetadata('Change-Scope: a.txt, dir/**\nScope-Budget: 3');
  assert.deepEqual(evaluateBranchHygiene({
    changedPaths: ['a.txt', 'dir/b.txt'],
    metadata: meta,
    labels: [],
  }), { ok: true, state: 'SCOPE_CLEAN', changedFileCount: 2, unexpectedPaths: [] });
});

test('declared scope contamination fails closed', () => {
  const meta = parseScopeMetadata('Change-Scope: a.txt, dir/**\nScope-Budget: 3');
  const result = evaluateBranchHygiene({ changedPaths: ['a.txt', 'unrelated/boom.txt'], metadata: meta, labels: [] });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'SCOPE_CONTAMINATED');
  assert.deepEqual(result.unexpectedPaths, ['unrelated/boom.txt']);
});

test('scope budget explosion fails before branch becomes a mega PR', () => {
  const meta = parseScopeMetadata('Scope-Budget: 2');
  const result = evaluateBranchHygiene({ changedPaths: ['a','b','c'], metadata: meta, labels: [] });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'SCOPE_BUDGET_EXCEEDED');
});

test('undeclared PR over hard safety ceiling fails unless broad scope is explicitly approved', () => {
  const changedPaths = Array.from({ length: 41 }, (_, i) => `f-${i}.txt`);
  assert.equal(evaluateBranchHygiene({ changedPaths, metadata: {}, labels: [] }).state, 'HARD_SCOPE_LIMIT_EXCEEDED');
  assert.equal(evaluateBranchHygiene({ changedPaths, metadata: {}, labels: ['scope-broad-approved'] }).ok, true);
});
