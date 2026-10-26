import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');
const config = fs.readFileSync('supabase/config.toml','utf8');

test('Netlify deploy bridge acquires authority through a pinned Composio session', () => {
  assert.match(source, /COMPOSIO_API_KEY/);
  assert.match(source, /connected_accounts\?limit=100&account_type=ALL/);
  assert.match(source, /tool_router\/session/);
  assert.match(source, /composio netlify connected account unavailable/);
  assert.match(source, /NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
  assert.match(source, /connected_accounts:\s*\{\s*netlify_mcp:\s*\[accountId\]/);
  assert.doesNotMatch(source, /\/tools\/execute\/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
  assert.doesNotMatch(source, /netlify_mcp_proxy_20260924/);
  assert.doesNotMatch(source, /netlify_mcp_proxy_current/);
});

test('Netlify deploy bridge never persists an issued proxy', () => {
  assert.match(source, /fresh netlify proxy not issued/);
  assert.doesNotMatch(source, /vault\.update_secret/);
  assert.doesNotMatch(source, /vault\.create_secret/);
});

test('Netlify deploy bridge keeps fail-closed GitHub OIDC scope', () => {
  assert.match(source, /payload\.repository !== expectedRepo/);
  assert.match(source, /payload\.ref !== expectedRef/);
  assert.match(source, /payload\.workflow_ref !== expectedWorkflowRef/);
});

test('Netlify deploy bridge is declared by the canonical Supabase config', () => {
  assert.match(config, /\[functions\.netlify-deploy-bridge\]/);
  assert.match(config, /entrypoint = "\.\/functions\/netlify-deploy-bridge\/index\.ts"/);
});
