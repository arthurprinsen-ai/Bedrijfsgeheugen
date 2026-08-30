import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL('../.github/workflows/unified-brain-delivery.yml', import.meta.url);

test('ordinary pull_request verification can never invoke BG169 production promotion', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  const marker = '- name: BG169 primary Make transport with GitHub-native failover';
  const start = yaml.indexOf(marker);
  assert.ok(start >= 0, 'BG169 transport step must exist');
  const block = yaml.slice(start, start + 900);
  assert.match(block, /github\.event_name == 'workflow_dispatch'/);
  assert.match(block, /inputs\.pr_number != ''/);
  assert.match(block, /inputs\.verification_only != true/);
  assert.doesNotMatch(block, /github\.event_name != 'workflow_dispatch'/);
});
