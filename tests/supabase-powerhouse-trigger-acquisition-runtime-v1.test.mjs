import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20260924131500_powerhouse_trigger_based_acquisition_runtime_v1.sql','utf8');

test('trigger acquisition reuses canonical commercial stores and stays fail closed',()=>{
  assert.match(sql,/powerhouse_materialize_trigger_acquisition_v1/i);
  assert.match(sql,/powerhouse_predictive_signals/i);
  assert.match(sql,/insert into public\.powerhouse_opportunities/i);
  assert.match(sql,/insert into public\.powerhouse_sales_actions/i);
  assert.match(sql,/insert into public\.powerhouse_runtime_events/i);
  assert.match(sql,/not_company_specific/i);
  assert.match(sql,/missing_evidence_ref/i);
  assert.match(sql,/internal_research/i);
  assert.match(sql,/direct_outbound_allowed',false/i);
  assert.match(sql,/expected_value_eur and expected_revenue_value remain zero/i);
  assert.match(sql,/expected_value_eur[^\n]*,0/i);
  assert.match(sql,/powerhouse_buying_committee_v1/i);
  assert.match(sql,/on conflict\(opportunity_key\)/i);
  assert.match(sql,/on conflict\(dedupe_key\)/i);
  assert.match(sql,/powerhouse_trigger_acquisition_readiness_v1/i);
  assert.match(sql,/unsafe_outbound_actions/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_materialize_trigger_acquisition_v1/i);
});

test('runtime never converts market signals into account opportunities',()=>{
  assert.match(sql,/v_scope not in \('company','account','organization','organisation','prospect','business'\)/i);
  assert.match(sql,/market_signals_held_from_account_outreach/i);
  assert.doesNotMatch(sql,/entity_scope,''\) in \('market'/i);
});
