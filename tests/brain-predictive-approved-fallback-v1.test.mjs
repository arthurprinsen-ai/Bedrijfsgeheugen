import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');

test('predictive fallback only for explicit provider exhaustion, rate limits or outages',async()=>{
 const {fallbackEligible}=await import('../supabase/functions/_shared/predictive-approved-fallback.mjs');
 assert.equal(fallbackEligible(new Error('AI_400:Your credit balance is too low to access the Anthropic API.')),true);
 assert.equal(fallbackEligible(new Error('AI_429:Rate limited')),true);
 assert.equal(fallbackEligible(new Error('AI_502:Unhealthy')),true);
 for(const e of ['AI_400:bad payload','AI_401:invalid key','AI_GOVERNANCE_UNAVAILABLE','AI_400:No permissions','UNKNOWN_ERROR']){
   assert.equal(fallbackEligible(new Error(e)),false,e);
 }
});

test('external fallback input whitelists public signals and redacts private contacts',async()=>{
 const {publicForecastContext}=await import('../supabase/functions/_shared/predictive-approved-fallback.mjs');
 const x=publicForecastContext({today:'2026-10-08',goal:{deadline:'2027-09-14'},existing_forecasts:[{private_contact:'alice@example.com'}],revenue_learnings:[{dm_body:'secret'}],signals:[
  {signal_key:'external:one',source_type:'external_news',topic_key:'Market demand',direction:'emerging',strength:0.9,novelty:0.8,lead_time_days:40,evidence:{title:'Public story',summary:'Contact me alice@example.com +31 6 12345678',raw_dm_body:'PRIVATE',secret:'SECRET',domain:'example.com'}},
  {signal_key:'private:two',source_type:'raw_private_payloads',topic_key:'Private',evidence:{secret:'NEVER'}}
 ]});
 const s=JSON.stringify(x);
 assert.equal(x.signals.length,1);
 assert.deepEqual(Object.keys(x).sort(),['goal','signals','today']);
 for(const banned of ['alice@example.com','PRIVATE','SECRET','raw_dm_body','revenue_learnings','existing_forecasts','+31 6 12345678'])assert.ok(!s.includes(banned),banned);
 assert.ok(s.includes('Public story'));
});

test('fallback only accepts evidence-bound schema-conformant forecast plans',async()=>{
 const {parseForecastPlan}=await import('../supabase/functions/_shared/predictive-approved-fallback.mjs');
 const sample={topic_key:'energy',scope:'market',scope_key:'SME',predicted_event:'Increase',predicted_problem:'Costs',predicted_question:'How?',predicted_search_intent:'cost',predicted_buying_trigger:'price',probability:0.6,confidence:0.7,expected_lead_days:20,signal_acceleration:0.4,market_saturation:0.3,whitespace_score:0.7,strategic_fit:0.7,revenue_potential:0.5,prediction_mode:'anticipatory',evidence_keys:['external:a','search:b'],rationale:'Two public signals'};
 assert.deepEqual(parseForecastPlan(JSON.stringify({forecasts:[sample]}),['external:a','search:b']).forecasts[0],sample);
 assert.throws(()=>parseForecastPlan(JSON.stringify({forecasts:[{...sample,evidence_keys:['external:a','invented']}] }),['external:a','search:b']),/FALLBACK_FORECAST_SCHEMA_INVALID/);
 assert.throws(()=>parseForecastPlan('not JSON', ['external:a']),/FALLBACK_FORECAST_SCHEMA_INVALID/);
 assert.throws(()=>parseForecastPlan(JSON.stringify({forecasts:[{...sample,probability:4}]}),['external:a','search:b']),/FALLBACK_FORECAST_SCHEMA_INVALID/);
});

