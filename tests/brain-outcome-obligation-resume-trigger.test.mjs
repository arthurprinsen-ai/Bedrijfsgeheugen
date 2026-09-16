import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('outcome obligation workflow accepts event-driven resume without changing obligation identity', async () => {
  const workflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /outcome-obligation-resume/);
  assert.match(workflow, /github\.event\.client_payload\.obligation_id/);
  assert.match(workflow, /github\.event\.client_payload\.trigger_fingerprint/);
  assert.match(workflow, /event-trigger/);
});
