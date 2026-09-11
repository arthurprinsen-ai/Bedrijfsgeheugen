import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanyDecisionHandler} from '../../platform/api/company-decision-handler.mjs';

function request(body, method='POST') {
  return new Request('https://example.test/api/company-decision', {
    method,
    headers: {'content-type':'application/json'},
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
}

function fixture({user={id:'u1',email:'arthur@example.test',app_metadata:{tenantId:'tenant-a'}}, decisionStatus='PROPOSED'}={}) {
  const appended=[];
  const store={
    async getProjection(tenantId){
      assert.equal(tenantId,'tenant-a');
      return {companyDecisions:[{id:'d1',subjectId:'process:invoice',status:decisionStatus,owner:'Finance'}]};
    },
    async append(record,{principal}={}){
      appended.push({record,principal});
      return {duplicate:false,record};
    }
  };
  return {handler:createCompanyDecisionHandler({getUser:async()=>user,store,now:()=> '2026-09-11T08:00:00Z'}),appended};
}

test('rejects unauthenticated commands', async()=>{
  const {handler}=fixture({user:null});
  const res=await handler(request({command:'APPROVE',decisionId:'d1',idempotencyKey:'k1'}));
  assert.equal(res.status,401);
});

test('tenant is derived from identity and browser tenant injection is ignored', async()=>{
  const {handler,appended}=fixture();
  const res=await handler(request({command:'APPROVE',decisionId:'d1',tenantId:'evil',idempotencyKey:'k1'}));
  assert.equal(res.status,201);
  assert.equal(appended[0].record.tenantId,'tenant-a');
  assert.equal(appended[0].record.actor,'user:u1');
  assert.equal(appended[0].record.approvalState,'APPROVED');
  assert.equal(appended[0].record.approvedBy,'user:u1');
});

test('supports reject assign start complete and actual cost as immutable Brain events', async()=>{
  for (const [command, expectedType, expectedStatus] of [
    ['REJECT','Approval','REJECTED'],
    ['ASSIGN','Action','ASSIGNED'],
    ['START','Action','IN_PROGRESS'],
    ['COMPLETE','Action','DONE'],
    ['RECORD_COST','Execution','COST_RECORDED']
  ]) {
    const {handler,appended}=fixture();
    const body={command,decisionId:'d1',idempotencyKey:`k-${command}`,owner:'Operations',actualCost:1750,currency:'EUR'};
    const res=await handler(request(body));
    assert.equal(res.status,201,command);
    assert.equal(appended[0].record.type,expectedType,command);
    assert.equal(appended[0].record.status,expectedStatus,command);
    if(command==='RECORD_COST') assert.equal(appended[0].record.costAmount,1750);
  }
});

test('record outcome writes outcome plus verified value with actor evidence and realized value', async()=>{
  const {handler,appended}=fixture();
  const res=await handler(request({
    command:'RECORD_OUTCOME',decisionId:'d1',idempotencyKey:'out-1',result:'Doorlooptijd -30%',
    realizedValue:12000,currency:'EUR',verified:true,evidenceIds:['measurement:42']
  }));
  assert.equal(res.status,201);
  assert.equal(appended.length,2);
  assert.equal(appended[0].record.type,'Outcome');
  assert.equal(appended[0].record.actor,'user:u1');
  assert.equal(appended[1].record.type,'Value');
  assert.equal(appended[1].record.realizedValue,12000);
  assert.equal(appended[1].record.verified,true);
  assert.deepEqual(appended[1].record.evidenceIds,['measurement:42']);
});

test('fails closed when caller expected a different current decision status', async()=>{
  const {handler,appended}=fixture({decisionStatus:'IN_PROGRESS'});
  const res=await handler(request({command:'APPROVE',decisionId:'d1',expectedStatus:'PROPOSED',idempotencyKey:'stale-1'}));
  assert.equal(res.status,409);
  assert.equal(appended.length,0);
  assert.equal((await res.json()).error,'STALE_DECISION_STATE');
});

test('requires a caller supplied idempotency key for every mutation', async()=>{
  const {handler,appended}=fixture();
  const res=await handler(request({command:'START',decisionId:'d1'}));
  assert.equal(res.status,400);
  assert.equal(appended.length,0);
});
