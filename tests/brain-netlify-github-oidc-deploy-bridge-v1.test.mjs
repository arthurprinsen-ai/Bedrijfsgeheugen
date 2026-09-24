import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('production deploy transport is acquired through GitHub OIDC',()=>{
  assert.match(workflow,/id-token:\s*write/);
  assert.match(workflow,/Acquire Netlify deploy transport through GitHub OIDC/);
  assert.match(workflow,/ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(workflow,/bedrijfsgeheugen-netlify-deploy-bridge/);
  assert.match(workflow,/netlify-deploy-bridge/);
  assert.match(workflow,/::add-mask::\$proxy/);
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH=%s/);
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
});
