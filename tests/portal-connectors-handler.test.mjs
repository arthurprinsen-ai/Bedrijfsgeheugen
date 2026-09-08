import test from 'node:test';
import assert from 'node:assert/strict';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';

const makeStore=()=>{
  const records=new Map();
  return {
    calls:[],
    async list(tenant){this.calls.push(['list',tenant]);return [...records.values()].filter(r=>r.tenantId===tenant);},
    async get(tenant,id){this.calls.push(['get',tenant,id]);return records.get(`${tenant}:${id}`)||null;},
    async saveDraft(tenant,draft){this.calls.push(['saveDraft',tenant]);const record={...draft,id:draft.id||'connector-1',tenantId:tenant};records.set(`${tenant}:${record.id}`,record);return record;},
    async saveExecution(){throw new Error('not used');},async listExecutions(){return[];},async saveReview(){return null;},async listReviewQueue(){return[];}
  };
};

const req=(method,path,body)=>({method,path,body});

test('unauthenticated connector request is denied',async()=>{
  const res=await handlePortalConnectorsRequest({request:req('GET','/api/connectors'),user:null,store:makeStore()});
  assert.equal(res.status,401);
});

test('tenant comes only from authenticated user and browser tenant is ignored',async()=>{
  const store=makeStore();
  await handlePortalConnectorsRequest({request:req('GET','/api/connectors?tenant=evil'),user:{id:'u1',tenantId:'tenant-a'},store});
  assert.deepEqual(store.calls[0],['list','tenant-a']);
});

test('draft create persists only in derived tenant and strips secret-looking client keys',async()=>{
  const store=makeStore();
  const res=await handlePortalConnectorsRequest({request:req('POST','/api/connectors',{name:'Invoice intake',source:{type:'email',config:{mailbox:'finance@example.nl',password:'bad'}},target:{type:'afas',config:{authorization:'bad'}}}),user:{id:'u1',tenantId:'tenant-a'},store});
  assert.equal(res.status,201);
  const payload=await res.json();
  assert.equal(payload.source.config.password,undefined);
  assert.equal(payload.target.config.authorization,undefined);
  assert.deepEqual(store.calls[0],['saveDraft','tenant-a']);
});

test('different tenant cannot read connector by id',async()=>{
  const store=makeStore();
  await store.saveDraft('tenant-a',{id:'c1',name:'Private'});
  const res=await handlePortalConnectorsRequest({request:req('GET','/api/connectors/c1'),user:{id:'u2',tenantId:'tenant-b'},store});
  assert.equal(res.status,404);
});

test('missing configured persistent store fails explicitly instead of using fake browser persistence',async()=>{
  const store={configured:false};
  const res=await handlePortalConnectorsRequest({request:req('GET','/api/connectors'),user:{id:'u1',tenantId:'tenant-a'},store});
  assert.equal(res.status,503);
  assert.deepEqual(await res.json(),{error:'CONNECTOR_STORE_NOT_CONFIGURED'});
});

test('readiness endpoint exposes only server capability state and no provider secrets',async()=>{
  const store=makeStore();
  const engine={readiness:{sources:{email:{configured:true,state:'native-safe-test'}},extractor:{configured:false,state:'sample-only'},targets:{afas:{configured:false,state:'not-configured'},datahub:{configured:true,state:'native-safe-test'}}}};
  const res=await handlePortalConnectorsRequest({request:req('GET','/api/connectors/readiness'),user:{id:'u1',tenantId:'tenant-a'},store,engine});
  assert.equal(res.status,200);
  assert.deepEqual(await res.json(),engine.readiness);
  assert.equal(store.calls.length,0);
});
