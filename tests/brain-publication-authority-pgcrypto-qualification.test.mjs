import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260920102500_publication_authority_pgcrypto_qualification.sql','utf8');

test('publication authority qualifies all pgcrypto calls under locked search_path',()=>{
  assert.match(migration,/set search_path to 'public','pg_catalog'/i);
  assert.match(migration,/extensions\.digest\(/);
  assert.match(migration,/extensions\.gen_random_bytes\(/);
  assert.doesNotMatch(migration,/(?<!extensions\.)\bdigest\(/);
  assert.doesNotMatch(migration,/(?<!extensions\.)\bgen_random_bytes\(/);
});

test('winner and media authority checks remain present',()=>{
  assert.match(migration,/INSTAGRAM_DAILY_WINNER_LINEAGE_MISMATCH/);
  assert.match(migration,/INSTAGRAM_DECISION_WINNER_LINEAGE_MISMATCH/);
  assert.match(migration,/EXACT_FINAL_MIRA_MEDIA_PROOF_REQUIRED/);
  assert.match(migration,/CANONICAL_DISPATCHING_STATE_REQUIRED/);
});
