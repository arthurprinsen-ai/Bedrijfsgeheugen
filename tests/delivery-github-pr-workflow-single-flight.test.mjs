import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflows = [
  '.github/workflows/portal-v2-live-preview.yml',
  '.github/workflows/powerhouse-assurance.yml',
  '.github/workflows/powerhouse-closure-a-f.yml',
  '.github/workflows/business-os-foundation.yml',
  '.github/workflows/powerhouse-quality-surface-gate.yml',
  '.github/workflows/portal-parity.yml',
  '.github/workflows/portal-v2-tests.yml',
  '.github/workflows/linkedin-revenue-cockpit-tests.yml',
  '.github/workflows/revenue-learning.yml',
  '.github/workflows/powerhouse-quality-intelligence.yml',
  '.github/workflows/powerhouse-supabase-security-contract.yml',
];

for (const workflow of workflows) {
  test(`${workflow} is PR-scoped single-flight`, () => {
    const yaml = fs.readFileSync(workflow, 'utf8');
    assert.match(yaml, /\nconcurrency:\n/);
    assert.match(yaml, /github\.event\.pull_request\.number/);
    assert.match(yaml, /cancel-in-progress:\s*true/);
  });
}

test('single-flight guard does not remove workflow jobs', () => {
  for (const workflow of workflows) {
    const yaml = fs.readFileSync(workflow, 'utf8');
    assert.match(yaml, /\njobs:\n/);
  }
});

test('legacy V18 promotion is explicit recovery only, not a PR entrypoint', () => {
  const yaml = fs.readFileSync('.github/workflows/v18-production-promotion.yml', 'utf8');
  assert.doesNotMatch(yaml, /^\s*pull_request\s*:/m);
  assert.match(yaml, /workflow_dispatch:/);
});
