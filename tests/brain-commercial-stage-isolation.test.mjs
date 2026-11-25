import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261011143000_powerhouse_commercial_stage_isolation_v1.sql','utf8');
const stages=[
  "powerhouse_refresh_relationship_revenue_v1",
  "powerhouse_execute_relationship_research_v1",
  "powerhouse_dispatch_relationship_public_research_v1",
  "powerhouse_refresh_trigger_based_mkb_acquisition_v1",
  "powerhouse_refresh_linkedin_company_growth_v1",
  "powerhouse_refresh_growth_swarm_v1",
  "powerhouse_materialize_growth_swarm_v1",
  "powerhouse_activate_all_growth_plays_v2",
  "powerhouse_execute_growth_play_actions_v1",
  "powerhouse_dispatch_linkedin_sales_machine_v1",
  "powerhouse_prepare_autonomous_outreach_v1",
  "powerhouse_optimize_prepared_outreach_v1",
  "powerhouse_dispatch_autonomous_outreach_v1",
  "powerhouse_commercial_learning_cycle_v1"
];

test('every existing commercial stage runs exactly once under its own exception handler',()=>{
  const entries=sql.match(/BEGIN\s+v_[a-z_0-9]+ := public\.powerhouse_[a-z_0-9]+\(p_run_date\);\s+EXCEPTION WHEN OTHERS THEN/g)||[];
  assert.equal(entries.length,stages.length);
  for(const fn of stages){
    assert.equal((sql.match(new RegExp('public\\.'+fn+'\\(p_run_date\\)','g'))||[]).length,1,fn);
  }
});
test('partial errors reported as degraded, never silently green',()=>{
  assert.match(sql,/'degraded',v_failure_count > 0/);
  assert.match(sql,/'failure_count',v_failure_count/);
  assert.match(sql,/'error_code',SQLSTATE/);
  assert.match(sql,/'error_message',left\(SQLERRM,180\)/);
  assert.match(sql,/RETURN jsonb_build_object\(/);
});
test('same invoker and original security gate with no duplicate schedulers',()=>{
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/SET search_path TO 'pg_catalog','public'/);
  assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_trigger_based_mkb_acquisition_cycle_v1\(date\)/);
  assert.match(sql,/FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/TO service_role/);
  assert.doesNotMatch(sql,/cron\.(schedule|alter_job|unschedule)\(/);
  assert.doesNotMatch(sql,/GRANT EXECUTE[\s\S]*TO authenticated/i);
});
