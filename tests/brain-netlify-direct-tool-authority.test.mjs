import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('Composio session uses documented request-side enable and exact existing user and account',()=>{
  assert.match(s,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.doesNotMatch(s,/toolkits: \{ enabled:/);
  assert.match(s,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(s,/user_id: context\.userId/);
  assert.match(s,/instant: false/);
  assert.match(s,/manage_connections: \{ enable: false \}/);
  assert.match(s,/workbench: \{ enable: false \}/);
  assert.match(s,/search: \{ enable: false \}/);
  assert.match(s,/execute: \{ enable_multi_execute: false \}/);
});

test('health only reads fixed Netlify project, never invokes deploy',()=>{
  const a=s.indexOf('if (action === "health")');
  const b=s.indexOf('phase = "proxy_read";',a);
  assert.ok(a>0&&b>a);
  const health=s.slice(a,b);
  assert.match(health,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
  assert.match(health,/operation: "get-project"/);
  assert.match(health,/readResult\.includes\(siteId\)/);
  assert.doesNotMatch(health,/operation: "deploy-site"/);
});

test('write action remains fixed to Netlify deploy-service + exact existing site',()=>{
  assert.match(s,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
  assert.match(s,/operation: "deploy-site"/);
  assert.match(s,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
  assert.match(s,/const allowed = \[/);
  assert.match(s,/if \(!allowed\.includes\(slug\)\) throw/);
  assert.match(s,/fresh netlify proxy not issued/);
});

test('main-only OIDC and single-authority Vault remain',()=>{
  assert.match(s,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(s,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(s,/getVaultSecret\("COMPOSIO_API_KEY"\)/);
});
