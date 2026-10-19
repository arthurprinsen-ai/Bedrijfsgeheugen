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
  assert.match(source,/if \(!accountId \|\| !userId\) throw new Error/);
  assert.match(source,/signal: AbortSignal\.timeout\(10000\)/);
});

test('OIDC trust boundary and provider release proof are unchanged',()=>{
  assert.match(source,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(source,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(source,/const siteId = "fd527056-493a-4d8a-8125-d00370104fa3"/);
  assert.match(source,/composio_netlify_account_not_public/);
});

test('Discovery logs only aggregate metadata, not credentials or account identities',()=>{
  const diagnostic=source.slice(source.indexOf('console.log("NETLIFY_COMPOSIO_ACCOUNT_DISCOVERY"'),source.indexOf('const accountId ='));
  assert.match(diagnostic,/pages, scanned_accounts: scannedAccounts, authorized_netlify_found: Boolean\(account\)/);
  assert.doesNotMatch(diagnostic,/apiKey|accountId|userId|secret|oauth_token/);
});
