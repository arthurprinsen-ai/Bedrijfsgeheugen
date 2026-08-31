import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExecutiveCockpit} from '../brain/operating-loop/executive-cockpit.mjs';

const projection={tenantId:'T1',businessGraph:{entities:[{subjectId:'kpi:margin',payload:{entityType:'kpi',name:'Margin',health:.8}},{subjectId:'risk:r1',payload:{entityType:'risk',name:'Capacity risk',severity:.7}}],relations:[]},prioritizedAdvice:[{sourceId:'S1',subjectId:'market:1',owner:'sales',recommendation:'Call top accounts',priorityScore:.8,evidenceIds:['E1']}],verifiedValue:{totals:{EUR:1000}},livingMemory:{memories:[{id:'M1',observedAt:'2026-08-31T07:00:00Z',payload:{summary:'Learned A'}}],summary:{fresh:1,stale:0,unknown:0}},integrationHealth:{components:[{platform:'make',component:'BG17',health:'degraded',freshness:'2026-08-31T07:00:00Z',cost:12,revision:'r1'}],summary:{total:1,healthy:0,degraded:1,blocked:0,unknown:0,totalCost:12}},wholeBrainLoops:[{correlationId:'C1',complete:false,missing:['verification']}],loopSummary:{complete:0,incomplete:1,total:1},records:[{type:'Action',id:'A1',subjectId:'roadmap:1',owner:'agent',status:'PLANNED',observedAt:'2026-08-31T06:00:00Z',payload:{recommendation:'Implement fix'}},{type:'Opportunity',id:'O1',subjectId:'market:1',owner:'sales',observedAt:'2026-08-31T05:00:00Z',payload:{summary:'Growth',impact:.8}},{type:'Signal',id:'T1',subjectId:'risk:1',owner:'ops',observedAt:'2026-08-31T05:30:00Z',payload:{classification:'threat',summary:'Supplier issue',impact:.7}}]};

test('executive cockpit is generated only from canonical projection',()=>{
 const c=buildExecutiveCockpit(projection,{now:'2026-08-31T08:00:00Z'});
 assert.equal(c.tenantId,'T1');
 assert.equal(c.managementSummary.verifiedValue.EUR,1000);
 assert.equal(c.businessHealth.status,'ATTENTION');
 assert.equal(c.opportunities.length,1);
 assert.equal(c.threats.length,1);
 assert.equal(c.recommendedActions[0].owner,'sales');
 assert.equal(c.roadmap.length,1);
 assert.equal(c.integrations.summary.total,1);
 assert.equal(c.openLoops,1);
});
