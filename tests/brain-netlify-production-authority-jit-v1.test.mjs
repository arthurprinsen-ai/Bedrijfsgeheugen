import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { declaredFunctions, resolveEdgeRuntimeFunctions } from '../tools/supabase/edge-runtime-scope.mjs';

const source = fs.readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');
const config = fs.readFileSync('supabase/config.toml','utf8');

test('Netlify production authority is acquired just in time and never persisted', () => {
  assert.match(source, /COMPOSIO_API_KEY/);
  assert.match(source, /connected_accounts\?limit=100&account_type=ALL/);
  assert.match(source, /tool_router\/session/);
  assert.match(source, /NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
  assert.match(source, /fresh netlify proxy not issued/);
  assert.doesNotMatch(source, /netlify_mcp_proxy_(?:20260924|current)/);
  assert.doesNotMatch(source, /vault\.update_secret|vault\.create_secret/);
});

test('Netlify production authority remains restricted to canonical GitHub OIDC identity', () => {
  assert.match(source, /payload\.repository !== expectedRepo/);
  assert.match(source, /payload\.ref !== expectedRef/);
  assert.match(source, /payload\.workflow_ref !== expectedWorkflowRef/);
});

test('Netlify deploy bridge is declared in canonical Supabase config', () => {
  assert.ok(declaredFunctions(config).includes('netlify-deploy-bridge'));
  assert.match(config, /\[functions\.netlify-deploy-bridge\][\s\S]*?entrypoint = "\.\/functions\/netlify-deploy-bridge\/index\.ts"/);
});

test('config-only bridge registration attests only the bridge, not every Edge Function', () => {
  const previousConfig=config.replace(
    /\n\[functions\.netlify-deploy-bridge\]\nenabled = true\nverify_jwt = false\nentrypoint = "\.\/functions\/netlify-deploy-bridge\/index\.ts"\n?/,
    ''
  );
  const resolved=resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/config.toml'],
    configText:config,
    baseConfigText:previousConfig
  });
  assert.deepEqual(resolved,['netlify-deploy-bridge']);
});

test('shared Edge runtime changes remain broad and fail closed', () => {
  const resolved=resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/functions/_shared/auth.ts'],
    configText:config,
    baseConfigText:config
  });
  assert.deepEqual(resolved,declaredFunctions(config));
});
