import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('enumerates a bounded eligible Netlify account pool rather than first active account',()=>{
  assert.match(src,/async function getComposioCandidates\(\)/);
  assert.match(src,/const accounts: any\[\] = \[\]/);
  assert.match(src,/const pageCandidates = payload\.items\.filter/);
  assert.match(src,/accounts\.push\(\.\.\.pageCandidates\)/);
  assert.match(src,/if \(accounts\.length > 4\) throw new Error\("composio netlify candidate pool ambiguous"\)/);
  assert.match(src,/accounts\.sort\(\(a: any, b: any\) => age\(b\) - age\(a\)\)/);
  assert.match(src,/String\(item\?\.toolkit\?\.slug \|\| ""\)\.toLowerCase\(\) === "netlify_mcp"/);
  assert.match(src,/String\(item\?\.status \|\| ""\)\.toUpperCase\(\) === "ACTIVE"/);
  assert.match(src,/!item\?\.is_disabled/);
  assert.match(src,/typeof item\?\.id === "string"/);
  assert.match(src,/typeof item\?\.user_id === "string"/);
  assert.match(src,/const nextCursor = String\(payload\?\.next_cursor \|\| ""\)\.trim\(\)/);
});

test('health and backup deploy both depend on read-only verified live Netlify site, never metadata-only ACTIVE',()=>{
  const start=src.indexOf('phase = "provider_authority_selection";');
  const end=src.indexOf('phase = "proxy_read";', start);
  const block=src.slice(start,end);
  assert.ok(start>0 && end>start);
  assert.match(block,/for \(const \[index, candidate\] of candidateContexts\.entries\(\)\)/);
  assert.match(block,/NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/);
  assert.match(block,/operation: "get-project"/);
  assert.match(block,/params: \{ siteId \}/);
  assert.match(block,/if \(readResult\.includes\(siteId\)\)/);
  assert.match(block,/verifiedContext = candidate/);
  assert.match(block,/if \(!verifiedContext\) throw new Error\("composio netlify site authority unverified"\)/);
  assert.match(block,/if \(action === "health"\)/);
  assert.doesNotMatch(block,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER|operation: "deploy-site"/);
  assert.match(src,/const proxy = await getProxy\(verifiedContext\)/);
  assert.doesNotMatch(src,/const accountContext = await getComposioContext\(\)/);
});

test('provider failure never falls through to a different account for writes without readback',()=>{
  assert.match(src,/NETLIFY_BACKUP_PROVIDER_CANDIDATE_REJECTED/);
  assert.match(src,/if \(!verifiedContext\) throw new Error/);
  assert.match(src,/composio_netlify_provider_authority_unverified/);
  assert.match(src,/status = 424/);
  assert.match(src,/NETLIFY_BACKUP_PROVIDER_READ_VERIFIED/);
});

test('safely log aggregate counters but never account ids, user ids or secret material',()=>{
  const a=src.indexOf('console.log("NETLIFY_COMPOSIO_ACCOUNT_DISCOVERY"');
  const b=src.indexOf('if (accounts.length === 0)',a);
  const piece=src.slice(a,b);
  assert.match(piece,/eligible_candidates: accounts\.length/);
  assert.doesNotMatch(piece,/accountId|userId|apiKey|token|secret/);
  const c=src.indexOf('console.warn("NETLIFY_BACKUP_PROVIDER_CANDIDATE_REJECTED"');
  assert.match(src.slice(c,c+270),/candidate_position:index\+1/);
  assert.doesNotMatch(src.slice(c,c+270),/accountId|userId|apiKey|token/);
});

test('unchanged GitHub OIDC trust and deploy site pin',()=>{
  assert.match(src,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(src,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(src,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
  assert.match(src,/getVaultSecret\("COMPOSIO_API_KEY"\)/);
  assert.match(src,/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER/);
});
