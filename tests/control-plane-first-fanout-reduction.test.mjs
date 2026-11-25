import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('specialist assurance is consolidated into Required merge_group path', () => {
  const required = readFileSync('.github/workflows/required-test.yml', 'utf8');
  assert.match(required, /Run consolidated merge-group specialist assurance/);
  for (const path of [
    'tests/compliance-status-page.test.mjs',
    'tests/brain-error-learning-contract.test.mjs',
    'tests/brain-runtime-authority-governance.test.mjs',
    'tests/brain-adapter-conformance.test.mjs',
    'tests/brain-bg184-stateful-blocker-dedupe.test.mjs',
  ]) {
    assert.ok(required.includes(path), path);
  }
});

test('retired specialist workflows no longer fan out on pull_request', () => {
  assert.equal(existsSync('.github/workflows/compliance-status-contract.yml'), false);
  for (const path of [
    '.github/workflows/error-learning-contract.yml',
    '.github/workflows/runtime-authority-governance-tests.yml',
    '.github/workflows/bg184-stateful-blocker-dedupe-tests.yml',
  ]) {
    const source = readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /^\s{2}pull_request:/m, path);
  }
});

test('BG184 specialist push is bounded to main', () => {
  const source = readFileSync('.github/workflows/bg184-stateful-blocker-dedupe-tests.yml', 'utf8');
  assert.match(source, /push:\s*\n\s+branches:\s*\[main\]/);
});
