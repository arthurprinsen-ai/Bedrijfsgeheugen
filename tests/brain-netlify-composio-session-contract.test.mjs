import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('Composio session remains bound to exact active Netlify account and its owner',()=>{
  const segment=src.slice(src.indexOf('const sessionRes = await fetch'),src.indexOf('const sessionRaw = await sessionRes.text()'));
  assert.match(segment,/user_id: userId/);
  assert.match(segment,/toolkits: \{ enabled: \["netlify_mcp"\] \}/);
  assert.match(segment,/connected_accounts: \{ netlify_mcp: \[accountId\] \}/);
  assert.doesNotMatch(segment,/tools: \{ netlify_mcp: \{ enabled:/);
  assert.match(segment,/search: \{ enable: false \}/);
  assert.match(segment,/execute: \{ enable_multi_execute: false \}/);
});

test('session validation cannot leak raw provider response',()=>{
  assert.match(src,/NETLIFY_COMPOSIO_SESSION_VALIDATION/);
  const segment=src.slice(src.indexOf('if (!sessionRes.ok) {'),src.indexOf('let session: any = {}',src.indexOf('if (!sessionRes.ok) {')));
  assert.match(segment,/const reason =/);
  assert.match(segment,/http: sessionRes.status, category: reason/);
  assert.doesNotMatch(segment,/console\.(?:log|error)\([^;]*sessionRaw\s*\)/);
  assert.match(segment,/throw new Error\("composio session create " \+ sessionRes.status\)/);
});

test('provider execute is still pinned to one Netlify updater and one exact production site',()=>{
  assert.match(src,/const toolSlug = "NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER"/);
  assert.match(src,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
  assert.match(src,/tool_slug: toolSlug/);
  assert.match(src,/account: accountId/);
  assert.match(src,/operation: "deploy-site"/);
  assert.match(src,/payload.repository !== expectedRepo \|\| payload.ref !== expectedRef \|\| payload.workflow_ref !== expectedWorkflowRef/);
});
