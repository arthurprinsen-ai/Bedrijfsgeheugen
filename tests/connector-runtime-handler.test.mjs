import test from 'node:test';
import assert from 'node:assert/strict';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';

const connector={id:'11111111-1111-4111-8111-111111111111',version:1,name:'Invoice',state:'Draft'};
const store={configured:true,async get(t,id){return t==='tenant-a'&&id===connector.id?{...connector}:null;},async saveDraft(_t,d){Object.assign(connector,d);return {...connector};},async saveExecution(_t,e){return {...e,id:'exec-row'};},async listExecutions(){return[{id:'e1'}];},async listReviewQueue(){return[{id:'r1'}];},async saveReview(_t,r){return r;},async list(){return[];}};
const request=(method,path,body)=>({method,path,body});
const user={id:'u1',tenantId:'tenant-a'};

test('test endpoint persists safe-test evidence',async()=>{
  const engine={runTest:async()=>({status:'TEST_PASSED',evidence:{configVersion:1,testExecutionId:'test-1',sourceReadSuccess:true,extractionResult:{ok:true},validationResult:{ok:true},targetSafeTestResult:{ok:true}}})};
  const res=await handlePortalConnectorsRequest({request:request('POST',`/api/connectors/${connector.id}/test`,{sample:{x:1}}),user,store,engine});
  assert.equal(res.status,200);assert.equal((await res.json()).status,'TEST_PASSED');
});

test('activation fails closed without passing evidence',async()=>{
  const engine={activationEligibility:()=>({eligible:false,reason:'TEST_EVIDENCE_REQUIRED'})};
  const res=await handlePortalConnectorsRequest({request:request('POST',`/api/connectors/${connector.id}/activate`,{}),user,store,engine});
  assert.equal(res.status,409);assert.equal((await res.json()).error,'TEST_EVIDENCE_REQUIRED');
});

test('activation changes state only when evidence evaluator passes',async()=>{
  const engine={activationEligibility:()=>({eligible:true,reason:'ELIGIBLE'})};
  const res=await handlePortalConnectorsRequest({request:request('POST',`/api/connectors/${connector.id}/activate`,{evidence:{ok:true}}),user,store,engine});
  assert.equal(res.status,200);assert.equal((await res.json()).state,'Active');
});

test('execution and review queue reads remain tenant scoped',async()=>{
  const executions=await handlePortalConnectorsRequest({request:request('GET',`/api/connectors/${connector.id}/executions`),user,store});
  assert.equal(executions.status,200);assert.equal((await executions.json())[0].id,'e1');
  const reviews=await handlePortalConnectorsRequest({request:request('GET','/api/connectors/review-queue'),user,store});
  assert.equal(reviews.status,200);assert.equal((await reviews.json())[0].id,'r1');
});
