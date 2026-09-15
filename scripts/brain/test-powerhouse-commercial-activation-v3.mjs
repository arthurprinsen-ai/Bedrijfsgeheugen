import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = readFileSync('supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql','utf8');
const fix = readFileSync('supabase/migrations/20260915143100_powerhouse_commercial_activation_v3_contract_fix.sql','utf8');
const s = `${base}\n${fix}`;

test('Powerhouse commercial activation v3 closes the canonical commercial loop', () => {
  for (const fn of [
    'powerhouse_refresh_opportunity_economics_v2',
    'powerhouse_reconcile_commercial_outcomes_v2',
    'powerhouse_calibrate_due_forecasts_v2',
    'powerhouse_decide_mature_experiments_v2',
    'powerhouse_commercial_activation_v3'
  ]) assert.match(s, new RegExp(`create or replace function public\\.${fn}`,'i'));

  assert.match(s,/powerhouse_offer_pricing_learning_v1/i);
  assert.match(s,/modeled_prior/i);
  assert.match(s,/provider_readback/i);
  assert.match(s,/powerhouse_forecast_brier/i);
  assert.match(s,/PROMOTE_COMMERCIAL_EVIDENCE/i);
  assert.match(s,/HOLD_NO_COMMERCIAL_EVIDENCE/i);
  assert.match(s,/CONTINUE_MEASURING/i);
  assert.match(s,/experimentally supported lift/i);
  assert.match(s,/cron\.alter_job/i);
  assert.doesNotMatch(s,/cron\.schedule\s*\(/i);
});

test('v3 preserves truth and execution boundaries', () => {
  assert.match(base,/expected_value_eur is not overwritten/i);
  assert.match(base,/realized revenue is only observed powerhouse_sales_outcomes\.revenue_eur/i);
  assert.match(base,/provider_readback_required_for_completion/i);
  assert.match(base,/expected_by\s*<\s*p_run_date/i);
  assert.match(base,/o\.occurred_at\s*>=\s*d\.created_at/i);
  assert.match(fix,/case when v_learning_sample>=5 then 'active' else 'hypothesis' end/i);
  assert.doesNotMatch(fix,/then 'active' else 'observed'/i);
});

test('all v3 production functions are service-role only', () => {
  for (const fn of [
    'powerhouse_refresh_opportunity_economics_v2',
    'powerhouse_reconcile_commercial_outcomes_v2',
    'powerhouse_calibrate_due_forecasts_v2',
    'powerhouse_decide_mature_experiments_v2',
    'powerhouse_commercial_activation_v3'
  ]) {
    const escaped = fn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    assert.match(s,new RegExp(`revoke all on function public\\.${escaped}\\(date\\) from public, anon, authenticated`,'i'));
    assert.match(s,new RegExp(`grant execute on function public\\.${escaped}\\(date\\) to service_role`,'i'));
  }
});
