import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const retired = [
  '.github/workflows/homepage-pricing-boundary-regression.yml',
  '.github/workflows/main-write-integrity-regression.yml',
  '.github/workflows/universal-event-retention-contract.yml',
  '.github/workflows/component-foundation-tdd.yml',
];

test('second specialist batch no longer fans out directly on pull_request', () => {
  for (const path of retired) {
    const source = readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /^\s{2}pull_request:/m, path);
  }
});

test('Required merge_group preserves second-batch assurance', () => {
  const required = readFileSync('.github/workflows/required-test.yml', 'utf8');
  for (const path of [
    'tests/homepage-pricing-boundary-readback.test.mjs',
    'tests/main-write-integrity-squash-pr.test.mjs',
    'tests/universal-event-envelope.test.mjs',
    'tests/universal-failure-learning.test.mjs',
    'tests/event-retention-policy.test.mjs',
    'tests/event-retention-expiry.test.mjs',
    'tests/universal-event-contract-check.test.mjs',
    'tests/universal-event-adapters.test.mjs',
    'tests/parallel-ownership.test.mjs',
    'tests/change-classes.test.mjs',
    'tests/page-composition.test.mjs',
    'tests/component-preview-composition.test.mjs',
    'tests/component-boundaries.test.mjs',
    'tests/change-scope.test.mjs',
    'tests/component-hash-protection.test.mjs',
    'tests/detect-changed-components.test.mjs',
    'tests/component-preview-workflow-contract.test.mjs',
  ]) {
    assert.ok(required.includes(path), path);
  }
});
