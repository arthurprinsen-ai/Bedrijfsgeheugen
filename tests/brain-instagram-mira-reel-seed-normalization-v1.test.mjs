import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/20260922082500_instagram_mira_reel_recommendation_normalization_v1.sql','utf8');

test('Mira daily-life Instagram recommendations are normalized at the DB boundary', () => {
  assert.match(sql,/before insert or update on public\.powerhouse_content_recommendations/i);
  assert.match(sql,/target_channel in \('instagram','instagram_company'\)/i);
  assert.match(sql,/character.*mira/is);
  assert.match(sql,/character_mode.*daily_life/is);
});

test('Reel-only route is OpenArt and removes legacy visual generator', () => {
  assert.match(sql,/- 'visual_generator'/);
  assert.match(sql,/'format','reel'/);
  assert.match(sql,/'production_route','openart_video'/);
  assert.match(sql,/'reel_generator','OpenArt'/);
  assert.match(sql,/'policy_normalization','instagram-mira-reel-only-v3'/);
});

test('existing post-v3 stale seeds are normalized once', () => {
  assert.match(sql,/where run_date >= date '2026-09-21'/);
  assert.match(sql,/<> 'reel'/);
  assert.match(sql,/not like '%openart%'/);
});
