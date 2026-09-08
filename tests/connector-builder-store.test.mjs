import test from 'node:test';
import assert from 'node:assert/strict';
import {createConnectorBuilderStore} from '../portal-next/connector-builder-store.js';

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

test('client store loads connector list from authenticated API only',async()=>{
  const calls=[];
  const store=createConnectorBuilderStore({fetchFn:async(url,options)=>{calls.push([url,options]);return json([{id:'c1',name:'Invoice'}]);}});
  await store.load();
  assert.equal(store.getState().connectors[0].id,'c1');
  assert.equal(calls[0][0],'/api/connectors');
  assert.equal(calls[0][0].includes('tenant='),false);
});

test('client store loads server readiness without tenant or provider secrets',async()=>{
  const calls=[];
  const readiness={sources:{email:{configured:true,state:'native-safe-test'}},extractor:{configured:false,state:'sample-only'},targets:{afas:{configured:false,state:'not-configured'}}};
  const store=createConnectorBuilderStore({fetchFn:async url=>{calls.push(url);return json(url.endsWith('/readiness')?readiness:[]);}});
  await store.loadReadiness();
  assert.deepEqual(store.getState().readiness,readiness);
  assert.equal(calls[0],'/api/connectors/readiness');
  assert.equal(calls[0].includes('tenant='),false);
});

test('template starts an editable isolated draft',()=>{
  const store=createConnectorBuilderStore({fetchFn:async()=>json([])});
  const draft=store.startTemplate('purchase-invoice');
  draft.documentSchema.fields.push({key:'custom',label:'Eigen veld'});
  const second=store.startTemplate('purchase-invoice');
  assert.equal(second.documentSchema.fields.some(f=>f.key==='custom'),false);
});

test('source and target stay independent when template is customized',()=>{
  const store=createConnectorBuilderStore({fetchFn:async()=>json([])});
  store.startTemplate('iso-document');
  store.updateDraft(d=>{d.mappings=[{sourceField:'certificate_number',targetField:'certificate_no',transformation:{type:'none'}}];return d;});
  store.setSource({type:'sharepoint',config:{site:'Quality'}});
  store.setTarget({type:'supabase',config:{table:'certificates'}});
  const draft=store.getState().draft;
  assert.equal(draft.source.type,'sharepoint');
  assert.equal(draft.target.type,'supabase');
  assert.equal(draft.mappings[0].sourceField,'certificate_number');
});

test('save draft posts model and updates state',async()=>{
  const store=createConnectorBuilderStore({fetchFn:async(_url,options)=>json({...JSON.parse(options.body),id:'c1'},201)});
  store.startTemplate('blank');
  store.updateDraft(d=>{d.name='ISO register';return d;});
  const saved=await store.saveDraft();
  assert.equal(saved.id,'c1');assert.equal(store.getState().draft.id,'c1');
});

test('test result is stored as evidence and does not mark active automatically',async()=>{
  const store=createConnectorBuilderStore({fetchFn:async url=>json(url.endsWith('/test')?{status:'TEST_PASSED',evidence:{testExecutionId:'exec-1'}}:[])});
  store.startTemplate('blank');store.getState().draft.id='c1';
  await store.runTest({extractedFields:{name:'x'}});
  assert.equal(store.getState().testResult.status,'TEST_PASSED');
  assert.notEqual(store.getState().draft.state,'Active');
});

test('activation sends only persisted execution identity and trusts server state response',async()=>{
  const calls=[];
  const store=createConnectorBuilderStore({fetchFn:async(url,options)=>{
    calls.push([url,options]);
    if(url.endsWith('/activate'))return json({id:'c1',version:1,name:'Blank',templateId:'blank',state:'Active',source:{type:'upload'},documentSchema:{fields:[]},lookups:[],mappings:[],target:{type:'datahub'},runtime:{activationEvidence:{testExecutionId:'exec-1'}}});
    return json([]);
  }});
  store.startTemplate('blank');store.getState().draft.id='c1';store.getState().testResult={status:'TEST_PASSED',evidence:{testExecutionId:'exec-1',fabricated:'must-not-send'}};
  const active=await store.activate();
  const [,options]=calls.at(-1);
  assert.deepEqual(JSON.parse(options.body),{testExecutionId:'exec-1'});
  assert.equal(active.state,'Active');
  assert.equal(store.getState().draft.state,'Active');
});

test('client cannot locally force Active without server response',async()=>{
  const store=createConnectorBuilderStore({fetchFn:async()=>json({error:'TEST_EVIDENCE_REQUIRED'},409)});
  store.startTemplate('blank');store.getState().draft.id='c1';store.getState().testResult={status:'TEST_PASSED',evidence:{testExecutionId:'fake'}};
  await assert.rejects(()=>store.activate(),error=>error.data?.error==='TEST_EVIDENCE_REQUIRED');
  assert.notEqual(store.getState().draft.state,'Active');
});

test('pause uses server lifecycle route and preserves returned recovery state',async()=>{
  const calls=[];
  const store=createConnectorBuilderStore({fetchFn:async(url,options)=>{calls.push([url,options]);return json({id:'c1',version:1,name:'Blank',templateId:'blank',state:'Paused',source:{type:'upload'},documentSchema:{fields:[]},lookups:[],mappings:[],target:{type:'datahub'},runtime:{recoveryObligation:{status:'open',reason:'AUTH_FAILURE'}}});}});
  store.startTemplate('blank');store.getState().draft.id='c1';store.getState().draft.state='Active';
  const paused=await store.pause('AUTH_FAILURE');
  assert.equal(calls[0][0],'/api/connectors/c1/pause');
  assert.equal(paused.state,'Paused');
  assert.equal(paused.runtime.recoveryObligation.status,'open');
});

test('existing connector can be opened and its executions loaded without tenant query parameters',async()=>{
  const calls=[];
  const connector={id:'c1',version:1,name:'Invoice',templateId:'purchase-invoice',state:'Draft',source:{type:'upload'},documentSchema:{fields:[]},lookups:[],mappings:[],target:{type:'datahub'}};
  const store=createConnectorBuilderStore({fetchFn:async url=>{calls.push(url);if(url.endsWith('/executions'))return json([{id:'e1',status:'TEST_PASSED'}]);if(url==='/api/connectors/c1')return json(connector);return json([]);}});
  await store.openConnector('c1');
  await store.loadExecutions();
  assert.equal(store.getState().draft.id,'c1');
  assert.equal(store.getState().executions[0].id,'e1');
  assert.equal(calls.some(url=>url.includes('tenant=')),false);
});

test('review decisions use authenticated API and keep replay evidence returned by server',async()=>{
  const store=createConnectorBuilderStore({fetchFn:async(url,options)=>json({id:'r1',status:'approved',decision:JSON.parse(options.body),replayObligation:{required:true,maxAttempts:1},url})});
  const result=await store.decideReview('r1',{decision:'approve',corrections:{supplier_id:'S-1'}});
  assert.equal(result.status,'approved');
  assert.equal(result.replayObligation.maxAttempts,1);
});
