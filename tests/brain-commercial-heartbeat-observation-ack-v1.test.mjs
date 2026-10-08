import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const sql=readFileSync('supabase/migrations/20261008100100_commercial_heartbeat_observation_ack_v1.sql','utf8');
const runner=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');

test('valid output observation, not commercial success, owns durable transport acknowledgement',()=>{
  assert.match(sql,/v_output_valid := coalesce\(v_output->>'contract',''\)='powerhouse-commercial-output-assurance-v3'/);
  assert.match(sql,/jsonb_typeof\(v_output->'commercial_day_proven'\)='boolean'/);
  assert.match(sql,/nullif\(v_output->>'commercial_day_state',''\) is not null/);
  assert.match(sql,/v_control_healthy := coalesce\(\(v_gate->>'healthy'\)::boolean,false\)\s+and v_output_valid/);
  assert.doesNotMatch(sql,/v_control_healthy := coalesce\(\(v_gate->>'healthy'\)::boolean,false\)\s+and coalesce\(\(v_output->>'healthy'\)::boolean,false\)/);
});

test('zero provider proof still remains observed, explicitly NOT commercial actioned',()=>{
  assert.match(sql,/v_proven := coalesce\(\(v_output->>'commercial_day_proven'\)::boolean,false\)/);
  assert.match(sql,/when v_proven then 'actioned'\s+else 'observed' end/);
  assert.match(sql,/'commercial_delivery_healthy',coalesce\(\(v_output->>'healthy'\)::boolean,false\)/);
  assert.match(sql,/'commercial_day_proven',v_proven/);
  assert.match(sql,/'commercial_day_state',v_output->>'commercial_day_state'/);
  assert.match(sql,/case when v_control_healthy then 'VERIFIED' else 'PARTIAL' end/);
});

test('external runner durably accepts valid observed state but not errors',()=>{
  assert.match(runner,/\["actioned","observed","done"\]/);
  assert.match(runner,/String\(receipt.data_quality\|\|""\)==="VERIFIED"/);
  assert.match(runner,/if\(!durable\)throw new Error\("HEARTBEAT_DURABLE_READBACK_MISSING"\)/);
});

test('no new scheduler, executor, auth grant or artificial provider proof',()=>{
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|insert into public\.powerhouse_sales_actions|insert into public\.powerhouse_sales_outcomes/i);
  assert.doesNotMatch(sql,/grant\s+execute|disable\s+row\s+level\s+security/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_commercial_heartbeat_v1\(timestamptz\) from public, anon, authenticated/);
  assert.doesNotMatch(sql,/set\s+commercial_day_proven\s*=\s*true/i);
});

test('all four already-applied production migration versions exist as replayable repository SQL',()=>{
  const baselines=[
    ['20261008073832_fix_current_day_commercial_action_proof_v1.sql','powerhouse_reconcile_current_commercial_action_set_v2'],
    ['20261008073907_fix_expired_commercial_action_supersede_v1.sql','powerhouse_reconcile_current_commercial_action_set_v2'],
    ['20261008080905_powerhouse_identity_graph_replay_baseline_v1.sql','powerhouse_identity_graph_v1'],
    ['20261008080913_commercial_day_provider_proof_brain_v1.sql','powerhouse_commercial_output_assurance_v1']
  ];
  for(const [filename,object] of baselines){
    const content=readFileSync('supabase/migrations/'+filename,'utf8');
    assert.ok(content.length>200,filename+' must contain the real applied SQL, not a placeholder');
    assert.ok(content.includes(object),filename+' must recreate its production dependency');
    assert.doesNotMatch(content,/^\s*select\s+1\s*;\s*$/i,filename+' must not be a synthetic no-op');
  }
});

test('reconciled daily commercial action selector excludes expired actions and mutable heartbeat timestamps',()=>{
  for(const version of [
    '20261008073832_fix_current_day_commercial_action_proof_v1.sql',
    '20261008073907_fix_expired_commercial_action_supersede_v1.sql'
  ]){
    const applied=readFileSync('supabase/migrations/'+version,'utf8');
    assert.match(applied,/a\.due_at at time zone 'Europe\/Amsterdam'/i);
    assert.doesNotMatch(applied,/a\.updated_at at time zone 'Europe\/Amsterdam'/i);
    assert.match(applied,/a\.status in \('suggested','prepared','waiting','done'\)/i);
    assert.doesNotMatch(applied,/a\.status in \('suggested','prepared','waiting','done','expired'\)/i);
  }
});

test('immutable historical SQL mirrors retain service-only authorization by exact blob identity',()=>{
  const checker=readFileSync('scripts/brain/check_powerhouse_supabase_security.py','utf8');
  const preceding=readFileSync('supabase/migrations/20261007094500_commercial_heartbeat_current_set_v2.sql','utf8');
  assert.match(preceding,/revoke execute on function public\.powerhouse_reconcile_current_commercial_action_set_v2\(date\)[\s\S]*?from public, anon, authenticated/i);
  assert.match(preceding,/grant execute on function public\.powerhouse_reconcile_current_commercial_action_set_v2\(date\)[\s\S]*?to service_role/i);
  for(const [name,expected] of [
    ['20261008073832_fix_current_day_commercial_action_proof_v1.sql','24e72187af36076f88ace3cb783986344517e764'],
    ['20261008073907_fix_expired_commercial_action_supersede_v1.sql','080696ca32462c1c049a5b6192969f8bb54dfca4']
  ]){
    const path='supabase/migrations/'+name;
    const actual=execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();
    assert.equal(actual,expected,'Historical source must be byte-for-byte immutable: '+name);
    assert.ok(checker.includes('"'+path+'": "'+expected+'"'),'Security exception must require exact hash: '+name);
  }
});
