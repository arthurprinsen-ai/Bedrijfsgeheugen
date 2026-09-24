import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migration=await readFile(new URL('../supabase/migrations/20260924154000_powerhouse_trigger_opportunity_runtime_v1.sql',import.meta.url),'utf8');
const edge=await readFile(new URL('../supabase/functions/powerhouse-company-trigger-ingest/index.ts',import.meta.url),'utf8');

test('company trigger runtime materializes into canonical opportunity and sales-action lineage',()=>{
  assert.match(migration,/powerhouse_materialize_trigger_opportunity_v1/);
  assert.match(migration,/insert into public\.powerhouse_opportunities/);
  assert.match(migration,/insert into public\.powerhouse_sales_actions/);
  assert.match(migration,/forecast_key='signal:'\|\|s\.signal_id::text/);
});

test('market signals never become company opportunities',()=>{
  assert.match(migration,/s\.entity_scope<>'company'/);
  assert.match(migration,/return null/);
});

test('signal-derived opportunities never invent revenue or unlock outbound',()=>{
  assert.match(migration,/expected_value_eur,probability,confidence,expected_revenue_value/);
  assert.match(migration,/0,least\(1,greatest\(0,coalesce\(s\.strength,0\)\)\),v_confidence,0/);
  assert.match(migration,/'channel','internal_research'/);
  assert.match(migration,/'outbound_allowed',false/);
  assert.match(migration,/'revenue_truth','zero_until_observed_commercial_evidence'/);
  assert.doesNotMatch(migration,/channel\s*,\s*'linkedin'/i);
  assert.doesNotMatch(migration,/channel\s*,\s*'email'/i);
});

test('trigger taxonomy covers canonical commercial trigger families',()=>{
  for(const trigger of [
    'growth','new_management','buy_sell_ma','investor_pe','post_merger_integration',
    'erp_afas_change','margin_cost_cashflow_pressure','talent_shortage_key_person_risk',
    'regulation','financing','turnaround','ai_data_digitalisation'
  ]) assert.ok(migration.includes("'"+trigger+"'"),trigger+' missing');
});

test('company trigger ingest is service-role only and requires observed evidence',()=>{
  assert.match(edge,/jwtRole\(req\)!=='service_role'/);
  assert.match(edge,/INCOMPLETE_OBSERVED_TRIGGER/);
  assert.match(edge,/observed_fact/);
  assert.match(edge,/provenance/);
  assert.match(edge,/entity_scope:'company'/);
  assert.match(edge,/TRIGGER_MATERIALIZATION_MISSING/);
});
