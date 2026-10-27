import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/netlify-deploy-bridge/index.ts','utf8');

test('Composio discovery scans cursor pages instead of silently truncating at 100 accounts',()=>{
  assert.match(source,/new URL\(base \+ "\/connected_accounts"\)/);
  assert.match(source,/endpoint\.searchParams\.set\("account_type", "ALL"\)/);
  assert.match(source,/endpoint\.searchParams\.set\("limit", "100"\)/);
  assert.match(source,/endpoint\.searchParams\.set\("cursor", cursor\)/);
  assert.match(source,/const nextCursor = String\(payload\?\.next_cursor \|\| ""\)\.trim\(\)/);
  assert.match(source,/cursor = nextCursor/);
  assert.ok(source.indexOf('cursor = nextCursor') < source.indexOf('const sessionRes = await fetch'));
});

test('Account discovery is bounded, fail-closed and does not infer authorization from partial pages',()=>{
  assert.match(source,/if \(pages >= 20\) throw new Error\("composio connected accounts pagination incomplete"\)/);
  assert.match(source,/seenCursors\.has\(nextCursor\)/);
  assert.match(source,/!Array\.isArray\(payload\?\.items\)/);
  assert.match(source,/String\(item\?\.status \|\| ""\)\.toUpperCase\(\) === "ACTIVE"/);
  assert.match(source,/typeof item\?\.user_id === "string"/);
  assert.match(source,/if \(accounts.length === 0\) throw new Error\("composio netlify connected account unavailable"\)/);
  assert.match(source,/if \(accounts.length > 4\) throw new Error\("composio netlify candidate pool ambiguous"\)/);
  assert.match(source,/signal: AbortSignal\.timeout\(10000\)/);
});

test('OIDC trust boundary and provider release proof are unchanged',()=>{
  assert.match(source,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(source,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(source,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
  assert.match(source,/composio_netlify_account_not_public/);
});

test('Discovery logs only aggregate metadata, not credentials or account identities',()=>{
  const diagnostic=source.slice(source.indexOf('console.log("NETLIFY_COMPOSIO_ACCOUNT_DISCOVERY"'),source.indexOf('if (accounts.length === 0)'));
  assert.match(diagnostic,/authorized_netlify_found: accounts.length > 0, eligible_candidates: accounts.length/);
  assert.doesNotMatch(diagnostic,/apiKey|accountId|userId|secret|oauth_token/);
});


test('backup authority is monitored by existing strict OIDC workflow, never by public or silent success',()=>{
  const workflow=readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/authority_probe:/);
  assert.match(workflow,/cron: '35 6 \* \* \*'/);
  assert.match(workflow,/github\.event_name == 'schedule'/);
  assert.match(workflow,/audience=bedrijfsgeheugen-netlify-deploy-bridge/);
  assert.match(workflow,/--data '\{"action":"health"\}'/);
  assert.match(workflow,/NETLIFY_BACKUP_AUTHORITY_UNAVAILABLE/);
  assert.match(workflow,/exit 78/);
  assert.match(workflow,/not a deploy proof/);
});
