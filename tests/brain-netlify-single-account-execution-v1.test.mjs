import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/functions/netlify-deploy-bridge/index.ts',import.meta.url),'utf8');
const section=(start,end)=>{
  const first=source.indexOf(start);
  const last=source.indexOf(end,first+1);
  assert.ok(first>=0&&last>first,'expected bridge contract boundaries');
  return source.slice(first,last);
};

test('single-account Composio session pins an existing ACTIVE Netlify account',()=>{
  const context=section('async function executePinnedComposioTool','async function getProxy');
  assert.match(source,/status === "ACTIVE"|toUpperCase\(\) === "ACTIVE"/);
  assert.match(source,/!item\?\.is_disabled/);
  assert.match(context,/user_id: context\.userId/);
  assert.match(context,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(context,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.match(context,/tools: \{ netlify_mcp: \{ enable: allowed \} \}/);
});

test('session execution inherits its pinned account instead of requesting multi-account selection',()=>{
  const context=section('const executeRes = await fetch','const raw = await executeRes.text()');
  assert.match(context,/tool_slug: slug/);
  assert.match(context,/arguments: \{ selectSchema: schema \}/);
  assert.doesNotMatch(context,/\baccount\s*:\s*context\.accountId/);
});

test('Netlify provider health is read-only and unsafe results fail closed',()=>{
  const context=section('if (action === "health")','phase = "proxy_read"');
  assert.match(context,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
  assert.match(context,/operation: "get-project"/);
  assert.match(context,/readResult\.includes\(siteId\)/);
  assert.doesNotMatch(context,/operation:\\s*["']deploy-site["']/);
  assert.match(source,/resultType === "completed"/);
  assert.match(source,/parsed\?\.data\?\.successful !== false/);
  assert.match(source,/throw new Error\("composio pinned session execute " \+ executeRes\.status\)/);
});

test('privileged deployment remains scoped to main OIDC and same Netlify site',()=>{
  assert.match(source,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(source,/getVaultSecret\("COMPOSIO_API_KEY"\)/);
  assert.match(source,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
  assert.match(source,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
});
