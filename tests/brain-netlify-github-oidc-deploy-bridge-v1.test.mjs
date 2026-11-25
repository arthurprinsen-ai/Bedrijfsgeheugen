import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('GitHub OIDC is a fail-closed exact-source fallback, not the primary authority',()=>{
  assert.match(workflow,/id-token:\s*write/);
  const nativeTimeout=workflow.indexOf('NETLIFY_NATIVE_GIT_PRIMARY_TIMEOUT');
  const oidc=workflow.indexOf('ACTIONS_ID_TOKEN_REQUEST_URL',nativeTimeout);
  const bridge=workflow.indexOf('netlify-deploy-bridge',oidc);
  const masked=workflow.indexOf('::add-mask::$fresh_proxy',bridge);
  assert.ok(nativeTimeout>=0);
  assert.ok(oidc>nativeTimeout);
  assert.ok(bridge>oidc);
  assert.ok(masked>bridge);
  assert.match(workflow,/NETLIFY_JIT_FALLBACK_UNAVAILABLE/);
  assert.match(workflow,/NETLIFY_MCP_PROXY_PATH=%s/);
  assert.doesNotMatch(workflow,/Acquire Netlify deploy transport through GitHub OIDC/);
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
});
