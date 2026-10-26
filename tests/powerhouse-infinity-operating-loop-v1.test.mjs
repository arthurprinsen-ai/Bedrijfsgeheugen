import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261008115500_powerhouse_infinity_operating_loop_v1.sql',import.meta.url),'utf8');

const components=[
  'living_company_graph',
  'counterfactual_twin',
  'opportunity_radar',
  'decision_market',
  'action_fabric',
  'evolution_engine',
  'trust_evidence_kernel'
];

test('one operating loop exposes all seven Powerhouse Infinity components',()=>{
  for(const component of components) assert.match(sql,new RegExp("'"+component+"'"));
  assert.match(sql,/powerhouse_infinity_operating_loop_v1/);
  assert.match(sql,/powerhouse_infinity_status_v1/);
});

test('company impact is tenant scoped, evidence backed and never invents money',()=>{
  assert.match(sql,/p_tenant_id/);
  assert.match(sql,/company_context_evidence_backed/);
  assert.match(sql,/p_estimated_value_eur\s*=>\s*null/i);
  assert.match(sql,/p_estimated_loss_eur\s*=>\s*null/i);
});

test('counterfactuals preserve uncertainty and require measured outcomes',()=>{
  assert.match(sql,/NO_ACTION_BASELINE/);
  assert.match(sql,/CONTEXTUAL_ACTION/);
  assert.match(sql,/experiment_required/);
  assert.match(sql,/causal_effect_not_yet_proven/);
});

test('execution requires provider proof and learning uses verified outcomes',()=>{
  assert.match(sql,/commercial_day_proven/);
  assert.match(sql,/provider_proof/);
  assert.match(sql,/powerhouse_reconcile_intelligence_outcomes_v1/);
  assert.match(sql,/powerhouse_run_daily_compound_learning_v1/);
});

test('trust receipt is append only and public execution is revoked',()=>{
  assert.match(sql,/POWERHOUSE_INFINITY_EVIDENCE_IMMUTABLE/);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/revoke all on .*powerhouse_infinity_cycle_receipts_v1 from public, anon, authenticated/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_infinity_operating_loop_v1/i);
});

test('existing scheduler is upgraded without creating a second scheduler owner',()=>{
  assert.match(sql,/powerhouse_runtime_scheduler_mux_v3/);
  assert.match(sql,/cron\.unschedule\('powerhouse-runtime-scheduler-mux-v1'\)/);
  assert.match(sql,/cron\.schedule\(\s*'powerhouse-runtime-scheduler-mux-v1'/s);
  assert.doesNotMatch(sql,/cron\.schedule\(\s*'powerhouse-infinity/s);
});
