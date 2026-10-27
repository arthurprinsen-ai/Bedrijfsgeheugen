import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('session execute accepts v3.1 completed data, not legacy successful wrapper',()=>{
  assert.match(s,/const resultType = typeof parsed\?\.result_type === "string"/);
  assert.match(s,/const accepted = executeRes\.ok && resultType === "completed"/);
  assert.match(s,/parsed\?\.data !== undefined && parsed\?\.data !== null/);
  assert.match(s,/!providerError && parsed\?\.data\?\.successful !== false/);
  assert.match(s,/if \(!accepted\) \{/);
  assert.match(s,/return JSON\.stringify\(parsed\.data\)/);
  assert.doesNotMatch(s,/if \(!executeRes\.ok \|\| parsed\?\.successful !== true\)/);
});

test('provider errors are safely categorized, without printing response bodies',()=>{
  const a=s.indexOf('if (!accepted) {');
  const b=s.indexOf('throw new Error("composio pinned session execute " + executeRes.status);',a);
  const seg=s.slice(a,b);
  assert.ok(a>0 && b>a);
  assert.match(seg,/NETLIFY_SESSION_TOOL_REJECTED/);
  assert.match(seg,/result_type: resultType/);
  assert.match(seg,/error_kind: errorKind/);
  assert.match(seg,/provider_log_id: providerLogId/);
  assert.match(seg,/^|OTHER/);
  assert.doesNotMatch(seg,/console\.(?:log|error)\((?:raw|parsed|providerError|errorText)/);
});

test('main OIDC authorization, canonical site pin, and provider-read-only probe still enforced',()=>{
  assert.match(s,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(s,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(s,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(s,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.match(s,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
  assert.match(s,/operation: "get-project"/);
  assert.match(s,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
});
