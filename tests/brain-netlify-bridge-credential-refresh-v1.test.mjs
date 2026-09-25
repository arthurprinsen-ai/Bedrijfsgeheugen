import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('netlify bridge credential recovery stays on exact-source path', () => {
  const workflow = fs.readFileSync('.github/workflows/production-source-snapshot.yml', 'utf8');
  const learning = JSON.parse(fs.readFileSync('brain/learning/netlify-bridge-credential-refresh-20260925-v1.json', 'utf8'));
  assert.match(workflow, /netlify-bridge-credential-refresh-v1/);
  assert.equal(learning.compiler.failure_class, 'NETLIFY_DEPLOY_TRANSPORT_AUTH_STALE');
  assert.ok(learning.prevention.some(x => /HTTP 401/i.test(x)));
  assert.ok(learning.prevention.some(x => /exact main SHA readback/i.test(x)));
});
