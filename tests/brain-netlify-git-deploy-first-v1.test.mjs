import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production transport prefers bounded Git-linked deploy, then durable auth, then ephemeral proxy fallback', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  const wait=workflow.indexOf('for attempt in $(seq 1 12)');
  const alreadyLive=workflow.indexOf('Exact SHA is already live via Git-linked Netlify deploy');
  const durable=workflow.indexOf('Using durable Netlify auth token for exact-source production deploy.');
  const missing=workflow.indexOf('NETLIFY_DURABLE_DEPLOY_CREDENTIAL_MISSING');
  const proxy=workflow.indexOf('npx -y @netlify/mcp@latest');
  const expired=workflow.indexOf('NETLIFY_EPHEMERAL_PROXY_EXPIRED');
  assert.ok(wait >= 0 && alreadyLive > wait);
  assert.ok(durable > alreadyLive);
  assert.ok(missing > durable);
  assert.ok(proxy > missing);
  assert.ok(expired > proxy);
});
