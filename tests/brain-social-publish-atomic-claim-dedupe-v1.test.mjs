import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('social publisher claims canonical decision before any external provider side effect',()=>{
  const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  const claimState=publisher.indexOf("state: 'dispatching'");
  const claimPredicate=publisher.indexOf(".eq('state', 'content_ready')");
  const instagram=publisher.indexOf("publishInstagramViaComposio(db, art, runDate)");
  const buffer=publisher.indexOf("createPost(bufferToken, input)");
  assert.ok(claimState>=0 && claimPredicate>=0);
  assert.ok(claimState<instagram,'Instagram must be behind the canonical single-writer claim');
  assert.ok(claimState<buffer,'Buffer must be behind the canonical single-writer claim');
  assert.match(publisher,/ALREADY_CLAIMED_OR_DELIVERED/);
});

test('retryable Buffer 429 restores readiness only from the claimed dispatching state',()=>{
  const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  assert.match(publisher,/error instanceof BufferHttpError && error\.status === 429/);
  assert.match(publisher,/update\(\{ state: 'content_ready'[\s\S]{0,300}\.eq\('state', 'dispatching'\)/);
});

test('content reconciler migration is syntactically terminated before privilege statements',()=>{
  const migration=readFileSync('supabase/migrations/20260917235907_social_content_integrity_invalidation_guard.sql','utf8');
  assert.match(migration,/\$function\$;\s*revoke execute on function public\.powerhouse_reconcile_content_outcomes_v1/);
});
