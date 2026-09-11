import test from 'node:test';
import assert from 'node:assert/strict';
import {mapRuntimeProjection} from '../runtime-evidence.js';
import {selectTopPriorities,selectApprovalNeeded,selectBlocked,selectValueLeakage} from '../company-decisions.js';
import {buildCompanyCockpit} from '../company-cockpit.js';

const projection={
  records:[], wholeBrainLoops:[], loopSummary:{}, integrationHealth:{}, livingMemory:{}, verifiedValue:{}, executiveCockpit:{}, businessGraph:{}, aiGovernance:{},
  companyDecisions:[
    {id:'d1',title:'Automatiseer facturen',portfolioBucket:'NOW',rank:1,score:4.2,reasons:['high_value'],blockedBy:null,dependencyState:'READY',confidence:.84,nextAction:'Goedkeuren',owner:'Finance',expectedValue:30000,investment:5000,realizedValue:4000,currency:'EUR',evidenceIds:['e1'],observedAt:'2026-09-11T07:00:00Z'},
    {id:'d2',title:'Datakwaliteit',portfolioBucket:'NEXT',rank:2,score:2.1,reasons:['dependency'],blockedBy:'d1',dependencyState:'WAITING_FOR_DEPENDENCIES',confidence:.75,nextAction:'Onderzoeken',owner:'Data',expectedValue:10000,investment:1000,realizedValue:0,currency:'EUR',evidenceIds:['e2'],observedAt:'2026-09-11T07:05:00Z'}
  ],
  priorityPortfolio:{NOW:[{id:'d1'}],NEXT:[{id:'d2'}],LATER:[],DO_NOT_DO:[]},
  approvalQueue:[{id:'ap1',decisionId:'d1',status:'PENDING',approval:{state:'PENDING',by:null,at:null},actor:'user:arthur',occurredAt:'2026-09-11T07:10:00Z',evidenceIds:['e1']}],
  decisionEconomics:{expectedValue:40000,actualCost:1000,realizedValue:4000,realizedProfit:3000,currency:'EUR'},
  auditTimeline:[{id:'a1',type:'Action',actor:'user:piet',actorType:'human',owner:'Finance',status:'IN_PROGRESS',occurredAt:'2026-09-11T07:30:00Z',economics:{cost:1000,currency:'EUR'}}],
  actors:{'user:piet':{actor:'user:piet',actorType:'human',events:1,lastSeenAt:'2026-09-11T07:30:00Z'}}
};

test('runtime mapper exposes company decision truth without recalculating it',()=>{
  const runtime=mapRuntimeProjection(projection);
  assert.equal(runtime.decisions.items[0].id,'d1');
  assert.equal(runtime.approvals.items[0].decisionId,'d1');
  assert.equal(runtime.economics.expectedValue,40000);
  assert.equal(runtime.economics.realizedProfit,3000);
  assert.equal(runtime.timeline.items[0].actor,'user:piet');
  assert.deepEqual(runtime.portfolio.NOW.map(x=>x.id),['d1']);
});

test('selectors expose priority approval blocker and value leakage clearly',()=>{
  const runtime=mapRuntimeProjection(projection);
  assert.deepEqual(selectTopPriorities(runtime).map(x=>x.id),['d1','d2']);
  assert.deepEqual(selectApprovalNeeded(runtime).map(x=>x.decisionId),['d1']);
  assert.deepEqual(selectBlocked(runtime).map(x=>x.id),['d2']);
  assert.equal(selectValueLeakage(runtime),36000);
});

test('cockpit has six simple executive sections from the same runtime truth',()=>{
  const cockpit=buildCompanyCockpit(mapRuntimeProjection(projection));
  assert.deepEqual(cockpit.sections.map(x=>x.key),['company-now','priorities','approvals','economics','blocked','audit']);
  assert.equal(cockpit.sections.find(x=>x.key==='economics').data.realizedProfit,3000);
  assert.equal(cockpit.sections.find(x=>x.key==='audit').items[0].actor,'user:piet');
});

test('empty backend decision data stays empty and does not create demo numbers',()=>{
  const runtime=mapRuntimeProjection({...projection,companyDecisions:[],priorityPortfolio:{NOW:[],NEXT:[],LATER:[],DO_NOT_DO:[]},approvalQueue:[],decisionEconomics:{expectedValue:0,actualCost:0,realizedValue:0,realizedProfit:0,currency:'EUR'},auditTimeline:[],actors:{}});
  assert.deepEqual(runtime.decisions.items,[]);
  assert.deepEqual(selectTopPriorities(runtime),[]);
  assert.equal(selectValueLeakage(runtime),0);
});
