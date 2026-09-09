import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL('../.github/workflows/production-release-readback.yml', import.meta.url);

test('production readback handles no-op merge commits without calling the non-empty classifier', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  assert.match(workflow, /const risk=changedPaths\.length\s*\?\s*classifyWebsiteRelease/);
  assert.match(workflow, /:\s*\{lane:'no-op',affected_routes:\[\]\}/);
  assert.match(workflow, /if\(routes\.length===0\).*\['\/'\]/s);
});
