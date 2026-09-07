import test from 'node:test';
import assert from 'node:assert/strict';
import {createConnectorBuilderStore} from '../portal-next/connector-builder-store.js';

test('client store loads connector list from authenticated API only',async()=>{
  const calls=[];
  const store=createConnectorBuilderStore({fetchFn:async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify([{id:'c1',name:'Invoice'}]),{status:200,headers:{'content-type':'application/json'}});}});
  await store.load();
  assert.equal(store.getState().connectors[0].id,'c1');
  assert.equal(calls[0][0],'/api/connectors');
  assert.equal(calls[0][0].includes('tenant='),false);
});

test('template starts an editable isolated draft',()=>{
  const store=createConnectorBuilderStore({fetchFn:async()=>new Response('[]')});
  const draft=store.startTemplate('purchase-invoice');
  draft.documentSchema.fields.push({key:'custom',label:'Eigen veld'});
  const second=store.startTemplate('purchase-invoice');
  assert.equal(second.documentSchema.fields.some(f=>f.key==='custom'),false);
});

test('save draft posts sanitized model and updates state',async()=>{
  const store=createConnectorBuilderStore({fetchFn:async(_url,options)=>new Response(JSON.stringify({...JSON.parse(options.body),id:'c1'}),{status:201,headers:{'content-type':'application/json'}})});
  store.startTemplate('blank');
  store.updateDraft(d=>{d.name='ISO register';return d;});
  const saved=await store.saveDraft();
  assert.equal(saved.id,'c1');assert.equal(store.getState().draft.id,'c1');
});

test('test result is stored as evidence and does not mark active automatically',async()=>{
  const store=createConnectorBuilderStore({fetchFn:async(url)=>new Response(JSON.stringify(url.endsWith('/test')?{status:'TEST_PASSED',evidence:{testExecutionId:'x'}}:[]),{status:200,headers:{'content-type':'application/json'}})});
  store.startTemplate('blank');store.getState().draft.id='c1';
  await store.runTest({sample:'x'});
  assert.equal(store.getState().testResult.status,'TEST_PASSED');
  assert.notEqual(store.getState().draft.state,'Active');
});
