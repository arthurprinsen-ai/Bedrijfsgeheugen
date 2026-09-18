import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='supabase/migrations/20260918152825_powerhouse_control_plane_learning_cockpit_v1.sql';

test('learning compiler routes enforceable failures below prompt level', async()=>{
  const sql=await readFile(path,'utf8');
  for(const kind of ['CI_SECURITY_GATE','DATABASE_CONSTRAINT','RUNTIME_ASSERTION','WORKFLOW','CI_GATE','TEST','SKILL']){
    assert.match(sql,new RegExp(`'${kind}'`));
  }
  assert.match(sql,/canonical_eligible',false/);
  assert.match(sql,/evaluation_evidence_required/);
});

test('high-risk learnings require shadow or canary evaluation', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/SHADOW_THEN_CANARY/);
  assert.match(sql,/CANARY/);
  assert.match(sql,/SHADOW/);
});

test('cockpit is a projection over existing canonical Brain stores', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/public\.brain_obligations/);
  assert.match(sql,/public\.brain_operations/);
  assert.match(sql,/public\.brain_delivery_evidence/);
  assert.match(sql,/public\.brain_reconciliation_jobs/);
  assert.match(sql,/public\.powerhouse_control_plane_next_action_v1/);
  assert.doesNotMatch(sql,/create\s+table\s+/i);
});

test('cockpit exposes only requested control-plane decision fields plus proof metrics', async()=>{
  const sql=await readFile(path,'utf8');
  for(const field of ['requested_goal','current_state','blocker','next_action','actual_result','evidence_count']){
    assert.match(sql,new RegExp(field));
  }
});

test('metrics include first-time-right, retries, false-success risk, human intervention and time-to-terminal', async()=>{
  const sql=await readFile(path,'utf8');
  for(const field of ['first_time_right','retries_total','false_success_risk_count','human_intervention_count','median_time_to_terminal_seconds']){
    assert.match(sql,new RegExp(field));
  }
});

test('compiler and views are service-role only', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/grant execute .*powerhouse_learning_compiler_v1.* to service_role/is);
  assert.match(sql,/grant select on public\.powerhouse_obligation_cockpit_v1 to service_role/i);
  assert.match(sql,/grant select on public\.powerhouse_control_plane_metrics_v1 to service_role/i);
});
