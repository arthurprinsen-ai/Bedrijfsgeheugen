import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('session uses request-side enable instead of provider-normalized response enabled',()=>{
  assert.match(source,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.doesNotMatch(source,/toolkits: \{ enabled: \["netlify_mcp"\] \}/);
});

test('provider session error diagnostics contain only HTTP, fixed field enum, response format',()=>{
  const start=source.indexOf('if (!sessionRes.ok) {');
  const end=source.indexOf('const sessionId =',start);
  const code=source.slice(start,end);
  assert.ok(start>0&&end>start);
  assert.match(code,/NETLIFY_SESSION_CONFIG_REJECTED/);
  assert.match(code,/http: sessionRes\.status, field/);
  assert.match(code,/format: session \? "json" : "other"/);
  assert.match(code,/\["toolkits","connected_accounts","user_id","workbench","manage_connections"\]/);
  assert.doesNotMatch(code,/console\.(log|error)\([^;]*sessionRaw/);
});

test('OIDC/account pins and provider response failure gates remain',()=>{
  assert.match(source,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(source,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(source,/const accepted = executeRes\.ok && resultType === "completed"/);
  assert.match(source,/parsed\?\.data !== undefined && parsed\?\.data !== null/);
  assert.match(source,/parsed\?\.data\?\.successful !== false/);
  assert.match(source,/tool_slug: slug/);
  assert.match(source,/execute: \{ enable_multi_execute: false \}/);
  assert.match(source,/operation: "deploy-site"/);
});
