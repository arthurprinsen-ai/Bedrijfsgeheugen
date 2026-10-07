import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-forecast-calibrator/index.ts','utf8');

test('known external AI provider exhaustion degrades without transport 500',()=>{
  assert.match(source,/providerDegraded=\/\^AI_\(\?:401\|402\|403\|429\|5\\d\\d\):\/\.test\(detail\)/);
  assert.match(source,/\^AI_400:\.\*credit balance is too low/i);
  assert.match(source,/state:'DEGRADED_AI_PROVIDER'/);
  assert.match(source,/error:'AI_PROVIDER_UNAVAILABLE'/);
  assert.match(source,/retryable:true/);
  assert.match(source,/return json\(\{ok:false,state:'DEGRADED_AI_PROVIDER',[\s\S]*?\},200\)/);
});

test('non-provider runtime failures remain fail closed',()=>{
  assert.match(source,/return json\(\{ok:false,error:detail\},500\)/);
  assert.doesNotMatch(source,/AI_GOVERNANCE_UNAVAILABLE'[\s\S]*?DEGRADED_AI_PROVIDER/);
});

test('provider degradation does not close or materialize forecast work in catch path',()=>{
  const catchBlock=source.slice(source.lastIndexOf('}catch(e:any){'));
  assert.doesNotMatch(catchBlock,/powerhouse_forecasts'\)\.update/);
  assert.doesNotMatch(catchBlock,/revenue_learning_obligations'\)\.update/);
  assert.match(catchBlock,/state:providerDegraded\?'DEGRADED_AI_PROVIDER':'ERROR'/);
});
