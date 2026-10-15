import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalQuestionHandler} from '../platform/api/portal-question-handler.mjs';

test('portal AI denies unauthenticated requests before reading data',async()=>{
 let read=false;const h=createPortalQuestionHandler({getUser:async()=>null,store:{get:async()=>{read=true}},runAnswer:async()=>({text:'x'}),apiKey:'k'});
 const r=await h(new Request('https://x/api/portaalvraag',{method:'POST',body:JSON.stringify({vraag:'Wat speelt er?'})}));
 assert.equal(r.status,401);assert.equal(read,false);
});

test('portal AI ignores browser supplied context and reads only derived tenant state',async()=>{
 let tenant='';let received='';const h=createPortalQuestionHandler({
  getUser:async()=>({id:'u1',email:'a@x.nl',appMetadata:{tenantId:'acme'}}),
  store:{get:async t=>{tenant=t;return{data:{company:{name:'Server BV'},secret:'server-only'},sourceUpdatedAt:'2026-08-29T20:00:00Z'}}},
  runAnswer:async({projectContext})=>{received=projectContext;return{text:'ok'}},apiKey:'k'
 });
 const r=await h(new Request('https://x/api/portaalvraag?tenant=evil',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({vraag:'Wat is de bedrijfsnaam?',context:{company:{name:'Evil BV'}},tenant:'evil'})}));
 assert.equal(r.status,200);assert.equal(tenant,'acme');assert.match(received,/Server BV/);assert.doesNotMatch(received,/Evil BV/);
});

test('portal AI returns explicit empty-state response when tenant projection is absent',async()=>{
 const h=createPortalQuestionHandler({getUser:async()=>({id:'u1'}),store:{get:async()=>null},runAnswer:async()=>{throw new Error('must not call')},apiKey:'k'});
 const r=await h(new Request('https://x/api/portaalvraag',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({vraag:'Wat speelt er?'})}));
 assert.equal(r.status,404);assert.match((await r.json()).antwoord,/bedrijfsdata/i);
});

test('portal AI validates question and keeps request context bounded',async()=>{
 let len=0;const h=createPortalQuestionHandler({getUser:async()=>({id:'u1'}),store:{get:async()=>({data:{blob:'x'.repeat(100000)},sourceUpdatedAt:'2026-08-29T20:00:00Z'})},runAnswer:async({projectContext})=>{len=projectContext.length;return{text:'ok'}},apiKey:'k',maxContext:5000});
 const short=await h(new Request('https://x/api/portaalvraag',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({vraag:'x'})}));assert.equal(short.status,400);
 const good=await h(new Request('https://x/api/portaalvraag',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({vraag:'Welke risico’s zijn zichtbaar?'})}));assert.equal(good.status,200);assert.ok(len<=5000);
});

test('tenant choosing one AI default never silently invokes legacy Anthropic project QA',async()=>{
 let egress=0;
 const h=createPortalQuestionHandler({
  getUser:async()=>({id:'u1',appMetadata:{tenantId:'tenant-a'}}),
  store:{get:async t=>{assert.equal(t,'tenant-a');return {data:{portal:{aiModelPreferences:{
   requestState:'review_only_not_activated',defaultModelId:'mistral-medium-3-5',
   assignments:{},models:[{modelId:'mistral-medium-3-5',routeId:'mistral-api-eu'}]
  }},company:{name:'Customer data'}}}}},
  runAnswer:async()=>{egress++;return{text:'Unwanted'}},apiKey:'test-key'
 });
 const r=await h(new Request('https://x/api/portaalvraag',{method:'POST',body:JSON.stringify({vraag:'Analyseer mijn winst'}),headers:{'content-type':'application/json'}}));
 assert.equal(r.status,409);
 assert.equal((await r.json()).code,'TENANT_MODEL_ROUTING_REQUIRED');
 assert.equal(egress,0);
});

test('selected tenant model uses attested answer callback and server-owned context only',async()=>{
 let selectedCalls=0,legacyCalls=0,seen=null;
 const h=createPortalQuestionHandler({
  getUser:async()=>({id:'u1',appMetadata:{tenantId:'secure-tenant'}}),
  store:{get:async tenant=>{assert.equal(tenant,'secure-tenant');return {
   data:{company:{name:'Trusted BV'},portal:{aiModelPreferences:{
    requestState:'review_only_not_activated',defaultModelId:'mistral-medium-3-5',
    models:[{modelId:'mistral-medium-3-5',routeId:'mistral-api-eu'}],assignments:{}
   }}},sourceUpdatedAt:'2026-10-15T10:00:00Z'}}},
  runAnswer:async()=>{legacyCalls++;throw Error('LEGACY_ANTHROPIC_MUST_NOT_RUN')},
  runSelectedAnswer:async value=>{selectedCalls++;seen=value;return {
    ok:true,status:200,payload:{status:'ANSWERED',answer:'Trusted BV',modelId:'mistral-medium-3-5',provider:'MISTRAL_API'}
  }},
  apiKey:null
 });
 const request=new Request('https://site.example/api/portaalvraag?tenant=evil',{method:'POST',
  headers:{'content-type':'application/json'},body:JSON.stringify({
   vraag:'Wat is onze bedrijfsnaam?',context:{company:{name:'Evil BV'}},tenantId:'evil'
  })});
 const result=await h(request);
 assert.equal(result.status,200);
 const payload=await result.json();
 assert.equal(payload.antwoord,'Trusted BV');
 assert.equal(payload.modelId,'mistral-medium-3-5');
 assert.equal(seen.tenantId,'secure-tenant');
 assert.match(seen.projectContext,/Trusted BV/);
 assert.doesNotMatch(seen.projectContext,/Evil BV/);
 assert.equal(legacyCalls,0);
 assert.equal(selectedCalls,1);
});

test('selected tenant route fails closed with 409/503 and does not use legacy Anthropic',async()=>{
 let legacy=0;
 for(const outcome of [
  {ok:false,status:409,payload:{error:'MODEL_CHOICE_NOT_ACTIVATED',reason:'EU_PROCESSING_REQUIREMENT_NOT_ENFORCED'}},
  {ok:false,status:503,payload:{error:'AI_RUNTIME_NOT_PROVISIONED'}}
 ]){
  const h=createPortalQuestionHandler({
    getUser:async()=>({id:'owner',appMetadata:{tenantId:'tenant-a'}}),
    store:{get:async()=>({data:{company:{name:'Private BV'},portal:{aiModelPreferences:{
      requestState:'review_only_not_activated',defaultModelId:'gpt-6-sol',models:[{modelId:'gpt-6-sol',routeId:'openai-api-eu'}]
    }}}})},
    runAnswer:async()=>{legacy++;throw Error('NO_FALLBACK')},
    runSelectedAnswer:async()=>outcome,apiKey:'legacy-key'
  });
  const result=await h(new Request('https://site.example/api/portaalvraag',{method:'POST',
   body:JSON.stringify({vraag:'Geef mij advies'}),headers:{'content-type':'application/json'}}));
  assert.equal(result.status,outcome.status);
  assert.equal((await result.json()).code,'TENANT_MODEL_NOT_AVAILABLE');
 }
 assert.equal(legacy,0);
});
