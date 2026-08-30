import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const WORKFLOW = '.github/workflows/shared-agent-memory-tests.yml';
const POLICY = 'config/brain-delivery-system.json';

test('shared memory CI discovers future guard regression tests by family instead of hand-maintained filenames', async () => {
  const workflow = await readFile(WORKFLOW, 'utf8');
  assert.match(workflow, /tests\/\*guard\*\.test\.mjs/);
});

test('guard discovery regression family itself remains classified by BRAIN delivery', async () => {
  const policy = JSON.parse(await readFile(POLICY, 'utf8'));
  const backend = policy.lanes.find(lane => lane.id === 'backend');
  assert.ok(backend, 'backend lane required');
  assert.ok(backend.paths.includes('tests/branch-delivery-'), 'branch-delivery guard regressions must remain governed');
});
