import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production transport prefers bounded Git-linked deploy, then token auth, then proxy fallback', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  const wait=workflow.indexOf('for attempt in $(seq 1 3)');
  const alreadyLive=workflow.indexOf('Exact SHA is already live via Git-linked Netlify deploy');
  const token=workflow.indexOf('NETLIFY_AUTH_TOKEN');
  const cli=workflow.indexOf('netlify-cli@latest deploy --build --prod');
  const proxy=workflow.indexOf('npx -y @netlify/mcp@latest');
  const noTransport=workflow.indexOf('No authorized Netlify production transport is available');
  assert.ok(wait >= 0 && alreadyLive > wait);
  assert.ok(token > alreadyLive);
  assert.ok(cli > token);
  assert.ok(proxy > cli);
  assert.ok(noTransport > proxy);
});