test('predictive production source routes only through approved Anthropic',()=>{
 assert.ok(src.includes("gov.provider!=='Anthropic'"));
 assert.match(src, /fetch\('https:\/\/api\.anthropic\.com\/v1\/messages'/);
 assert.ok(src.includes("generationProvider='Anthropic'"));
 assert.ok(src.includes('generation_provider:generationProvider'));
 for(const banned of ['Composio/Groq','runValidatedApprovedFallback','fallbackGov','COMPOSIO_SEARCH_GROQ_CHAT','predictive-approved-fallback']){
   assert.ok(!src.includes(banned),banned);
 }
});


test('outbound fallback uses the existing approved Composio/Groq tool without forwarding private context',async()=>{
 const {callApprovedForecastFallback,publicForecastContext}=await import('../supabase/functions/_shared/predictive-approved-fallback.mjs');
 const context=publicForecastContext({today:'2026-10-08',goal:{deadline:'2027-09-14'},signals:[{signal_key:'external:1',source_type:'external_news',topic_key:'sme',evidence:{title:'public'}}]});
 let request;
 const fakeFetch=async(url,options)=>{request={url,...options};return {ok:true,status:200,json:async()=>({successful:true,data:{choices:[{message:{content:'{"forecasts":[]}'}}]}})}};
 const raw=await callApprovedForecastFallback({apiKey:'test-key-no-real-token',model:'openai/gpt-oss-120b',context,fetchImpl:fakeFetch});
 assert.equal(raw,'{"forecasts":[]}');
 assert.equal(request.url,'https://backend.composio.dev/api/v3.1/tools/execute/COMPOSIO_SEARCH_GROQ_CHAT');
 assert.equal(request.headers['x-api-key'],'test-key-no-real-token');
 const data=JSON.parse(request.body);
 assert.equal(data.arguments.model,'openai/gpt-oss-120b');
 assert.equal(data.arguments.messages.length,2);
 assert.ok(!JSON.stringify(data.arguments.messages).includes('raw_private_payloads'));
});


test('approved fallback retries invalid schema once, retaining strict validation and public-only input',async()=>{
 const {runValidatedApprovedFallback}=await import('../supabase/functions/_shared/predictive-approved-fallback.mjs');
 const context={today:'2026-10-08',goal:{deadline:'2027-09-14'},signals:[{signal_key:'external:1',source_type:'external_news',topic_key:'market'},{signal_key:'search:2',source_type:'search_demand',topic_key:'market'}]};
 const seen=[];
 const mock=async(url,options)=>{seen.push(JSON.parse(options.body));const value=seen.length===1?'not-json':'{"forecasts":[]}';return {ok:true,status:200,json:async()=>({successful:true,data:{choices:[{message:{content:value}}]}})};};
 const result=await runValidatedApprovedFallback({apiKey:'test',model:'openai/gpt-oss-120b',context,fetchImpl:mock});
 assert.deepEqual(result.plan,{forecasts:[]});
 assert.equal(result.schemaRetryCount,1);
 assert.equal(seen.length,2);
 assert.ok(seen[1].arguments.messages[0].content.includes('herkansing'));
});

test('approved fallback fails closed after one retry and never retries provider errors',async()=>{
 const {runValidatedApprovedFallback}=await import('../supabase/functions/_shared/predictive-approved-fallback.mjs');
 const context={signals:[{signal_key:'external:1',source_type:'external_news'}]};
 let calls=0;
 const invalid=async()=>{calls++;return {ok:true,status:200,json:async()=>({successful:true,data:{choices:[{message:{content:'INVALID'}}]}})};};
 await assert.rejects(runValidatedApprovedFallback({apiKey:'test',model:'openai/gpt-oss-120b',context,fetchImpl:invalid}),/FALLBACK_FORECAST_SCHEMA_INVALID/);
 assert.equal(calls,2);
 calls=0;
 const rejected=async()=>{calls++;return {ok:false,status:503,json:async()=>({error:'service unavailable'})};};
 await assert.rejects(runValidatedApprovedFallback({apiKey:'test',model:'openai/gpt-oss-120b',context,fetchImpl:rejected}),/FALLBACK_PROVIDER_UNAVAILABLE/);
 assert.equal(calls,1);
});
