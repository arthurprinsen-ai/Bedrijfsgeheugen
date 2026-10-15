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
