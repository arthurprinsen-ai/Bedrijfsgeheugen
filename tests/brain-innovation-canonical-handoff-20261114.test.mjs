import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20261114184600_innovation_canonical_candidate_handoff_v1.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-self-improvement-layer/SKILL.md','utf8');
const workflow=fs.readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');

test('one original daily self-improvement writer, no new scheduler/store/privilege',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_run_self_improvement_layer_v1/i);
  assert.doesNotMatch(sql,/cron\.schedule|create\s+table|create\s+materialized\s+view|create\s+trigger/i);
  assert.match(sql,/revoke execute[\s\S]+from public, anon, authenticated/i);
  assert.match(sql,/grant execute[\s\S]+to service_role/i);
  assert.match(workflow,/brain-innovation-canonical-handoff-20261114\.test\.mjs/);
});

test('every canonical candidate gets stable original BRAIN obligation and producer readback',()=>{
  for(const p of [
    /from public\.powerhouse_optimization_candidate_v1 c/,
    /insert into public\.brain_obligations/,
    /'INNOVATION_DELIVERY'/,
    /'powerhouse-self-improvement-layer-v1'/,
    /'Europe\/Amsterdam'/,
    /c\.candidate_id::text/,
    /sha256\(convert_to\(/,
    /on conflict \(obligation_type,capability_id,business_entity,business_period,business_timezone\)/i,
    /get diagnostics v_handoffs_changed = row_count/i,
    /v_handoffs_expected <> v_handoffs_verified/,
    /INNOVATION_HANDOFF_INCOMPLETE/,
    /join public\.brain_obligations b/
  ]) assert.match(sql,p);
});

test('replays do not erase terminal proof; only source revisions change open commitments',()=>{
  assert.match(sql,/where public\.brain_obligations\.state not in \('FULFILLED','CANCELLED','BREACHED'\)/);
  assert.match(sql,/evidence->>'source_revision'\s+is distinct from excluded\.evidence->>'source_revision'/);
  assert.match(sql,/public\.brain_obligations\.version\+1/);
});

test('handoff is explicitly not implementation and original approval remains protected',()=>{
  for(const s of [
    /OPEN_UNTIL_CONSUMER_ACK/,
    /'terminal_proof_required',true/,
    /'approval_or_release_inferred',false/,
    /'customer_value_inferred',false/,
    /'verified_implementation_claim',false/,
    /'provider_dispatch_authorized', false/,
    /'direct_production_mutation', false/,
    /'approval','REVIEW_REQUIRED'/
  ]) assert.match(sql,s);
  assert.match(skill,/INNOVATION_DELIVERY/);
  assert.match(skill,/candidate.*consumer ACK|consumer ACK.*candidate/i);
});
