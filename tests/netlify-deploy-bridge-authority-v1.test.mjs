import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('Netlify deploy bridge uses stable credential authority', () => {
  assert.match(source, /netlify_mcp_proxy_current/);
  assert.doesNotMatch(source, /netlify_mcp_proxy_20260924/);
});

test('Netlify deploy bridge preflights proxy authorization', () => {
  assert.match(source, /async function validateProxy/);
  assert.match(source, /out\.status === 401 \|\| out\.status === 403/);
  assert.match(source, /netlify proxy unauthorized/);
});

test('Netlify deploy bridge keeps fail-closed GitHub OIDC scope', () => {
  assert.match(source, /payload\.repository !== expectedRepo/);
  assert.match(source, /payload\.ref !== expectedRef/);
  assert.match(source, /payload\.workflow_ref !== expectedWorkflowRef/);
});
