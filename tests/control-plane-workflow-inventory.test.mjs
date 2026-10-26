import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyWorkflowSource } from '../tools/ci/inventory-workflow-triggers.mjs';

test('classifies top-level workflow triggers without confusing nested keys', () => {
  const source = `name: Example\non:\n  pull_request:\n    branches: [main]\n  workflow_dispatch:\npermissions:\n  contents: read\njobs:\n  build:\n    steps:\n      - run: echo push:\n`;
  const result = classifyWorkflowSource(source);
  assert.deepEqual(result.triggers, ['pull_request', 'workflow_dispatch']);
  assert.equal(result.topLevelPrTrigger, true);
  assert.equal(result.reusableOnly, false);
});

test('workflow_call only is reusable-only and not a top-level PR trigger', () => {
  const source = `name: Reusable\non:\n  workflow_call:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: true\n`;
  const result = classifyWorkflowSource(source);
  assert.deepEqual(result.triggers, ['workflow_call']);
  assert.equal(result.topLevelPrTrigger, false);
  assert.equal(result.reusableOnly, true);
});


test('classifies closed-only pull_request workflows as lifecycle authorities, not admission fan-out', () => {
  const source = `name: Lifecycle\non:\n  pull_request:\n    types: [closed]\njobs: {}\n`;
  const result = classifyWorkflowSource(source);
  assert.equal(result.topLevelPrTrigger, true);
  assert.deepEqual(result.pullRequestTypes, ['closed']);
  assert.equal(result.prLifecycleOnly, true);
  assert.equal(result.prAdmissionTrigger, false);
});

test('classifies opened/synchronize pull_request workflows as admission fan-out', () => {
  const source = `name: Admission\non:\n  pull_request:\n    types: [opened, synchronize, reopened]\njobs: {}\n`;
  const result = classifyWorkflowSource(source);
  assert.equal(result.prLifecycleOnly, false);
  assert.equal(result.prAdmissionTrigger, true);
});
