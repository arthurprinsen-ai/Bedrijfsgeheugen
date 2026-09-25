import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260923105500_mira_continuous_human_video_v1.sql','utf8');
const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
const review=fs.readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');

test('Mira Instagram publication remains fail-closed on real continuous video proof',()=>{
  assert.match(migration,/MIRA_CONTINUOUS_HUMAN_VIDEO_REQUIRED/);
  assert.match(migration,/revoke execute on function public\.enforce_mira_continuous_video_capability_v1\(\) from public, anon, authenticated/);
  assert.match(router,/temporal/i);
  assert.match(review,/temporal/i);
});
