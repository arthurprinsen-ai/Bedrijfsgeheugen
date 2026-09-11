import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBrainRecord} from './model.mjs';
import {buildCompanyLedger} from './company-ledger.mjs';

test('Brain records preserve actor approval and economics metadata',()=>{
  const record=normalizeBrainRecord({
    tenantId:'t1',type:'Approval',id:'ap-1',subjectId:'decision:d1',owner:'arthur',status:'APPROVED',
    observedAt:'2026-09-11T07:00:00Z',actor:'user:arthur',actorType:'human',decisionId:'d1',
    approvedBy:'user:arthur',approvedAt:'2026-09-11T07:00:00Z',approvalState:'APPROVED',
    costAmount:1250,expectedValue:10000,realizedValue:0,currency:'EUR',evidenceIds:['ev-1']
  });
  assert.equal(record.kind,'approval');
  assert.equal(record.actor,'user:arthur');
  assert.equal(record.actorType,'human');
  assert.equal(record.approval.state,'APPROVED');
  assert.equal(record.approval.by,'user:arthur');
  assert.equal(record.economics.cost,1250);
  assert.equal(record.economics.expectedValue,10000);
  assert.equal(record.economics.currency,'EUR');
});

test('company ledger keeps immutable-looking newest-first audit history and economics totals',()=>{
  const records=[
    normalizeBrainRecord({tenantId:'t1',type:'Decision',id:'d1',owner:'brain',status:'PROPOSED',actor:'agent:brain',actorType:'agent',observedAt:'2026-09-11T06:00:00Z',expectedValue:10000,costAmount:1500,currency:'EUR',evidenceIds:['ev-1']}),
    normalizeBrainRecord({tenantId:'t1',type:'Approval',id:'ap1',subjectId:'decision:d1',decisionId:'d1',owner:'arthur',status:'APPROVED',actor:'user:arthur',actorType:'human',observedAt:'2026-09-11T06:30:00Z',approvalState:'APPROVED',approvedBy:'user:arthur',approvedAt:'2026-09-11T06:30:00Z',evidenceIds:['ev-1']}),
    normalizeBrainRecord({tenantId:'t1',type:'Action',id:'a1',subjectId:'decision:d1',decisionId:'d1',owner:'team-finance',status:'DONE',actor:'user:piet',actorType:'human',observedAt:'2026-09-11T07:00:00Z',costAmount:1800,currency:'EUR',evidenceIds:['ev-2']}),
    normalizeBrainRecord({tenantId:'t1',type:'Value',id:'v1',subjectId:'decision:d1',decisionId:'d1',actionId:'a1',owner:'brain',status:'REALISED',actor:'agent:brain',actorType:'agent',observedAt:'2026-09-11T08:00:00Z',realizedValue:12000,currency:'EUR',verified:true,evidenceIds:['ev-3']})
  ];
  const ledger=buildCompanyLedger(records,{tenantId:'t1'});
  assert.deepEqual(ledger.timeline.map(x=>x.id),['v1','a1','ap1','d1']);
  assert.equal(ledger.approvals.length,1);
  assert.equal(ledger.approvals[0].approval.state,'APPROVED');
  assert.equal(ledger.economics.expectedValue,10000);
  assert.equal(ledger.economics.actualCost,1800);
  assert.equal(ledger.economics.realizedValue,12000);
  assert.equal(ledger.economics.realizedProfit,10200);
  assert.equal(ledger.actors['user:arthur'].events,1);
  assert.equal(ledger.actors['user:piet'].events,1);
});

test('ledger is tenant scoped and never mixes economics across tenants',()=>{
  const records=[
    normalizeBrainRecord({tenantId:'t1',type:'Value',id:'v1',owner:'brain',status:'REALISED',realizedValue:100,currency:'EUR',verified:true}),
    normalizeBrainRecord({tenantId:'t2',type:'Value',id:'v2',owner:'brain',status:'REALISED',realizedValue:999999,currency:'EUR',verified:true})
  ];
  const ledger=buildCompanyLedger(records,{tenantId:'t1'});
  assert.deepEqual(ledger.timeline.map(x=>x.id),['v1']);
  assert.equal(ledger.economics.realizedValue,100);
});
