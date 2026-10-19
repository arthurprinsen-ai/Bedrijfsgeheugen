import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('provider session diagnostics cannot conflate toolkit with tools slug',()=>{
  assert.doesNotMatch(source,/\/tool\[\^\\\\n\]/);
  assert.match(source,/reportedField === "toolkits" \|\| signals\.toolkit/);
  assert.match(source,/reportedField === "tools" \|\| signals\.tool_slug/);
  assert.match(source,/category, field: reportedField/);
  assert.match(source,/response_format: validation \? "json" : "non_json"/);
});
test('session diagnostics reveal only typed schema booleans, never raw provider body',()=>{
  const p=source.slice(source.indexOf('if (!sessionRes.ok) {'),source.indexOf('let session: any = {}',source.indexOf('if (!sessionRes.ok) {')));
  assert.match(p,/const signals =/);
  assert.match(p,/providerText = String\(sessionRaw \|\| ""\)\.toLowerCase\(\)\.slice\(0, 12000\)/);
  assert.match(p,/console\.error\("NETLIFY_COMPOSIO_SESSION_VALIDATION", JSON\.stringify\(\{/);
  assert.match(p,/category, field: reportedField/);
  assert.doesNotMatch(p,/console\.error\([^)]*sessionRaw/);
  assert.doesNotMatch(p,/JSON\.stringify\([^)]*sessionRaw/);
});
test('OIDC and single account/team scoping remain mandatory',()=>{
  assert.match(source,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(source,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(source,/toolkits: \{ enabled: \["netlify_mcp"\] \}/);
  assert.match(source,/connected_accounts: \{ netlify_mcp: \[accountId\] \}/);
  assert.match(source,/execute: \{ enable_multi_execute: false \}/);
  assert.match(source,/tool_slug: toolSlug/);
  assert.match(source,/operation: "deploy-site"/);
});
