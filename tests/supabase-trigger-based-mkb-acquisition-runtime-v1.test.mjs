import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration=await readFile(new URL('../supabase/migrations/20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql',import.meta.url),'utf8');

test('trigger runtime reuses canonical stores and creates no parallel CRM or scheduler',()=>{
  assert.match(migration,/powerhouse_runtime_events/);
  assert.match(migration,/powerhouse_opportunities/);
  assert.match(migration,/powerhouse_sales_actions/);
  assert.match(migration,/powerhouse_forecasts/);
  assert.doesNotMatch(migration,/create\s+table\s+/i);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
  assert.match(migration,/cron\.alter_job/);
  assert.match(migration,/jobname='powerhouse-commercial-learning-v1'/);
});

test('generic relationship activation is not enough to become a buying trigger',()=>{
  assert.match(migration,/nullif\(e\.evidence->>'trigger_type'/);
  assert.match(migration,/nullif\(e\.context->>'trigger_type'/);
  assert.doesNotMatch(migration,/context::text/);
});

test('all canonical trigger families are represented',()=>{
  for(const trigger of [
    'growth','new_management','buy_sell_ma','investor_pe','post_merger_integration',
    'erp_afas_change','margin_cost_cashflow_pressure','talent_shortage_key_person_risk',
    'regulation','financing','turnaround','ai_data_digitalisation'
  ]) assert.ok(migration.includes("'"+trigger+"'"),trigger+' missing');
});

test('runtime creates only zero-value canonical opportunity/forecast hypotheses until value evidence exists',()=>{
  assert.match(migration,/expected_value_eur,probability,confidence,expected_revenue_value/);
  assert.match(migration,/0,0\.08,least\(0\.80,r\.confidence\),0/);
  assert.match(migration,/revenue_potential[\s\S]*0,/);
  assert.match(migration,/revenue_potential stays zero/);
});

test('automatic action is internal research and external outreach remains fail closed',()=>{
  assert.match(migration,/'research_enrichment','internal'/);
  assert.match(migration,/'external_side_effect_allowed',false/);
  assert.match(migration,/'external_outreach_executed',false/);
  assert.doesNotMatch(migration,/'commercial_outreach','linkedin_dm'/);
});

test('existing hourly commercial learning authority is wrapped rather than duplicated',()=>{
  assert.match(migration,/powerhouse_refresh_trigger_based_mkb_acquisition_v1\(p_run_date\)/);
  assert.match(migration,/powerhouse_commercial_learning_cycle_v1\(p_run_date\)/);
  assert.match(migration,/powerhouse_trigger_based_mkb_acquisition_cycle_v1/);
});
