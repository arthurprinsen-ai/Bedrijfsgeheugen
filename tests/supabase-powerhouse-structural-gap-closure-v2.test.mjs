import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918090000_powerhouse_structural_gap_closure_v2.sql','utf8');

test('tenant identity review is derived live, not copied to a parallel queue',()=>{
  assert.match(sql,/create or replace view public\.powerhouse_tenant_identity_review_v1/i);
  assert.match(sql,/from public\.scan_inzendingen/i);
  assert.match(sql,/from public\.offerte_inzendingen/i);
  assert.doesNotMatch(sql,/create table\s+public\.powerhouse_tenant_identity_review/i);
});

test('sales actions deterministically bootstrap canonical cycles at truthful signal stage',()=>{
  assert.match(sql,/powerhouse_materialize_sales_action_cycle_row_v1/);
  assert.match(sql,/cycle_id,subject_key,source_signal_ref/);
  assert.match(sql,/a\.action_id/);
  assert.match(sql,/sales-action:' \|\| a\.action_id::text \|\| ':signal'/);
  assert.match(sql,/observed_sales_action_bootstrap_signal/);
  assert.doesNotMatch(sql,/sales-action:' \|\| a\.action_id::text \|\| ':decision'/);
});

test('learning gap closure does not synthesize feedback, economics or realized value',()=>{
  assert.doesNotMatch(sql,/insert into public\.powerhouse_human_feedback_events/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_action_economics/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_realized_values/i);
  assert.match(sql,/executed_actions_missing_observed_economics/);
  assert.match(sql,/executed_actions_without_explicit_human_feedback/);
});

test('platform providers and customer connectors remain separate concepts',()=>{
  assert.match(sql,/'customer_connectors'/);
  assert.match(sql,/'platform_sources'/);
  assert.match(sql,/from public\.connector_definitions/);
  assert.match(sql,/from public\.powerhouse_evidence_sources/);
});

test('strict canonical cycle remains evidence-first after historical action bootstrap',()=>{
  assert.match(sql,/cycles_waiting_for_stage_reconstruction/);
  assert.match(sql,/current_stage='signal'/);
  assert.match(sql,/Later canonical stages are never fabricated/);
  assert.match(sql,/if not exists \([\s\S]*?idempotency_key='sales-action:' \|\| a\.action_id::text \|\| ':signal'/);
  assert.doesNotMatch(sql,/a\.action_id,\s*2,\s*'execution'/);
  assert.doesNotMatch(sql,/a\.action_id,\s*4,\s*'decision'/);
});

test('tenant readiness distinguishes demo fixtures from unresolved production identity',()=>{
  assert.match(sql,/record_class/);
  assert.match(sql,/demo_or_test_records/);
  assert.match(sql,/production_or_unknown_unresolved_records/);
  assert.match(sql,/lower\(btrim\(coalesce\(s\.klant_slug,''\)\)\) in \('demo','test'\)/);
});

test('forecast readiness distinguishes future obligations from overdue calibration debt',()=>{
  assert.match(sql,/overdue_calibration_obligations/);
  assert.match(sql,/future_calibration_obligations/);
  assert.match(sql,/due_at <= now\(\)/);
  assert.match(sql,/due_at > now\(\)/);
});


test('one brain inventory exposes all connected intelligence domains without a parallel store',()=>{
  assert.match(sql,/create or replace view public\.powerhouse_one_brain_intelligence_inventory_v1/i);
  for (const layer of [
    'agent_chat_control_plane','canonical_memory','failure_learning','outcome_obligations',
    'predictive_signals','forecasts','forecast_calibration','external_intelligence','search_intelligence',
    'behavior_intelligence','opportunity_intelligence','sales_action_intelligence','decision_cycles',
    'cycle_events','brain_decisions','value_evaluation','action_economics','human_feedback',
    'experiment_assignments','policy_versions','social_learning','revenue_learning','content_recommendations',
    'channel_decisions','content_artifacts','publication_obligations','resource_intelligence',
    'quality_intelligence','security_intelligence','production_truth','delivery_evidence','ai_governance'
  ]) assert.match(sql,new RegExp("'" + layer + "'"));
  assert.doesNotMatch(sql,/create table\s+public\.powerhouse_one_brain/i);
});

test('one brain reconciliation reuses canonical engines and remains evidence honest',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_one_brain_reconcile_v1/i);
  assert.match(sql,/powerhouse_refresh_forecast_calibration_obligations/);
  assert.match(sql,/powerhouse_mature_experiment_assignments_v1/);
  assert.match(sql,/powerhouse_promote_policy_if_proven_v1/);
  assert.match(sql,/powerhouse_materialize_sales_action_cycle_row_v1/);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_action_economics/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_human_feedback_events/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_realized_values/i);
});

