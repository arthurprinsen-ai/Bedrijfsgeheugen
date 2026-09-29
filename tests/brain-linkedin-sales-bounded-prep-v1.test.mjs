import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20260929163500_linkedin_sales_bounded_prep_v1.sql','utf8');

test('LinkedIn sales prep avoids the full 23k-person intelligence view',()=>{
  assert.doesNotMatch(migration,/powerhouse_person_intelligence_v1/);
  assert.match(migration,/bg_connecties/);
  assert.match(migration,/powerhouse_runtime_events/);
  assert.match(migration,/powerhouse_mkb_trigger_intelligence_v1/);
  assert.match(migration,/max_daily_comments/);
});

test('bounded prep keeps the existing public-comment and DM boundaries',()=>{
  assert.match(migration,/per_person_cooldown_days/);
  assert.match(migration,/no_sales_pitch/);
  assert.match(migration,/dm_capability','UNAVAILABLE'/);
  assert.match(migration,/dm_fallback','email'/);
});
