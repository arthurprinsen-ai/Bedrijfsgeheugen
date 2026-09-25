import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL('../.github/workflows/live-preview-smoke.yml', import.meta.url);

async function workflowText() {
  return readFile(workflowPath, 'utf8');
}

test('live preview smoke is reusable/manual and does not auto-trigger PR fanout', async () => {
  const workflow = await workflowText();
  assert.match(workflow, /workflow_call:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*pull_request\s*:/m);
  assert.equal(workflow.includes("- 'tools/**'"), false);
  assert.equal(workflow.includes("- 'tools/delivery-preflight.mjs'"), false);
});

test('live preview smoke still executes the canonical V18 runtime checks when explicitly invoked', async () => {
  const workflow = await workflowText();
  assert.match(workflow, /bouw-v18-production-core\.mjs/);
  assert.match(workflow, /V18\.8 production HTML contract/);
  assert.match(workflow, /v18-live-runtime\.spec\.js/);
  assert.match(workflow, /inputs\.head_sha/);
  assert.match(workflow, /inputs\.pr_number/);
});
