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
  assert.match(loop,/Buffer is legacy telemetry only and is deliberately absent from the critical path/);
  assert.match(loop,/non_blocking\s*:\s*true/);
  assert.match(loop,/linkedin_authority\s*:\s*'composio'/);
  assert.match(loop,/LEGACY_TELEMETRY_OUTSIDE_CRITICAL_PATH/);
});

test('single canonical tick drains several decided channels without parallel senders or unsafe bypass',()=>{
  assert.match(loop, /MAX_CHANNEL_GENERATIONS\s*=\s*4/);
  assert.match(loop, /for \(; generatedRounds < MAX_CHANNEL_GENERATIONS; generatedRounds\+\+\)/);
  assert.match(loop, /GENERATION_NO_PROGRESS/);
  assert.match(loop, /PENDING_GENERATION_READBACK_FAILED/);
  assert.match(loop, /generation_round/);
  assert.match(loop, /mode: 'publish_only'/);
  assert.doesNotMatch(loop, /cron\.schedule\(/);
});

test('verified founder builder lane reaches independent pre-publication review, while unverified copy stays blocked',()=>{
  const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  assert.match(publisher,/const builderMode = evidence\.ai_native_builder_story_verified === true/);
  assert.match(publisher,/evidence\.ai_native_builder_policy === 'personal-linkedin-ai-native-builder-v1'/);
  assert.match(publisher,/evidence\.build_event_verified === true/);
  assert.match(publisher,/evidence\.arthur_anchor_verified === true/);
  assert.match(publisher,/evidence\.source_backed === true/);
  assert.match(publisher,/evidence\.identity_contract === CONTRACT/);
  assert.match(publisher,/evidence\.identity_gate_version === GATE/);
  assert.match(publisher,/evidence\.source_lineage/);
  assert.match(publisher,/!personalTruthMode && !observationalMode && !builderMode/);
  assert.match(publisher,/ai_native_builder_story_verified: builderMode/);
  assert.match(publisher,/const gate = await review\(url, reviewPayload\)/);
  assert.match(publisher,/gate\.identity_gate_decision !== 'PASS'/);
  assert.match(publisher,/gate\.final_text_hash !== textHash/);
});

test('existing scheduler migration is safe on isolated Supabase preview and never creates a parallel job',()=>{
  const migration=fs.readFileSync('supabase/migrations/20261009092942_restore_existing_content_job_closed_loop_schedule_20261009.sql','utf8');
  assert.match(migration,/FROM cron\.job/);
  assert.match(migration,/jobname = 'powerhouse-content-orchestrator-daily-v1'/);
  assert.match(migration,/IF v_job IS NULL THEN[\s\S]*?CANONICAL_CONTENT_JOB_ABSENT_IN_ISOLATED_PREVIEW_NO_OP[\s\S]*?RETURN;/);
  assert.match(migration,/cron\.alter_job\(/);
  assert.match(migration,/powerhouse_content_closed_loop_tick_v1/);
  assert.doesNotMatch(migration,/cron\.schedule\(/);
  assert.doesNotMatch(migration,/cron\.schedule_in_database\(/);
});
