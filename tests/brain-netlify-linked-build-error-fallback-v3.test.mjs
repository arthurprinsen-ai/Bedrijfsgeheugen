import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production authority has no duplicate linked-build trigger lane', async () => {
  const workflow = await readFile('.github/workflows/production-source-snapshot.yml', 'utf8');
  assert.doesNotMatch(workflow,/NETLIFY_LINKED_BUILD_TRIGGER/);
  assert.doesNotMatch(workflow,/NETLIFY_LINKED_DEPLOY_FAILED/);
  assert.doesNotMatch(workflow,/linked_fallback=/);
  assert.match(workflow,/NETLIFY_NATIVE_GIT_PRIMARY_WAIT/);
  assert.match(workflow,/NETLIFY_NATIVE_GIT_PRIMARY_TIMEOUT/);
  assert.match(workflow,/npx -y @netlify\/mcp@latest --site-id/);
  assert.match(workflow,/Prove exact production identity/);
});
