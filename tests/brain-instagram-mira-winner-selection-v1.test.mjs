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


test('content loop, orchestrator and media router reuse the same winner authority', async () => {
  const loop=await readFile('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  const orchestrator=await readFile('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  const router=await readFile('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
  assert.match(loop,/powerhouse_select_instagram_daily_winner_v1/);
  assert.match(loop,/powerhouse_ensure_instagram_media_job_v1/);
  assert.match(orchestrator,/powerhouse_instagram_daily_winners_v1/);
  assert.match(orchestrator,/daily_winner_recommendation_id/);
  assert.match(orchestrator,/INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED/);
  assert.match(router,/job\?\.post_type/);
  assert.match(router,/generation_evidence\?\.daily_winner_format/);
});

test('winner flow stays server-only and reuses canonical reconciliation/secret RPCs', async () => {
  const loop=await readFile('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  const sql=await readFile('supabase/migrations/20260920110000_instagram_daily_winner_lineage_v1.sql','utf8');
  assert.match(loop,/bg_geheim/);
  assert.match(loop,/powerhouse_reconcile_content_outcomes_v1/);
  assert.match(sql,/revoke all on public\.powerhouse_instagram_daily_winners_v1 from public, anon, authenticated/i);
  assert.match(sql,/grant select,insert,update on public\.powerhouse_instagram_daily_winners_v1 to service_role/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_select_instagram_daily_winner_v1\(date\) from public, anon, authenticated/i);
  assert.doesNotMatch(loop,/console\.log\([^\n]*(token|secret|key)/i);
});


test('accepted frozen Instagram winner remains eligible downstream', async () => {
  const orchestrator=await readFile('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  assert.match(orchestrator,/\['suggested','accepted',''\]\.includes\(clean\(row\?\.status\)\)/);
  assert.match(orchestrator,/INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED/);
});
