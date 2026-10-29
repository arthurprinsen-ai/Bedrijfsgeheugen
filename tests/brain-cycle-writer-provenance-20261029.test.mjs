import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20261029125607_powerhouse_cycle_writer_provenance_20261029.sql','utf8');
const funcs={
 powerhouse_advance_channel_cycle_v1:9,
 powerhouse_advance_sales_action_v1:4,
 powerhouse_ensure_channel_cycle_v1:1,
 powerhouse_ensure_sales_cycle_v1:1,
 powerhouse_sales_outcome_close_loop_v2:6,
};

test('annotates each original canonical DB writer with source provenance without inventing AI actor IDs',()=>{
 const total=Object.values(funcs).reduce((a,b)=>a+b,0);
 assert.equal((sql.match(/'writer_component'/g)||[]).length,total);
 assert.equal((sql.match(/'writer_contract_version','v1'/g)||[]).length,total);
 assert.equal((sql.match(/'agent_attribution','UNKNOWN_NOT_ATTESTED'/g)||[]).length,total);
 for(const name of Object.keys(funcs)){
  assert.match(sql,new RegExp('CREATE OR REPLACE FUNCTION public\\.'+name+'\\('));
  assert.match(sql,new RegExp("'writer_component','public\\."+name+"'"));
 }
 assert.doesNotMatch(sql,/'agent_id'\s*,|['"]after_metric['"]\s*,|['"]before_metric['"]\s*,/);
});
test('preserves canonical security, stage, truth, idempotency and append-only constraints',()=>{
 assert.match(sql,/v_action\.status='done' and v_action\.executed_at is not null/);
 assert.match(sql,/elsif v_action\.status in \('error','expired','skipped'\) then/);
 assert.match(sql,/on conflict \(tenant_id,idempotency_key\) do nothing/);
 assert.doesNotMatch(sql,/SECURITY DEFINER/);
 assert.match(sql,/public\.powerhouse_append_cycle_event_v2\(/);
 assert.doesNotMatch(sql,/CREATE\s+(?:TABLE|TRIGGER|SCHEDULE|EXTENSION)|UPDATE\s+public\.powerhouse_cycle_events|DELETE\s+FROM\s+public\.powerhouse_cycle_events/i);
 assert.match(sql,/RAISE EXCEPTION 'canonical done\/executed_at truth guard changed/);
});
test('compositional writes preserve SQL and source payload claims separately',()=>{
 assert.match(sql,/'agent_attribution','UNKNOWN_NOT_ATTESTED'/);
 assert.match(sql,/'value_type',v_value_type/);
 assert.match(sql,/'outcome_type',new\.outcome_type/);
 assert.match(sql,/'expected_value_eur',v_action\.expected_value_eur/);
});
