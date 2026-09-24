import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production transport prefers bounded Git-linked deploy before proxy side effect', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  const acquisition=workflow.indexOf('Acquire Netlify deploy transport through GitHub OIDC');
  const wait=workflow.indexOf('for attempt in $(seq 1 3)');
  const alreadyLive=workflow.indexOf('Exact SHA is already live via Git-linked Netlify deploy');
  const proxy=workflow.indexOf('npx -y @netlify/mcp@latest');
  assert.ok(acquisition >= 0);
  assert.ok(wait >= 0 && alreadyLive > wait);
  assert.ok(proxy > alreadyLive, 'Netlify MCP deploy side effect must remain after bounded Git-linked readback');
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
});
