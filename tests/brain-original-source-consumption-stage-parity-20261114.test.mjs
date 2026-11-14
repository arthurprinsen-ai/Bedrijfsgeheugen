import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile('supabase/migrations/20261114194000_original_source_consumption_stage_receipt_parity_v1.sql','utf8');
const agents = await readFile('platform/agents/agent-team.mjs','utf8');
const skill = await readFile('.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md','utf8');

test('source consumption uses one original commercial owner, not retired split cron owners',()=>{
  assert.match(migration,/create or replace function public\.powerhouse_source_consumption_assurance_v1\(\)/i);
  assert.match(migration,/jobname='powerhouse-commercial-learning-v1' and active/i);
  assert.match(migration,/jobname='powerhouse-runtime-scheduler-mux-v1' and active/i);
  assert.match(migration,/competing_split_jobs=0/i);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(|cron\.unschedule\s*\(|cron\.alter_job\s*\(/i);
});

test('healthy requires three independent original stage receipts, not just a successful cron invocation',()=>{
  for(const stage of [
    'powerhouse_refresh_relationship_revenue_v1',
    'powerhouse_execute_growth_play_actions_v1',
    'powerhouse_commercial_learning_cycle_v1'
  ]) assert.ok(migration.includes(stage));
  assert.match(migration,/event_type='commercial_stage_execution'/i);
  assert.match(migration,/state='actioned'/i);
  assert.match(migration,/evidence->>'reported_degraded'='false'/i);
  assert.match(migration,/context->>'canonical_job_id'='116'/i);
  assert.match(migration,/interval '26 hours'/i);
  assert.match(migration,/stages\.context_at is not null/i);
  assert.match(migration,/stages\.action_at is not null/i);
  assert.match(migration,/stages\.learning_at is not null/i);
});

test('source health is explicitly not provider delivery, consumer ACK, revenue or learned effect',()=>{
  for(const name of ['provider_delivery','original_consumer_ack','commercial_outcome','next_run_learning_application'])
    assert.ok(migration.includes(name));
  assert.match(migration,/NOT_ASSESSED_BY_THIS_READ_MODEL/g);
  assert.match(migration,/language sql\s+stable/i);
  assert.doesNotMatch(migration,/security definer/i);
  assert.doesNotMatch(migration,/insert into |update public\.|delete from |drop table|grant execute|revoke execute/i);
});

test('original reliability and data quality agents retain the same single-chain owner discipline',()=>{
  assert.match(agents,/route-stale-source-consumption-job-names-to-original-116-owner-no-extra-cron/);
  assert.match(agents,/verify-original-commercial-116-stage-receipts-without-claiming-provider-outcome/);
  assert.match(skill,/ONE BRAIN source-consumption source-to-executor parity/i);
  assert.match(skill,/NOT_ASSESSED_BY_THIS_READ_MODEL/);
  assert.match(skill,/geen tweede cron/i);
});
