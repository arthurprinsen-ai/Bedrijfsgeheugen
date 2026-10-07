import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-forecast-calibrator/index.ts','utf8');

test('AI provider failures defer calibrations instead of returning an application 500',()=>{
  assert.match(source,/last_result:'deferred_provider_unavailable'/);
  assert.match(source,/last_reason:'AI_PROVIDER_UNAVAILABLE'/);
  assert.match(source,/retryAt=new Date\(Date\.now\(\)\+3600000\)/);
  assert.match(source,/providerFailure=\`AI_\$\{ai\.status\}\`/);
  assert.match(source,/return json\(\{ok:true,degraded,due:due\.length,calibrated,uncertain,deferred,provider_status:/);
  assert.doesNotMatch(source,/if\(!ai\.ok\) throw new Error\(\`AI_/);
});

test('one provider failure opens the run-local circuit for remaining obligations',()=>{
  assert.match(source,/if\(providerFailure\)\{await deferObligation\(ob,fid,providerFailure\);continue;\}/);
  assert.match(source,/providerFailure='AI_NETWORK'/);
  assert.match(source,/deferred\+\+/);
});

test('defer is durable and forecast outcomes are never fabricated',()=>{
  assert.match(source,/CALIBRATION_DEFER_WRITE_FAILED/);
  assert.match(source,/\.eq\('obligation_id',ob\.obligation_id\)/);
  assert.match(source,/outcome:'deferred',reason:'AI_PROVIDER_UNAVAILABLE'/);
  assert.doesNotMatch(source,/powerhouse_forecast_calibration'\)\.insert\(\{[^}]*outcome_value:[^}]*deferred/);
});
