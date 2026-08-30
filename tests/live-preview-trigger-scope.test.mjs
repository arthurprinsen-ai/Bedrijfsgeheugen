import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL('../.github/workflows/live-preview-smoke.yml', import.meta.url);

async function workflowText() {
  return readFile(workflowPath, 'utf8');
}

test('live preview smoke does not trigger on every tools change', async () => {
  const workflow = await workflowText();
  assert.equal(workflow.includes("- 'tools/**'"), false);
  assert.equal(workflow.includes("- 'tools/delivery-preflight.mjs'"), false);
});

test('live preview smoke still watches the V18 build tools it executes', async () => {
  const workflow = await workflowText();
  assert.equal(workflow.includes("- 'tools/bouw-v18-production-core.mjs'"), true);
  assert.equal(workflow.includes("- 'tools/bouw-v18-production.mjs'"), true);
});
