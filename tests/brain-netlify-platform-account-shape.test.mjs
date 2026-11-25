import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('the Netlify account discrepancy is counted, without expanding selection rights',()=>{
  for(const field of ['slug_exact','slug_like','active_exact','expired_exact','active_disabled','active_missing_identity','active_like','missing_toolkit_slug']){
    assert.match(source,new RegExp('\\b'+field+'\\b'));
  }
  assert.match(source,/netlify_scan: netlifyScan/);
  assert.match(source,/const exact = slug === "netlify_mcp"/);
  assert.match(source,/String\(item\?\.toolkit\?\.slug \|\| ""\)\.toLowerCase\(\) === "netlify_mcp"/);
  assert.match(source,/String\(item\?\.status \|\| ""\)\.toUpperCase\(\) === "ACTIVE"/);
  assert.match(source,/!item\?\.is_disabled/);
  assert.match(source,/typeof item\?\.user_id === "string"/);
  assert.match(source,/typeof item\?\.id === "string"/);
});

test('aggregate diagnostics do not emit account, user, config or credential values',()=>{
  const start=source.indexOf('console.log("NETLIFY_COMPOSIO_ACCOUNT_DISCOVERY"');
  const end=source.indexOf('if (accounts.length === 0)',start);
  const log=source.slice(start,end);
  assert.ok(start>0 && end>start);
  assert.match(log,/netlify_scan: netlifyScan/);
  assert.doesNotMatch(log,/JSON\.stringify\(item\)|console\.log\(item\)/);
  assert.doesNotMatch(log,/\b(accountId|userId|apiKey|authConfigId|oauthToken)\b/);
});

test('bridge still refuses invalid OIDC identity and no arbitrary new Netlify action is allowed',()=>{
  assert.match(source,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(source,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(source,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.match(source,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(source,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
  assert.match(source,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
  assert.match(source,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
});
