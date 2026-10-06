import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const admissionWorkflows = [
  '.github/workflows/required-test.yml',
  '.github/workflows/powerhouse-codeql.yml',
];

for (const workflow of admissionWorkflows) {
  test(`${workflow} is a single-flight PR admission authority`, () => {
    const yaml = fs.readFileSync(workflow, 'utf8');
    assert.match(yaml, /^  pull_request:/m);
    assert.match(yaml, /\nconcurrency:\n/);
    assert.match(yaml, /github\.event\.pull_request\.number/);
    assert.match(yaml, /cancel-in-progress:\s*true/);
  });
}

test('former PR specialists no longer consume pull_request admission fan-out', () => {
  for (const workflow of [
    '.github/workflows/portal-v2-live-preview.yml',
    '.github/workflows/repo-writer-operational-verification.yml',
    '.github/workflows/engineering-supply-chain-trust.yml',
    '.github/workflows/powerhouse-assurance.yml',
    '.github/workflows/powerhouse-quality-surface-gate.yml',
    '.github/workflows/portal-parity.yml',
    '.github/workflows/portal-v2-tests.yml',
    '.github/workflows/powerhouse-supabase-security-contract.yml',
  ]) {
    const yaml = fs.readFileSync(workflow, 'utf8');
    assert.doesNotMatch(yaml, /^  pull_request:/m, workflow);
  }
});

test('portal preview and writer verification consume successful Required admission', () => {
  for (const workflow of [
    '.github/workflows/portal-v2-live-preview.yml',
    '.github/workflows/repo-writer-operational-verification.yml',
  ]) {
    const yaml = fs.readFileSync(workflow, 'utf8');
    assert.match(yaml, /^  workflow_run:/m);
    assert.match(yaml, /workflows:\s*\['Required test'\]/);
    assert.match(yaml, /workflow_run\.conclusion == 'success'/);
  }
});

test('legacy V18 promotion is explicit recovery only, not a PR entrypoint', () => {
  const yaml = fs.readFileSync('.github/workflows/v18-production-promotion.yml', 'utf8');
  assert.doesNotMatch(yaml, /^\s*pull_request\s*:/m);
  assert.match(yaml, /workflow_dispatch:/);
});
