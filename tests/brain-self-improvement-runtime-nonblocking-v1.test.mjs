import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260928203000_powerhouse_self_improvement_orchestrator_nonblocking_v1.sql','utf8');

test('self improvement orchestrator is non-blocking and does not duplicate Company Intelligence execution',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_run_self_improvement_layer_v1/i);
  assert.doesNotMatch(sql,/v_company\s*:=\s*public\.powerhouse_run_company_intelligence_os_v1/i);
  assert.match(sql,/powerhouse_compound_intelligence_v1/i);
  assert.match(sql,/powerhouse_self_improvement_control_v1/i);
  assert.match(sql,/duplicate_orchestration',false/i);
  assert.match(sql,/powerhouse_autonomous_improvement_cron_v1/i);
});

test('self improvement orchestrator remains service-role only',()=>{
  assert.match(sql,/revoke execute on function public\.powerhouse_run_self_improvement_layer_v1\(date\) from public,anon,authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_run_self_improvement_layer_v1\(date\) to service_role/i);
});
