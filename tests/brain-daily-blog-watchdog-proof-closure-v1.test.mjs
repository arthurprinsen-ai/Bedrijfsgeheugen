import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The legacy GitHub watchdog is a read-only verifier; semantic publication
// closure belongs to the EXISTING canonical Supabase/Powerhouse publisher.
// Do not reintroduce the retired GitHub PR/ledger writer.
const source=fs.readFileSync('.github/workflows/daily-blog-live-watchdog.yml','utf8');

test('live blog proof remains authoritative, exact and fail closed',()=>{
  assert.match(source,/name: Exact production live-readback/);
  assert.match(source,/node tools\/content-growth\/live-readback\.mjs "\$url" "\$CONTENT_ID" "\$SLUG"/);
  assert.match(source,/https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/\$SLUG\//);
  assert.match(source,/DAILY_BLOG_NOT_LIVE/);
  assert.match(source,/exit 1/);
  assert.match(source,/steps\.proof\.outputs\.ok == 'true'/);
});

test('only original publisher writes semantic closure: watchdog cannot fork Brain or ledger',()=>{
  assert.match(source,/name: Reconcile proof in canonical publisher only/);
  assert.match(source,/PROOF_WRITER:EXISTING_CANONICAL_POWERHOUSE_BLOG/);
  assert.match(source,/LEGACY_BLOG_WATCHDOG_READ_ONLY/);
  assert.match(source,/permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(source,/git (?:push|commit|add)\b|gh pr (?:create|merge)\b/);
  assert.doesNotMatch(source,/materialize live proof into ledger/i);
});

test('read-only watchdog deduplicates by exact business day and cannot authorize publication',()=>{
  assert.match(source,/BUSINESS_TIME_ZONE: Europe\/Amsterdam/);
  assert.match(source,/businessDate\(new Date\(\),'Europe\/Amsterdam'\)/);
  assert.match(source,/steps\.record\.outputs\.run == 'true'/);
  assert.match(source,/Stop when ledger already records live proof/);
  assert.match(source,/assert-live-ledger\.mjs/);
  assert.doesNotMatch(source,/git push origin HEAD:main|supabase functions deploy|powerhouse-content-orchestrator\/invoke/);
});
