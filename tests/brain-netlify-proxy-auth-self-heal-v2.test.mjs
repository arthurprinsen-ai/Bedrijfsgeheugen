import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('Netlify exact-source upload reacquires OIDC and proxy for each bounded auth attempt',()=>{
  const start=workflow.indexOf('for transport_attempt in $(seq 1 3)');
  const end=workflow.indexOf('deploy_id="$(node',start);
  assert.ok(start>0&&end>start,'bounded exact-source auth retry block missing');
  const block=workflow.slice(start,end);
  assert.match(block,/ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(block,/netlify-deploy-bridge/);
  assert.match(block,/fresh_proxy=/);
  assert.match(block,/npx -y @netlify\/mcp@latest/);
  assert.ok(block.indexOf('fresh_proxy=')<block.indexOf('npx -y @netlify/mcp@latest'),'fresh proxy must be acquired before every deploy attempt');
});

test('only transient 401 is retried and non-auth transport errors fail closed',()=>{
  assert.match(workflow,/grep -q '401 Unauthorized' "\$deploy_log"/);
  assert.match(workflow,/NETLIFY_EXACT_SOURCE_AUTH_REFRESH/);
  assert.match(workflow,/PIPESTATUS\[0\]/);
  assert.match(workflow,/non-recoverable status/);
  assert.match(workflow,/remained unauthorized after bounded fresh-credential retries/);
});
