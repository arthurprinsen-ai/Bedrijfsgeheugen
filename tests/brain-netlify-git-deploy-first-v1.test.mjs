import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production transport prefers bounded Git-linked deploy before proxy fallback', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  const wait=workflow.indexOf('for attempt in $(seq 1 3)');
  const alreadyLive=workflow.indexOf('Exact SHA is already live via Git-linked Netlify deploy');
  const secret=workflow.indexOf('NETLIFY_MCP_PROXY_PATH_TEMP is missing');
  const proxy=workflow.indexOf('npx -y @netlify/mcp@latest');
  assert.ok(wait >= 0 && alreadyLive > wait);
  assert.ok(secret > alreadyLive);
  assert.ok(proxy > secret);
});