test('one brain health separates green wiring from sparse evidence',()=>{
  assert.match(sql,/create or replace view public\.powerhouse_one_brain_runtime_health_v1/i);
  assert.match(sql,/architecture_state/);
  assert.match(sql,/learning_state/);
  assert.match(sql,/EVIDENCE_DUE_GAPS/);
  assert.match(sql,/EVIDENCE_CURRENT/);
  assert.match(sql,/current_runtime_errors/);
  assert.match(sql,/content_loop_state/);
  assert.match(sql,/green wiring never fabricates economics, feedback, outcomes or causal evidence/);
});

test('one brain reconciliation is continuously scheduled and idempotent',()=>{
  assert.match(sql,/powerhouse-one-brain-reconcile-v1/);
  assert.match(sql,/\*\/10 \* \* \* \*/);
  assert.match(sql,/cron\.unschedule/);
  assert.match(sql,/cron\.schedule/);
});


test('optional forecast calibration freshness never creates a false current runtime error',()=>{
  assert.match(sql,/event_type='source_health_evaluated' and subject_key='forecast-calibration'/);
  assert.match(sql,/revenue_learning_obligations[\s\S]*?FORECAST_CALIBRATION[\s\S]*?due_at<=now\(\)/);
});

test('learning gaps are obligation driven rather than empty-table driven',()=>{
  assert.match(sql,/executed_at is not null[\s\S]*?powerhouse_action_economics/);
  assert.match(sql,/exists\(select 1 from public\.powerhouse_experiment_policies\)[\s\S]*?powerhouse_experiment_assignments/);
  assert.match(sql,/exists\(select 1 from public\.powerhouse_experiment_policies\)[\s\S]*?powerhouse_policy_versions/);
  assert.doesNotMatch(sql,/count\(\*\) filter\(where required_for_autonomous_learning and evidence_state='NO_EVIDENCE_YET'\)/);
});


test('capability inventory makes named models visible and maps every one to canonical authority',()=>{
  assert.match(sql,/create or replace view public\.powerhouse_one_brain_capability_inventory_v1/i);
  for (const capability of [
    'company_decision_engine','decision_scenario_engine','portfolio_ranking','next_best_action',
    'buying_window','latent_problem','offer_problem_match','counterfactual_reasoning',
    'commercial_world_model','revenue_attribution','content_outcome_model','memeability_model',
    'creative_evolution','predictive_first_mover','forecast_calibration','revenue_calibration',
    'meeting_probability','causal_experiment_assignment','policy_promotion','action_economics',
    'company_value','compute_router','budget_governor','runtime_autonomy_guard','shadow_decision',
    'verified_value','outcome_horizons','knowledge_enrichment','architecture_impact',
    'business_graph','living_memory','external_intelligence_loop','quality_intelligence',
    'resource_intelligence','failure_learning','outcome_obligation_engine','execution_resilience',
    'production_evidence_certifier','delivery_control_plane','chat_agent_shared_memory',
    'chat_learning_preflight','one_loop_delivery','autonomous_self_improvement','one_brain_reconciliation'
  ]) assert.match(sql,new RegExp("'" + capability + "'"));
  assert.match(sql,/CONNECTED_TO_ONE_BRAIN/);
  assert.doesNotMatch(sql,/create table\s+public\.powerhouse_one_brain_capability/i);
});


test('legacy economics remains visible but future economics is fail-closed',()=>{
  assert.match(sql,/2026-09-18 07:00:00\+00/);
  assert.match(sql,/legacy_unmeasurable_economics_actions/);
  assert.match(sql,/executed_at >= timestamptz '2026-09-18 07:00:00\+00'/);
  assert.match(sql,/executed_at < timestamptz '2026-09-18 07:00:00\+00'/);
  assert.doesNotMatch(sql,/provider_cost_eur\s*,?\s*0/);
});
