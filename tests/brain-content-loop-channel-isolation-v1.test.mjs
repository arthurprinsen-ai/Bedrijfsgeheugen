import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const loop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');

test('Instagram winner/media readiness degrades Instagram without blocking other content channels',()=>{
  assert.match(loop,/instagram_daily_winner_gate/);
  assert.match(loop,/degraded: true/);
  assert.doesNotMatch(loop,/winner\.data\?\.selected !== true\) throw new Error\('INSTAGRAM_DAILY_WINNER_REQUIRED'\)/);
  assert.doesNotMatch(loop,/mediaJob\.error \|\| mediaJob\.data\?\.ok !== true\) throw new Error\('INSTAGRAM_WINNER_MEDIA_JOB_FAILED'\)/);
  assert.match(loop,/powerhouse-social-publisher/);
  assert.match(loop,/powerhouse-blog-queue/);
});


test('legacy Buffer sync is non-blocking and cannot own LinkedIn authority',()=>{
  assert.match(loop,/Legacy Buffer sync is telemetry\/compatibility only/);
  assert.match(loop,/non_blocking: true/);
  assert.match(loop,/linkedin_authority: 'composio'/);
  assert.match(loop,/LEGACY_BUFFER_SYNC_UNAVAILABLE/);
});
