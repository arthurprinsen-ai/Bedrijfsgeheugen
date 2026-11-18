import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync('supabase/migrations/20261104065001_original_recovery_control_plane_native_pgcron_v1.sql','utf8');
const learn = JSON.parse(readFileSync('brain/learning/2026-11-18-original-recovery-cron-channel-outcome-truth.json','utf8'));
const memo = readFileSync('docs/changes/2026-11-18-original-recovery-cron-channel-outcome-truth.md','utf8');
const recovery = readFileSync('.agents/skills/powerhouse-recovery-proof/SKILL.md','utf8');
const insta = readFileSync('.agents/skills/instagram-composio-publisher/SKILL.md','utf8');
const personal = readFileSync('.agents/skills/linkedin-composio-publisher/SKILL.md','utf8');

test('only existing original recovery control-plane cron with one owner and original advisory lease',()=>{
  assert.ok(source.includes("powerhouse-original-recovery-control-plane-v1"));
  assert.ok(source.includes("*/15 * * * *"));
  assert.ok(source.includes("public.powerhouse_recovery_control_plane_tick_v1()"));
  assert.ok(source.includes("v_recovery_jobs > 0"));
  assert.ok(source.includes("ORIGINAL_RECOVERY_CONTROL_PLANE_DUPLICATE_OWNER"));
  assert.ok(source.includes("ORIGINAL_RECOVERY_CONTROL_PLANE_JOB_NAME_CONFLICT"));
  assert.ok(source.includes("ORIGINAL_RECOVERY_CRON_REGISTERED_NOT_ACTIVE"));
  assert.ok(source.includes("PERFORM cron.schedule(v_name, v_schedule, v_command)"));
  assert.ok(recovery.includes("advisory lock") || recovery.includes("advisory-lock"));
  assert.ok(recovery.includes("zonder tweede job/scheduler"));
});

test('native job run is independently distinguished from triage completion and provider outcome',()=>{
  assert.equal(learn.evidence.migration_was_applied,true);
  assert.equal(learn.evidence.cron_active_before,0);
  assert.equal(learn.evidence.cron_active_after,1);
  assert.equal(learn.evidence.original_jobid,186);
  assert.equal(learn.evidence.natural_runid,173114);
  assert.equal(learn.evidence.natural_status,'succeeded');
  assert.equal(learn.evidence.original_triage_completed,307);
  assert.equal(learn.evidence.underlying_outcomes_unresolved,306);
  assert.equal(learn.evidence.provider_recovery_proven,false);
  assert.equal(learn.terminal_success,false);
  assert.equal(learn.independent_effect_verified,false);
  assert.match(memo,/does NOT prove.*provider incidents resolved/i);
});

test('personal LinkedIn never turns zero source into a fabricated first-person social post',()=>{
  assert.match(personal,/PERSONAL_TRUTH_SOURCE_UNVERIFIED/);
  assert.match(personal,/SOURCE_SUPPLY_REQUIRED/);
  assert.ok(personal.includes("Nieuwscontext is geen bewijs"));
  assert.match(personal,/provider ID|provider-ID/);
  assert.equal(learn.evidence.linkedin_personal_provider_post,null);
});

test('Instagram 3 of 3 is retry exhausted, not a new video or a measured face success',()=>{
  assert.equal(learn.evidence.instagram_vision_retry_count,3);
  assert.equal(learn.evidence.instagram_vision_retry_max,3);
  assert.equal(learn.evidence.instagram_meta_post,null);
  assert.ok(insta.includes("MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE"));
  assert.ok(insta.includes("EXHAUSTED"));
  assert.ok(insta.includes("0.940"));
  assert.match(insta,/geen.*vier|vierde|poging vier/i);
});

test('original human-facing report has owner, next action and original immutable incident',()=>{
  assert.equal(learn.fingerprint,'powerhouse|recovery-control-plane|missing-active-cron-after-applied-migration|20261118-v1');
  assert.ok(learn.compiler.failure_class);
  assert.deepEqual(learn.evaluation.historical_replay,['tests/brain-original-recovery-cron-channel-proof-20261118.test.mjs']);
  assert.ok(recovery.includes("bg_gezondheid"));
  assert.ok(memo.includes("brain_failure_registry"));
  assert.match(memo,/No new worker|geen nieuwe worker|No new worker/i);
});
