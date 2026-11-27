import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const m=readFileSync('supabase/migrations/20261121090000_reconnect_original_email_reply_in_commercial_stage14.sql','utf8');
const reply=readFileSync('supabase/functions/powerhouse-email-reply-loop/index.ts','utf8');
const stage=readFileSync('supabase/migrations/20261011122630_powerhouse_commercial_isolated_hourly_stages_v1.sql','utf8');

test('single 116 canonical scheduler, existing 14 stages, never a parallel cron',()=>{
  assert.match(m,/from cron\.job where jobid=116 and jobname='powerhouse-commercial-learning-v1'/);
  assert.match(m,/v_job\.schedule <> '0,5,7,10,12,15,20,22,25,27,30,35,37,40 \* \* \* \*'/);
  assert.match(m,/if v_stage = 14 then/);
  assert.match(m,/perform cron\.alter_job\(job_id=>v_job\.jobid,command=>v_new\)/);
  assert.match(m,/position\(v_old in v_job\.command\)=0/);
  assert.match(m,/CANONICAL_EMAIL_REPLY_REWIRE_COMMAND_MISMATCH_JOB_116/);
  assert.match(m,/DUPLICATE_EMAIL_REPLY_CRON_FORBIDDEN/);
  assert.doesNotMatch(m,/\bcron\.schedule\s*\(/i);
  assert.doesNotMatch(m,/\bcron\.unschedule\s*\(/i);
  assert.doesNotMatch(m,/\bcron\.alter_job\s*\([^]*\bschedule\s*=>/i);
  assert.match(stage,/powerhouse_commercial_hourly_stage_v1/);
  assert.match(stage,/powerhouse_commercial_learning_cycle_v1/);
});

test('stage14 uses original authorized reply reader; preserves suppression without new sender',()=>{
  assert.match(m,/public\.bg_roep_functie\(\s*'powerhouse-email-reply-loop'/);
  assert.match(m,/public\.bg_geheim\('powerhouse_daily_scheduler_token'\)/);
  assert.match(m,/original-commercial-learning-cron116-stage14/);
  assert.match(m,/commercial_email_reply_dispatch_review/);
  assert.match(m,/SCHEDULER_TOKEN_MISSING/);
  assert.match(m,/CANONICAL_EMAIL_REPLY_DISPATCH_EXCEPTION/);
  assert.match(m,/external_send_authorized',false/);
  assert.doesNotMatch(m,/\bGMAIL_SEND_EMAIL\b|\bGMAIL_CREATE_DRAFT\b|\bnewsletter_send\b/i);
  assert.match(reply,/authorizePowerhouseScheduler\(req\)/);
  assert.match(reply,/powerhouse_email_reply_events/);
  assert.match(reply,/powerhouse_email_contact_suppressions/);
  assert.match(reply,/extractVisibleEmailReply/);
  assert.match(reply,/quoted_only_skipped/);
});

test('preview safe no-op and repeat-safe writeback; no false provider result',()=>{
  assert.match(m,/to_regclass\('cron\.job'\) is null/);
  assert.match(m,/CANONICAL_EMAIL_REPLY_REWIRE_PREVIEW_NO_CRON_NO_OP/);
  assert.match(m,/CANONICAL_EMAIL_REPLY_REWIRE_PREVIEW_NO_JOB_NO_OP/);
  assert.match(m,/CANONICAL_EMAIL_REPLY_ALREADY_REWIRED_JOB_116/);
  assert.match(m,/if v_new=v_job\.command/);
  assert.match(m,/perform powerhouse_ops\.enqueue\(/);
  assert.match(m,/An unsuccessful Gmail read is NOT an unsubscribe/);
  assert.match(m,/independent bg_gezondheid receipt/);
});
