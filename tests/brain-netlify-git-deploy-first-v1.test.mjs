import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('native Netlify Git is the bounded primary production authority', () => {
  const deploy=workflow.indexOf('Deploy exact source through authorized Netlify transport');
  const nativeWait=workflow.indexOf('NETLIFY_NATIVE_GIT_PRIMARY_WAIT',deploy);
  const nativeTimeout=workflow.indexOf('NETLIFY_NATIVE_GIT_PRIMARY_TIMEOUT',nativeWait);
  const oidc=workflow.indexOf('ACTIONS_ID_TOKEN_REQUEST_URL',nativeTimeout);
  const proxy=workflow.indexOf('npx -y @netlify/mcp@latest',oidc);
  assert.ok(deploy>=0 && nativeWait>deploy);
  assert.match(workflow.slice(nativeWait,nativeTimeout),/for attempt in \$\(seq 1 36\)/);
  assert.match(workflow.slice(nativeWait,nativeTimeout),/release\.json\?native_git=/);
  assert.ok(nativeTimeout>nativeWait);
  assert.ok(oidc>nativeTimeout,'GitHub OIDC must only be acquired after native Git readback times out');
  assert.ok(proxy>oidc,'MCP side effect must remain a fallback after OIDC acquisition');
  assert.doesNotMatch(workflow,/Acquire Netlify deploy transport through GitHub OIDC/);
  assert.doesNotMatch(workflow,/secrets\.NETLIFY_MCP_PROXY_PATH_TEMP/);
});
