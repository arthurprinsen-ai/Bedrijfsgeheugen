import test from 'node:test';
import assert from 'node:assert/strict';
const adapter=await import('../supabase/functions/powerhouse-predictive-engine/openai-forecast.mjs').catch(()=>({}));
const schema={type:'object',additionalProperties:false,properties:{forecasts:{type:'array',maxItems:4,items:{type:'object',additionalProperties:false,properties:{probability:{type:'number',minimum:0,maximum:1},evidence_keys:{type:'array',minItems:2,maxItems:8,items:{type:'string'}}},required:['probability','evidence_keys']}}},required:['forecasts']};
const good={forecasts:[{probability:0.7,evidence_keys:['a','b']}]};
const response=(value=good,status='completed')=>({ok:true,json:async()=>({status,output:[{type:'function_call',name:'forecast_plan',arguments:JSON.stringify(value)}]})});
test('OpenAI forecast adapter is present',()=>assert.equal(typeof adapter.requestForecastPlan,'function'));
test('strict Responses request preserves no-store, forced single function and bounded deadline',async()=>{
 assert.equal(typeof adapter.requestForecastPlan,'function');
 let sent;
 const result=await adapter.requestForecastPlan({apiKey:'test',model:'gpt-5-mini',schema,payload:{signals:[]},instructions:'market',fetchImpl:async(url,options)=>{sent={url,...options,body:JSON.parse(options.body)};return response();}});
 assert.deepEqual(result,good);
 assert.equal(sent.url,'https://api.openai.com/v1/responses');
 assert.equal(sent.body.store,false);assert.equal(sent.body.tools[0].strict,true);
 assert.deepEqual(sent.body.tool_choice,{type:'function',name:'forecast_plan'});
 assert.equal(sent.body.parallel_tool_calls,false);assert.equal(sent.body.max_output_tokens,6000);
 assert.ok(sent.signal instanceof AbortSignal);
});
test('incomplete, malformed, over-limit and out-of-range plans fail closed',async()=>{
 assert.equal(typeof adapter.requestForecastPlan,'function');
 for(const fetchImpl of [async()=>response(good,'incomplete'),async()=>response({forecasts:[{probability:2,evidence_keys:['a','b']}]}),async()=>response({forecasts:Array(5).fill(good.forecasts[0])}),async()=>response({forecasts:[{probability:0.7,evidence_keys:['a']}]}),async()=>response({...good,secret:'not allowed'}),async()=>({ok:false,status:429,json:async()=>({error:{message:'secret provider body'}})})]){
  await assert.rejects(()=>adapter.requestForecastPlan({apiKey:'test',model:'gpt-5-mini',schema,payload:{},fetchImpl}),/AI_/);
 }
});
test('public market projection excludes private sources and arbitrary nested evidence and learning',()=>{
 assert.equal(typeof adapter.publicMarketPayload,'function');
 const publicSignal={signal_key:'external:'+'a'.repeat(64),source_type:'external_news',entity_scope:'market',topic_key:'market',strength:0.8,evidence:{title:'Public title',summary:'Public summary',email:'private@example.org',customer:{name:'private'}}};
 const payload=adapter.publicMarketPayload({date:'2026-10-19',signals:[publicSignal,{...publicSignal,signal_key:'b',source_type:'email'}, {...publicSignal,signal_key:'c',entity_scope:'tenant'}],existing_forecasts:[{predicted_event:'private'}],revenue_learnings:[{claim:'private'}]});
 assert.equal(payload.signals.length,1);assert.equal(payload.signals[0].evidence.title,'Public title');
 assert.doesNotMatch(JSON.stringify(payload),/private|email|customer|existing_forecasts|revenue_learnings/);
});
test('public text also redacts embedded contact details',()=>{
 assert.equal(typeof adapter.publicMarketPayload,'function');
 const payload=adapter.publicMarketPayload({date:'2026-10-19',signals:[{signal_key:'external:'+'a'.repeat(64),source_type:'external_news',entity_scope:'market',topic_key:'Call alice@example.org',evidence:{summary:'Phone +31 6 12345678'}}]});
 assert.doesNotMatch(JSON.stringify(payload),/alice@example\.org|12345678/);
});
test('opaque hashed evidence keys survive contact redaction unchanged',()=>{
 const key='external:809e5c5700222b3a96d6e428ff06b159ca4a1cfc56d9ac366ffad4a426eec548';
 const payload=adapter.publicMarketPayload({date:'2026-10-19',signals:[{signal_key:key,source_type:'external_news',entity_scope:'market',evidence:{}}]});
 assert.equal(payload.signals[0].signal_key,key);
});
test('shared transport binds the exact calibration tool with the smaller budget',async()=>{
 let sent;
 const verdict=await adapter.requestForecastPlan({apiKey:'test',model:'gpt-5-mini',schema:{type:'object',additionalProperties:false,properties:{},required:[]},payload:{},toolName:'calibration',maxOutputTokens:1400,timeoutMs:1000,fetchImpl:async(url,init)=>{sent=JSON.parse(init.body);return {ok:true,json:async()=>({status:'completed',output:[{type:'function_call',name:'calibration',arguments:'{}'}]})};}});
 assert.deepEqual(verdict,{});assert.equal(sent.tools[0].name,'calibration');
 assert.equal(sent.tool_choice.name,'calibration');assert.equal(sent.max_output_tokens,1400);
});
