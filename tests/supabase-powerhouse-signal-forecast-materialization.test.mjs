import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915124500_powerhouse_signal_forecast_materialization.sql';

test('predictive signals feed canonical forecasts and zero-value opportunities stay outbound-safe',()=>{
  const sql=readFileSync(migration,'utf8');
  assert.match(sql,/powerhouse_sync_predictive_signal_forecast/i);
  assert.match(sql,/trg_powerhouse_sync_predictive_signal_forecast/i);
  assert.match(sql,/insert into public\.powerhouse_forecasts/i);
  assert.match(sql,/revenue_potential remains zero until observed commercial evidence exists/i);
  assert.match(sql,/expected_value_eur>0 and e\.buying_window>=0\.72/i);
  assert.match(sql,/expected_value_eur>0 and e\.buying_window>=0\.58/i);
  assert.match(sql,/expected_revenue_value>0 or \(o\.probability\*o\.confidence\)>=0\.20/i);
  assert.match(sql,/predictive-signals-without-forecast-materialization-v1/i);
  assert.match(sql,/brain_failure_registry/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_sync_predictive_signal_forecast\(\) from public, anon, authenticated/i);
  assert.doesNotMatch(sql,/revenue_potential[^\n]*[1-9][0-9]*/i);
});
