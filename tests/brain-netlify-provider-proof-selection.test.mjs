import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('active Netlify candidates are gathered across pages without broadening authority',()=>{
  assert.match(src,/const accounts: any\[\] = \[\]/);
  assert.match(src,/const pageCandidates = payload\.items\.filter/);
  assert.match(src,/String\(item\?\.toolkit\?\.slug \|\| ""\)\.toLowerCase\(\) === "netlify_mcp"/);
  assert.match(src,/String\(item\?\.status \|\| ""\)\.toUpperCase\(\) === "ACTIVE"/);
  assert.match(src,/!item\?\.is_disabled/);
  assert.match(src,/typeof item\?\.id === "string"/);
  assert.match(src,/typeof item\?\.user_id === "string"/);
  assert.match(src,/accounts\.push\(\.\.\.pageCandidates\)/);
  assert.match(src,/if \(accounts.length > 4\) throw new Error\("composio netlify candidate pool ambiguous"\)/);
  assert.match(src,/const nextCursor = String\(payload\?\.next_cursor \|\| ""\)\.trim\(\)/);
  assert.match(src,/accounts\.sort\(\(a: any, b: any\) => age\(b\) - age\(a\)\)/);
});

test('verify provider identity by read-only operation for every candidate before any deploy proxy',()=>{
  const start=src.indexOf('phase = "provider_authority_selection";');
  const end=src.indexOf('phase = "proxy_read";',start);
  assert.ok(start>0 && end>start);
  const selection=src.slice(start,end);
  assert.match(selection,/for \(const \[index, candidate\] of candidateContexts\.entries\(\)\)/);
  assert.match(selection,/await executePinnedComposioTool\(candidate,/);
  assert.match(selection,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
  assert.match(selection,/operation: "get-project"/);
  assert.match(selection,/params: \{ siteId \}/);
  assert.match(selection,/if \(readResult\.includes\(siteId\)\)/);
  assert.match(selection,/verifiedContext = candidate/);
  assert.match(selection,/if \(!verifiedContext\) throw new Error\("composio netlify site authority unverified"\)/);
  assert.match(src,/const proxy = await getProxy\(verifiedContext\)/);
  assert.ok(src.indexOf('getProxy(verifiedContext)')>end);
  assert.doesNotMatch(selection,/operation: "deploy-site"/);
});

test('candidate probing fails closed and logs only ordinal/total, never identities',()=>{
  const start=src.indexOf('console.warn("NETLIFY_BACKUP_PROVIDER_CANDIDATE_REJECTED"');
  const end=src.indexOf('if (!verifiedContext)',start);
  assert.ok(start>0 && end>start);
  const logged=src.slice(start,end);
  assert.match(logged,/candidate_position:index\+1/);
  assert.match(logged,/eligible_candidates:candidateContexts\.length/);
  assert.doesNotMatch(logged,/accountId|userId|apiKey|sessionId|oauth|secret/);
  assert.match(src,/composio_netlify_provider_authority_unverified/);
  assert.match(src,/status = 424/);
});

test('OIDC protected main, fixed site and explicit account-bound session remain mandatory',()=>{
  assert.match(src,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(src,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(src,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.match(src,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(src,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
  assert.match(src,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
});
