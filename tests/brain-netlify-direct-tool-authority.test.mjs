import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('direct Composio execution is authenticated and pinned to approved account and exact provider tool',()=>{
  assert.match(s,/api\/v3\.1\/tools\/execute\//);
  assert.match(s,/connected_account_id: context\.accountId/);
  assert.match(s,/user_id: context\.userId/);
  assert.match(s,/version: "latest"/);
  assert.match(s,/signal: AbortSignal\.timeout\(25000\)/);
  assert.match(s,/parsed\?\.successful === false/);
  assert.match(s,/if \(!parsed \|\| parsed\.successful !== true\)/);
  assert.doesNotMatch(s,/fetch\(base \+ "\/tool_router\/session"/);
});

test('health is a real provider read with no deploy-site side effect',()=>{
  const a=s.indexOf('if (action === "health")');
  const b=s.indexOf('phase = "proxy_read";',a);
  assert.ok(a>0 && b>a);
  const health=s.slice(a,b);
  assert.match(health,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
  assert.match(health,/operation: "get-project"/);
  assert.match(health,/params: \{ siteId \}/);
  assert.match(health,/readResult\.includes\(siteId\)/);
  assert.match(health,/provider_readback:true/);
  assert.doesNotMatch(health,/operation: "deploy-site"/);
  assert.ok(s.indexOf('const proxy = await getProxy(accountContext);')>b);
});

test('deployment proxy issuance remains pinned to one Netlify write action and fixed site',()=>{
  assert.match(s,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
  assert.match(s,/operation: "deploy-site"/);
  assert.match(s,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
  assert.match(s,/fresh netlify proxy not issued/);
  assert.match(s,/toolkit.*"netlify_mcp"/);
});

test('GitHub main-only OIDC and project-scoped Composio authority remain intact',()=>{
  assert.match(s,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(s,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(s,/getVaultSecret\("COMPOSIO_API_KEY"\)/);
  assert.match(s,/String\(item\?\.status \|\| ""\)\.toUpperCase\(\) === "ACTIVE"/);
  assert.match(s,/String\(item\?\.toolkit\?\.slug \|\| ""\)\.toLowerCase\(\) === "netlify_mcp"/);
  assert.match(s,/provider_success: parsed\?\.successful === true/);
});
