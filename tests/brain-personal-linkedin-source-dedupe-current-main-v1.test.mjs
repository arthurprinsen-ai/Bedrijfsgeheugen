import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260925081000_linkedin_personal_source_dedupe_current_main_v1.sql','utf8');

test('personal LinkedIn fallback source cannot reuse a prior content_id',()=>{
  assert.match(migration,/prior\.target_channel='linkedin_personal'/);
  assert.match(migration,/prior\.run_date < p_date/);
  assert.match(migration,/prior\.evidence->>'content_id'/);
  assert.match(migration,/fallback-source:/);
});

test('recovery migration is idempotent when production hotfix already exists',()=>{
  assert.match(migration,/position\(v_new in v_def\) > 0/);
  assert.match(migration,/return;/);
});
