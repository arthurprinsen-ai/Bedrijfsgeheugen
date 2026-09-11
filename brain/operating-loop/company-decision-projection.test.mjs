import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBrainRecord} from './model.mjs';
import {buildCompanyDecisionProjection} from './company-decision-projection.mjs';

test('projects one canonical priority portfolio with approvals economics and audit timeline',()=>{
  const records=[
    normalizeBrainRecord({tenantId:'t1',type:'Decision',id:'d-now',subjectId:'process:invoice',owner:'brain',actor:'agent:brain',status:'PROPOSED',observedAt:'2026-09-11T06:00:00Z',expectedValue:30000,costAmount:5000,currency:'EUR',evidenceIds:['e1'],payload:{title:'Automatiseer facturen',portfolioBucket:'NOW',rank:1,score:4.2,reasons:['high_value'],nextAction:'Goedkeuren',confidence:.84}}),
    normalizeBrainRecord({tenantId:'t1',type:'Decision',id:'d-next',subjectId:'data:quality',owner:'brain',actor:'agent:brain',status:'PROPOSED',observedAt:'2026-09-11T06:30:00Z',expectedValue:10000,costAmount:1000,currency:'EUR',evidenceIds:['e2'],payload:{title:'Datakwaliteit verbeteren',portfolioBucket:'NEXT',rank:2,score:2.1,reasons:['dependency'],nextAction:'Onderzoeken',confidence:.75}}),
    normalizeBrainRecord({tenantId:'t1',type:'Approval',id:'ap1',subjectId:'process:invoice',decisionId:'d-now',owner:'arthur',actor:'user:arthur',actorType:'human',status:'PENDING',approvalState:'PENDING',observedAt:'2026-09-11T07:00:00Z',evidenceIds:['e1']}),
    normalizeBrainRecord({tenantId:'t1',type:'Action',id:'a1',subjectId:'process:invoice',decisionId:'d-now',owner:'finance',actor:'user:piet',status:'IN_PROGRESS',costAmount:1000,currency:'EUR',observedAt:'2026-09-11T07:30:00Z',evidenceIds:['e3']}),
    normalizeBrainRecord({tenantId:'t1',type:'Value',id:'v1',subjectId:'process:invoice',decisionId:'d-now',actionId:'a1',owner:'brain',actor:'agent:brain',status:'REALISED',realizedValue:4000,currency:'EUR',verified:true,observedAt:'2026-09-11T08:00:00Z',evidenceIds:['e4']})
  ];
  const projection=buildCompanyDecisionProjection(records,{tenantId:'t1'});
  assert.deepEqual(projection.priorityPortfolio.NOW.map(x=>x.id),['d-now']);
  assert.deepEqual(projection.priorityPortfolio.NEXT.map(x=>x.id),['d-next']);
  assert.equal(projection.approvalQueue[0].decisionId,'d-now');
  assert.equal(projection.decisionEconomics.expectedValue,40000);
  assert.equal(projection.decisionEconomics.actualCost,1000);
  assert.equal(projection.decisionEconomics.realizedValue,4000);
  assert.equal(projection.decisionEconomics.realizedProfit,3000);
  assert.equal(projection.auditTimeline[0].id,'v1');
  assert.equal(projection.companyDecisions[0].rank,1);
  assert.equal(projection.companyDecisions[0].confidence,.84);
});

test('projection never invents buckets or values when there are no company decisions',()=>{
  const projection=buildCompanyDecisionProjection([], {tenantId:'t1'});
  assert.deepEqual(projection.companyDecisions,[]);
  assert.deepEqual(projection.priorityPortfolio,{NOW:[],NEXT:[],LATER:[],DO_NOT_DO:[]});
  assert.equal(projection.decisionEconomics.realizedValue,0);
});
