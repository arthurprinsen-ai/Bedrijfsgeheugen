import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql';
function sql(){ return readFileSync(migration,'utf8'); }

test('v3 exposes the remaining commercial activation functions',()=>{
  const s=sql();
  assert.match(s,/create or replace function public\.powerhouse_refresh_opportunity_economics_v2/i);
  assert.match(s,/create or replace function public\.powerhouse_reconcile_commercial_outcomes_v2/i);
  assert.match(s,/create or replace function public\.powerhouse_calibrate_due_forecasts_v2/i);
  assert.match(s,/create or replace function public\.powerhouse_decide_mature_experiments_v2/i);
  assert.match(s,/create or replace function public\.powerhouse_commercial_activation_v3/i);
});

test('opportunity economics use observed pricing as a modeled prior and preserve revenue truth',()=>{
  const s=sql();
  assert.match(s,/powerhouse_offer_pricing_learning_v1/i);
  assert.match(s,/modeled_prior/i);
  assert.match(s,/pricing_sample_size/i);
  assert.match(s,/prior_win_rate/i);
  assert.match(s,/prior_ticket_eur/i);
  assert.match(s,/modeled_expected_revenue_eur/i);
  assert.match(s,/expected_value_eur/i);
  assert.match(s,/does not|never|not realized revenue/i);
});

test('outcomes require provider readback before an action is completed',()=>{
  const s=sql();
  assert.match(s,/provider_readback/i);
  assert.match(s,/provider_message_id/i);
  assert.match(s,/provider_delivery_id/i);
  assert.match(s,/observed_external_event/i);
  assert.match(s,/normalized_outcome_class/i);
  assert.match(s,/observed_realized_revenue_eur/i);
});

test('forecast calibration is post-prediction and brier-backed',()=>{
  const s=sql();
  assert.match(s,/powerhouse_forecast_brier/i);
  assert.match(s,/powerhouse_forecast_calibration/i);
  assert.match(s,/expected_by\s*<\s*p_run_date/i);
  assert.match(s,/occurred_at\s*>=\s*.*created_at/i);
  assert.match(s,/materialized/i);
  assert.match(s,/expired/i);
});

test('experiment decisions never fabricate winners without sample and commercial evidence',()=>{
  const s=sql();
  assert.match(s,/PROMOTE_COMMERCIAL_EVIDENCE/i);
  assert.match(s,/HOLD_NO_COMMERCIAL_EVIDENCE/i);
  assert.match(s,/CONTINUE_MEASURING/i);
  assert.match(s,/min_steekproef/i);
  assert.match(s,/commercial_activation_v3/i);
  assert.match(s,/experimentally supported lift|experimentally_supported_lift/i);
});

test('v3 reuses one scheduler authority and remains service-role only',()=>{
  const s=sql();
  assert.match(s,/powerhouse_commercial_closed_loop_v2\s*\(/i);
  assert.match(s,/powerhouse_commercial_activation_v3\s*\(/i);
  assert.match(s,/cron\.alter_job/i);
  assert.match(s,/powerhouse-execution-guard-hourly/i);
  assert.doesNotMatch(s,/cron\.schedule\s*\(/i);
  for (const fn of [
    'powerhouse_refresh_opportunity_economics_v2',
    'powerhouse_reconcile_commercial_outcomes_v2',
    'powerhouse_calibrate_due_forecasts_v2',
    'powerhouse_decide_mature_experiments_v2',
    'powerhouse_commercial_activation_v3'
  ]) {
    const escaped=fn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    assert.match(s,new RegExp(`revoke all on function public\\.${escaped}\\(date\\) from public, anon, authenticated`,'i'));
    assert.match(s,new RegExp(`grant execute on function public\\.${escaped}\\(date\\) to service_role`,'i'));
  }
});