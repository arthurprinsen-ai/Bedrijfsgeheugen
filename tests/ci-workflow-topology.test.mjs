import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inspectWorkflowTopology, evaluateTopology } from '../tools/ci/workflow-topology.mjs';

const workflowDir = '.github/workflows';
const policy = JSON.parse(await readFile('config/ci-workflow-topology.json', 'utf8'));

test('workflow topology has exactly one active PR ingress', async () => {
  const topology = await inspectWorkflowTopology({ workflowDir, canonicalPrWorkflow: policy.canonicalPrWorkflow });
  const evaluation = evaluateTopology(topology, policy);
  assert.equal(evaluation.ok, true, evaluation.violations.join('\n'));
  assert.deepEqual(topology.activePullRequestWorkflows, [policy.canonicalPrWorkflow]);
  assert.deepEqual(topology.broadPullRequestWorkflows, [policy.canonicalPrWorkflow]);
});

test('closed-only writer production reconciliation is post-merge, not PR capacity ingress', async () => {
  const topology = await inspectWorkflowTopology({ workflowDir, canonicalPrWorkflow: policy.canonicalPrWorkflow });
  assert.ok(topology.postMergePullRequestWorkflows.includes('writer-production-reconcile.yml'));
  assert.ok(!topology.activePullRequestWorkflows.includes('writer-production-reconcile.yml'));
});

test('required test supersedes only older runs of the same pull request', async () => {
  const required = await readFile('.github/workflows/required-test.yml', 'utf8');
  assert.match(required, /github\.repository/);
  assert.match(required, /github\.event\.pull_request\.number/);
  assert.match(required, /github\.event\.merge_group\.head_sha/);
  assert.match(required, /cancel-in-progress:\s*\$\{\{\s*github\.event_name == 'pull_request'\s*\}\}/);
  assert.doesNotMatch(required, /production-release-readback/);
});

test('production readback remains isolated, serialized and non-cancellable', async () => {
  const production = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*false/);
  assert.doesNotMatch(production, /pull_request:/);
});
