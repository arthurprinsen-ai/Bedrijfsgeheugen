import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const workflowPath = '.github/workflows/fresh-device-autonomy-canary.yml';

test('fresh device canary runs on a clean hosted runner and certifies a non-protected branch', async () => {
  assert.equal(existsSync(workflowPath), true, 'fresh-device workflow must exist');
  const workflow = await readFile(workflowPath, 'utf8');
  assert.match(workflow, /runs-on:\s*ubuntu-24\.04/);
  assert.match(workflow, /actions\/checkout@v5/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /git switch -c "canary\/device-\$\{\{ github\.run_id \}\}"/);
  assert.match(workflow, /node scripts\/brain\/device-certify\.mjs/);
  assert.match(workflow, /GITHUB_TOKEN:\s*\$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
});

// Operational re-certification trigger: 2026-08-30 current-main proof only; DO NOT MERGE.
