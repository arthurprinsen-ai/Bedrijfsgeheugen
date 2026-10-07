import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('production snapshot orders native Git primary before one OIDC MCP fallback',()=>{
  const nativeWait=workflow.indexOf('NETLIFY_NATIVE_GIT_PRIMARY_WAIT');
  const nativeTimeout=workflow.indexOf('NETLIFY_NATIVE_GIT_PRIMARY_TIMEOUT');
  const oidc=workflow.indexOf('ACTIONS_ID_TOKEN_REQUEST_URL',nativeTimeout);
  const mcp=workflow.indexOf('npx -y @netlify/mcp@latest',oidc);
  assert.ok(nativeWait>=0);
  assert.ok(nativeTimeout>nativeWait);
  assert.ok(oidc>nativeTimeout);
  assert.ok(mcp>oidc);
  assert.doesNotMatch(workflow,/NETLIFY_LINKED_BUILD_TRIGGER/);
  assert.doesNotMatch(workflow,/action:"trigger_build"/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
