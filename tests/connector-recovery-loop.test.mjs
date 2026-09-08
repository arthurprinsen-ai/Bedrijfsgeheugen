import test from 'node:test';
import assert from 'node:assert/strict';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';

const request=(path,body={})=>({method:'POST',url:`https://portal.test${path}`,json:async()=>body});

function memoryStore(){
  const connector={id:'11111111-1111-4111-8111-111111111111',version:1,state:'Draft',source:{type:'email'},target:{type:'datahub'},runtime:{}};
  const executions=[];
  return {
    configured:true,connector,executions,
    resolveTenant:async()=> '22222222-2222-4222-8222-222222222222',
    get:async()=>connector,
    saveExecution:async(_tenant,row)=>{const saved={...row,id:`33333333-3333-4333-8333-${String(executions.length+1).padStart(12,'0')}`,connector_versie:row.connectorVersion,evidence:row.evidence};executions.push(saved);return saved;},
    saveDraft:async(_tenant,draft)=>{Object.assign(connector,draft);return connector;}
  };
}

test('failed target test persists immutable failure evidence and one recovery obligation',async()=>{
  const store=memoryStore();
  const engine={
    runTest:async()=>{throw Object.assign(new Error('target down'),{code:'TARGET_UNAVAILABLE',failedStage:'target',executionId:'test-fail-1'});},
    classifyError:()=>({retryable:false,maxAttempts:0,recoveryRequired:true,class:'runtime'})
  };
  const response=await handlePortalConnectorsRequest({request:request(`/api/connectors/${store.connector.id}/test`,{sample:{messageId:'m1'}}),user:{id:'u1'},store,engine});
  assert.equal(response.status,422);
  assert.equal(store.executions.length,1);
  assert.equal(store.executions[0].status,'TEST_FAILED');
  assert.equal(store.executions[0].evidence.failedStage,'target');
  assert.ok(store.executions[0].evidence.evidenceId);
  assert.equal(store.connector.runtime.recoveryObligation.status,'open');
  assert.equal(store.connector.runtime.recoveryObligation.writeback.status,'queued');
  assert.equal(store.connector.runtime.recoveryObligation.writeback.maxAttempts,1);
  assert.ok(store.connector.runtime.recoveryObligation.fingerprint.includes('target-runtime'));
});

test('later success resolves recovery while preserving the prior failure execution',async()=>{
  const store=memoryStore();
  store.connector.runtime.recoveryObligation={status:'open',fingerprint:'connector:target-runtime',writeback:{status:'queued',maxAttempts:1}};
  store.executions.push({id:'old-failure',status:'TEST_FAILED',evidence:{evidenceId:'failure-1'}});
  const engine={
    runTest:async()=>({status:'TEST_PASSED',dedupeKey:'m1',completedAt:'2026-09-08T08:00:00.000Z',evidence:{testExecutionId:'runtime-pass',sourceReadSuccess:true,extractionResult:{ok:true},validationResult:{ok:true},targetSafeTestResult:{ok:true}}}),
    classifyError:()=>({retryable:false,maxAttempts:0,recoveryRequired:true,class:'runtime'})
  };
  const response=await handlePortalConnectorsRequest({request:request(`/api/connectors/${store.connector.id}/test`,{sample:{messageId:'m1'}}),user:{id:'u1'},store,engine});
  assert.equal(response.status,200);
  assert.equal(store.executions.length,2);
  assert.equal(store.executions[0].status,'TEST_FAILED');
  assert.equal(store.executions[1].status,'TEST_PASSED');
  assert.equal(store.connector.runtime.recoveryObligation.status,'resolved');
  assert.equal(store.connector.runtime.recoveryObligation.resolvedByExecutionId,store.executions[1].id);
});
