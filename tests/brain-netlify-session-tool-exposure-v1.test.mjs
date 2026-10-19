import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../supabase/functions/netlify-deploy-bridge/index.ts',import.meta.url),'utf8');
const begin=code.indexOf('async function executePinnedComposioTool(');
const end=code.indexOf('async function getProxy(',begin);
const handler=code.slice(begin,end);

test('only the original two audited Netlify tools are exposed and preloaded',()=>{
 assert.ok(handler.includes('toolkits: { enable: ["netlify_mcp"] }'));
 assert.ok(handler.includes('preload: { tools: allowed }'));
 assert.ok(handler.includes('tools: { netlify_mcp: { enable: allowed } }'));
 assert.ok(handler.includes('connected_accounts: { netlify_mcp: [context.accountId] }'));
 assert.ok(handler.includes('if (!allowed.includes(slug)) throw'));
 assert.match(handler,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
 assert.match(handler,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
});
test('HTTP 400 diagnostics read only the session tool inventory and never authorize success',()=>{
 assert.ok(handler.includes('if (executeRes.status === 400)'));
 assert.ok(handler.includes('"/tools?limit=100"'));
 assert.ok(handler.includes('requested_tool_exposed: requestedToolExposed'));
 assert.ok(handler.includes('validation_type: safeValidationType'));
 assert.ok(handler.includes('validation_field: whitelistedLocation'));
 assert.ok(handler.includes('has_detail: parsed?.detail !== undefined'));
 assert.ok(handler.includes('throw new Error("composio pinned session execute " + executeRes.status)'));
});
test('provider token/account IDs, response bodies and arbitrary validation text never go to logs',()=>{
 assert.ok(!handler.includes('console.log(raw)'));
 assert.ok(!handler.includes('console.error(raw)'));
 assert.ok(!handler.includes('console.log(sessionRaw)'));
 assert.ok(!handler.includes('console.error(sessionRaw)'));
 assert.match(handler,/const safeValidationType = \[/);
 assert.match(handler,/const whitelistedLocation = locationTokens\.find/);
 assert.ok(handler.includes('provider_log_id: providerLogId'));
});
test('OIDC and read-only health never become deployment authority',()=>{
 assert.ok(code.includes('payload.repository !== expectedRepo || payload.ref !== expectedRef || payload.workflow_ref !== expectedWorkflowRef'));
 const health=code.slice(code.indexOf('if (action === "health")'),code.indexOf('phase = "proxy_read"'));
 assert.ok(health.includes('"NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER"'));
 assert.ok(health.includes('get-project'));
 assert.ok(!health.includes('deploy-site'));
});
