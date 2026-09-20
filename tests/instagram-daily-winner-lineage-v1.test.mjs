import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Instagram daily winner is persisted ex ante and immutable per date', async () => {
  const sql=await readFile('supabase/migrations/20260920110000_instagram_daily_winner_lineage_v1.sql','utf8');
  assert.match(sql,/powerhouse_instagram_daily_winners_v1/);
  assert.match(sql,/run_date date primary key/);
  assert.match(sql,/EX_ANTE_BEFORE_MEDIA_AND_PUBLICATION/);
  assert.match(sql,/immutable_reuse/);
  assert.match(sql,/daily_winner_recommendation_id/);
  assert.match(sql,/INSTAGRAM_DAILY_WINNER_LINEAGE_MISMATCH/);
});

test('Instagram provider readback normalizes winner format and keeps learning lineage', async () => {
  const sql=await readFile('supabase/migrations/20260920110000_instagram_daily_winner_lineage_v1.sql','utf8');
  assert.match(sql,/winner_recommendation_id/);
  assert.match(sql,/winner_score_version/);
  assert.match(sql,/new\.format:='reel'/);
  assert.match(sql,/powerhouse_capture_instagram_winner_outcome_v1/);
  assert.doesNotMatch(sql,/carousel.*daily_winner/i);
});
