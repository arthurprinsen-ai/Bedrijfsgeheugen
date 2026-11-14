import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration=fs.readFileSync('supabase/migrations/20261114193000_innovation_original_agent_intake_proof_v1.sql','utf8');
const team=fs.readFileSync('platform/agents/agent-team.mjs','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-self-improvement-layer/SKILL.md','utf8');
const workflow=fs.readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');

test('exactly original daily SQL owner; original control plane, no second scheduler or table',()=>{
  assert.match(migration,/create or replace function public\.powerhouse_run_self_improvement_layer_v1/);
  assert.match(migration,/public\.brain_create_operation\(/);
  assert.doesNotMatch(migration,/cron\.schedule|create\s+(table|materialized view|trigger)|create\s+extension/i);
  assert.match(migration,/revoke execute[\s\S]*from public, anon, authenticated/i);
  assert.match(migration,/grant execute[\s\S]*to service_role/i);
});

test('each source revision becomes exactly one canonical agent intake intent',()=>{
  for(const invariant of [
    /'INNOVATION_INTAKE'/,
    /'innovation-delivery:' \|\| v_intake_row\.candidate_id::text/,
    /left\(v_intake_row\.payload_sha256,16\)/,
    /'agent:agent-integration-engineer'/,
    /'agent:agent-growth-market'/,
    /'INNOVATION_ORIGINAL_OWNER_UNMAPPED/,
    /v_intake_expected <> v_intake_proven/,
    /INNOVATION_INTAKE_MISSING/,
    /op\.correlation_id='innovation-delivery:'/,
    /op\.payload_sha256=b\.payload_sha256/,
    /from public\.brain_operations op/
  ]) assert.match(migration,invariant);
});

test('never confuse PLANNED with received: exact independent consumer proof is required',()=>{
  for(const invariant of [
    /operation_status='VERIFIED'/,
    /nullif\(btrim\(remote_ref\),''\) is not null/,
    /operation_evidence->>'consumer_owner'=original_agent_id/,
    /operation_evidence->>'source_revision'=source_revision/,
    /operation_evidence->>'independent_consumer_readback'='true'/,
    /observed_cycle_verified is true/,
    /OLDER_THAN_24H_DOES_NOT_AUTO_CLOSE|older_than_24h_unclaimed/,
    /OWNER_HANDOFF_PENDING/,
    /data_quality=excluded\.data_quality/,
    /then 'observed' else 'actioned' end/,
    /planned_intake_is_not_execution',true/,
    /new_scheduler',false/
  ]) assert.match(migration,invariant);
  assert.doesNotMatch(migration,/set\s+status\s*=\s*'VERIFIED'|set\s+state\s*=\s*'FULFILLED'/i);
});

test('original engineering + CRO roster, skill and natural workflow wired',()=>{
  assert.match(team,/consume-original-innovation-intake-with-source-bound-correlation-and-real-review/);
  assert.match(team,/consume-original-cro-innovation-intake-and-evaluate-reversible-controlled-experiment/);
  assert.match(team,/reconcile-original-innovation-intake-older-than-24-hours/);
  assert.match(skill,/INNOVATION_INTAKE/);
  assert.match(skill,/consumer_owner/);
  assert.match(skill,/independent_consumer_readback/);
  assert.match(workflow,/tests\/brain-innovation-original-consumer-intake-20261114\.test\.mjs/);
});

test('zero source is never independently verified or silent-green in original runtime replay',()=>{
  const followup=fs.readFileSync('supabase/migrations/20261114235900_innovation_original_agent_intake_recovery_v1.sql','utf8');
  for(const proof of [
    /when v_intake_expected=0 then 'NO_SOURCE_CANDIDATES'/,
    /when v_intake_expected=0 or v_unclaimed>0/,
    /when v_intake_expected=0 then 'NO_SOURCE_CANDIDATES'[\s\S]*when v_unclaimed>0/,
    /zero_sources_never_green',true/,
    /data_quality=excluded.data_quality/,
    /public.brain_create_operation\(/,
    /v_intake_expected <> v_intake_proven/
  ]) assert.match(followup,proof);
  assert.doesNotMatch(followup,/cron\.schedule|create\s+table|create\s+trigger/i);
  assert.match(followup,/revoke execute[\s\S]*from public, anon, authenticated/i);
  assert.match(followup,/grant execute[\s\S]*to service_role/i);
});

test('unstarted original innovation intake stays PLANNED; old RESULT_UNKNOWN recovers without fake success',()=>{
  const source=fs.readFileSync('supabase/migrations/20261114235900_innovation_original_agent_intake_recovery_v1.sql','utf8');
  assert.match(source,/create or replace function public\.powerhouse_execution_resilience_watchdog_v1/i);
  assert.match(source,/create or replace function public\.powerhouse_reconciliation_worker_v2/i);
  assert.doesNotMatch(source,/create or replace function public\.powerhouse_reconciliation_worker_v1/i);
  assert.match(source,/v_job\.evidence->>'prior_escalation_verified'='true'/);
  assert.match(source,/v_job\.evidence->>'original_operation_id'=v_operation\.id::text/);
  assert.match(source,/old\.state='ESCALATED'/);
  assert.match(source,/and b\.state='OPEN'/);
  assert.equal((source.match(/o\.operation_type='INNOVATION_INTAKE'/g)||[]).length>=2,true);
  assert.match(source,/o\.status='PLANNED'[\s\S]{0,180}o\.remote_ref is null/);
  assert.match(source,/o\.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'/);
  assert.match(source,/v_job\.reason='EXECUTION_RESILIENCE_RECOVERY'/);
  assert.match(source,/v_operation\.status='RESULT_UNKNOWN'/);
  assert.match(source,/v_operation\.remote_ref is null/);
  assert.match(source,/join public\.brain_control_plane_bindings cp/);
  assert.match(source,/v_operation\.payload_sha256=b\.payload_sha256/);
  assert.match(source,/WAITING_ORIGINAL_AGENT_INTAKE/);
  assert.match(source,/brain_transition_operation\([\s\S]*'PLANNED'/);
  assert.match(source,/consumer_ack_proven',false/);
  assert.match(source,/independent_effect_proven',false/);
  assert.match(source,/NO_SIDE_EFFECT_STARTED/);
  assert.match(source,/ORIGINAL_AGENT_INTAKE_READY_NOT_EXECUTED/);
  assert.match(source,/NO_SAFE_CANONICAL_RECOVERY_HANDLER/); // default fail-closed for all other types
  assert.match(source,/innovation-intake-original-escalation-recovery:/);
  assert.match(source,/public\.brain_schedule_reconciliation\(/);
  assert.match(source,/r\.state='ESCALATED'/);
  assert.match(source,/original_operation_id',v_candidate\.id/);
  assert.match(source,/unresolved_unstarted_innovation_intakes/);
  assert.match(source,/v_guard_pass := v_stale_unreconciled=0 and v_unresolved_unstarted_intake=0/);
  assert.equal((source.match(/\$function\$\s*;/g)||[]).length,3);
  assert.equal((source.match(/create\s+or\s+replace\s+function/gi)||[]).length,3);
  assert.doesNotMatch(source,/cron\.schedule|create\s+table|create\s+trigger/i);
});
