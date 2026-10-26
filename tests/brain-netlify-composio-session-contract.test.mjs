import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('session fixes response-shape versus request-shape mismatch',()=>{
  const start=src.indexOf('const sessionRes = await fetch');
  const end=src.indexOf('const sessionRaw = await sessionRes.text()',start);
  const segment=src.slice(start,end);
  assert.ok(start>0&&end>start);
  assert.match(segment,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.doesNotMatch(segment,/toolkits: \{ enabled:/);
  assert.match(segment,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(segment,/user_id: context\.userId/);
  assert.match(segment,/signal: AbortSignal\.timeout\(20000\)/);
});

test('new session failure logging never leaks raw provider details or identities',()=>{
  const segment=src.slice(src.indexOf('if (!sessionRes.ok) {'),src.indexOf('const sessionId =',src.indexOf('if (!sessionRes.ok) {')));
  assert.match(segment,/NETLIFY_SESSION_CONFIG_REJECTED/);
  assert.match(segment,/http: sessionRes\.status, field/);
  assert.doesNotMatch(segment,/console\.(log|error)\([^;]*sessionRaw\s*\)/);
  assert.match(segment,/throw new Error\("composio pinned session create " \+ sessionRes\.status\)/);
});

test('execution pins account and never exposes arbitrary tool choice via caller',()=>{
  assert.match(src,/account: context\.accountId/);
  assert.match(src,/tool_slug: slug/);
  assert.match(src,/if \(!allowed\.includes\(slug\)\) throw/);
  assert.match(src,/params: \{ siteId \}/);
  assert.match(src,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
});
