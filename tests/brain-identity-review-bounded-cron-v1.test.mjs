import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20261020114500_identity_review_bounded_cron_v1.sql','utf8');

test('existing identity graph owner is retained, never deleted or deactivated',()=>{
  assert.match(migration,/jobname='powerhouse-identity-graph-v1' and active=true/);
  assert.match(migration,/cron\.alter_job\(v_id,schedule=>v_target_schedule,command=>v_new\)/);
  assert.doesNotMatch(migration,/cron\.unschedule|cron\.schedule\(|delete from cron\.job|active\s*=\s*false/i);
});

test('new six-slot hour preserves capacity but avoids existing minute 52 hourly assurance',()=>{
  assert.match(migration,/2,17,32,42,47,57 \* \* \* \*/);
  assert.doesNotMatch(migration,/v_target_schedule text := '.*52/);
  assert.match(migration,/v_bound_pulse text := 'perform public\.powerhouse_connection_daily_pulse_v1\(v_date,200\);'/);
  assert.match(migration,/for i in 1\.\.1 loop/);
  assert.match(migration,/powerhouse_contact_authority_review_batch_v1/);
  assert.match(migration,/powerhouse_sync_identity_graph_batch_v1\(100\)/);
});

test('idempotent recovery accepts original and already-live bounded state and fails closed on drift',()=>{
  assert.match(migration,/2,17,32,47 \* \* \* \*/);
  assert.match(migration,/2,17,32,42,52,57 \* \* \* \*/);
  assert.match(migration,/CANONICAL_IDENTITY_GRAPH_CRON_SCHEDULE_DRIFT/);
  assert.match(migration,/CANONICAL_IDENTITY_GRAPH_BOUNDED_SOURCE_DRIFT/);
  assert.match(migration,/CANONICAL_IDENTITY_GRAPH_BOUNDS_FAILED/);
  assert.match(migration,/v_schedule is distinct from v_target_schedule or v_new is distinct from v_old/);
  assert.doesNotMatch(migration,/for update/);
});

test('no inferred consent, message sends or direct channel mutators in cron bounding',()=>{
  assert.doesNotMatch(migration,/human_approved\s*=|SEND_MESSAGE|gmail\.send|linkedin\.post|instagram\.publish|bg_connecties\s+set/i);
});

test('authority review size, not only connection pulse, is actually bounded to 200',()=>{
 assert.match(migration,/replace\(v_new,'::date,500\);','::date,200\);'\)/);
 assert.match(migration,/or strpos\(v_new,'::date,500\);'\)>0/);
 assert.match(migration,/or strpos\(v_new,'::date,200\);'\)=0/);
 assert.match(migration,/v_bound_pulse/);
});
