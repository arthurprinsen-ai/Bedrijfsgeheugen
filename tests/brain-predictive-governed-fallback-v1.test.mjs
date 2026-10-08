import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {executeGovernedForecast,parseForecastPlanJson,isRecoverablePredictiveProviderError} from '../supabase/functions/_shared/predictive-governed-fallback.mjs';

test('Anthropic success never spends fallback or queries another provider',async()=>{
 let calls=0;
 const result=await executeGovernedForecast({primary:async()=>({forecasts:[]}),fallbackConfig:async()=>{calls++;return null;},fallback:async()=>{calls++;throw Error('SHOULD_NOT_CALL');}});
 assert.equal(result.provider,'Anthropic');
 assert.equal(result.fallback,false);
 assert.equal(calls,0);
});

test('credit exhausted falls back exactly once only with canonical approved active provider and model',async()=>{
 let calls=0;
 const result=await executeGovernedForecast({
 primary:async()=>{throw new Error('AI_400:Your credit balance is too low');},
 fallbackConfig:async()=>({provider:'Composio/Groq',model_id:'openai/gpt-oss-120b',approved:true,lifecycle_status:'ACTIVE'}),
 fallback:async()=>{calls++;return {forecasts:[]};}
 });
 assert.equal(calls,1);
 assert.equal(result.provider,'Composio/Groq');
 assert.equal(result.fallback,true);
 assert.match(result.primary_error,/AI_400/);
});

test('no unapproved, suspended, wrong-model or absent fallback provider is ever contacted',async()=>{
 for(const config of [null,{provider:'Composio/Groq',model_id:'other',approved:true,lifecycle_status:'ACTIVE'},{provider:'Composio/Groq',model_id:'openai/gpt-oss-120b',approved:false,lifecycle_status:'ACTIVE'},{provider:'Composio/Groq',model_id:'openai/gpt-oss-120b',approved:true,lifecycle_status:'SUSPENDED'}]){
  let calls=0;
  await assert.rejects(executeGovernedForecast({primary:async()=>{throw Error('AI_400:credit balance');},fallbackConfig:async()=>config,fallback:async()=>{calls++;return {forecasts:[]};}}),/PREDICTIVE_FALLBACK_NOT_APPROVED/);
  assert.equal(calls,0);
 }
});

test('authorization or model-governance failure never triggers a fallback',async()=>{
 let calls=0;
 await assert.rejects(executeGovernedForecast({primary:async()=>{throw Error('AI_GOVERNANCE_UNAVAILABLE');},fallbackConfig:async()=>{calls++;return {};},fallback:async()=>{calls++;return {forecasts:[]};}}),/AI_GOVERNANCE_UNAVAILABLE/);
 assert.equal(calls,0);
 assert.equal(isRecoverablePredictiveProviderError('AI_400:invalid schema'),false);
});

test('fallback provider outage returns failure, never fabricated predictive success',async()=>{
 await assert.rejects(executeGovernedForecast({
   primary:async()=>{throw Error('AI_429:rate limit');},
   fallbackConfig:async()=>({provider:'Composio/Groq',model_id:'openai/gpt-oss-120b',approved:true,lifecycle_status:'ACTIVE'}),
   fallback:async()=>{throw Error('GROQ_503');}
 }),/GROQ_503/);
});

test('Groq content must parse as bounded evidence-plan JSON, not prose or missing forecasts',()=>{
 assert.deepEqual(parseForecastPlanJson('{"forecasts":[]}'),{forecasts:[]});
 assert.deepEqual(parseForecastPlanJson('```json\n{"forecasts":[]}\n```'),{forecasts:[]});
 for(const content of ['not json','{"status":"ok"}','{"forecasts":null}',JSON.stringify({forecasts:Array(7).fill({})})])assert.throws(()=>parseForecastPlanJson(content),/PREDICTIVE_PLAN_/);
});

test('actual predictive Edge entrypoint shares canonical scheduler and selects approved fallback use case',()=>{
 const source=readFileSync('supabase/functions/powerhouse-predictive-engine/index.ts','utf8');
 assert.match(source,/authorizePowerhouseScheduler/);
 assert.match(source,/PREDICTIVE_FALLBACK_USE_CASE/);
 const helper=readFileSync('supabase/functions/_shared/predictive-governed-fallback.mjs','utf8');
 assert.match(helper,/supabase-powerhouse-predictive-first-mover-fallback-v1/);
 assert.match(source,/COMPOSIO_API_KEY/);
 assert.match(source,/executeGovernedForecast\(/);
 assert.match(source,/provider=\$\{provider\}/);
 assert.match(source,/provider_reason/);
 assert.doesNotMatch(source,/\.insert\([^;]+\)\.catch\(/s);
});
