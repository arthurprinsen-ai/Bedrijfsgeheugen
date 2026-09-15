import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915125800_powerhouse_linkedin_sales_prediction_activation_v1.sql';

test('safe commercial NBA set gets pre-action forecasts without loosening direct outreach',()=>{
  const sql=readFileSync(migration,'utf8');
  assert.match(sql,/buying_window_confidence>=0\.25 and n\.buying_window_score>=0\.30/i);
  assert.match(sql,/linkedin-sales-actions-without-preaction-forecast-v1/i);
  assert.match(sql,/pre-action forecast/i);
  assert.match(sql,/direct.outreach.*positive.value gates/i);
  assert.doesNotMatch(sql,/create\s+table/i);
  assert.doesNotMatch(sql,/make\.com|hook\.eu1/i);
});
