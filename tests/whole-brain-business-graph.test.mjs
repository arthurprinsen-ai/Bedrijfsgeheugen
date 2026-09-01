import test from 'node:test';
import assert from 'node:assert/strict';
import {createBusinessGraphProjection,explainGraphObject} from '../brain/operating-loop/business-graph-service.mjs';

const records=[
 {tenantId:'T1',type:'Entity',kind:'entity',id:'C1-v1',subjectId:'customer:C1',observedAt:'2026-08-30T10:00:00Z',owner:'sales',evidenceIds:['E1'],provenance:{source:'notion',sourceId:'p1'},payload:{entityType:'customer',name:'Acme',status:'prospect'}},
 {tenantId:'T1',type:'Entity',kind:'entity',id:'C1-v2',subjectId:'customer:C1',observedAt:'2026-08-31T10:00:00Z',owner:'sales',evidenceIds:['E2'],provenance:{source:'crm',sourceId:'c1'},payload:{entityType:'customer',name:'Acme',status:'active'}},
 {tenantId:'T1',type:'Entity',kind:'entity',id:'P1',subjectId:'product:P1',observedAt:'2026-08-31T09:00:00Z',owner:'product',evidenceIds:['E3'],provenance:{source:'notion',sourceId:'p2'},payload:{entityType:'product',name:'Scan'}},
 {tenantId:'T1',type:'Relation',kind:'relation',id:'R1',subjectId:'relation:R1',observedAt:'2026-08-31T10:05:00Z',owner:'graph',evidenceIds:['E4'],provenance:{source:'brain',sourceId:'R1'},payload:{from:'customer:C1',to:'product:P1',relation:'uses',weight:.9}}
];

test('Business Graph exposes latest entity state while retaining full history',()=>{
 const graph=createBusinessGraphProjection(records,{tenantId:'T1'});
 assert.equal(graph.entities.length,2);
 const acme=graph.entities.find(x=>x.subjectId==='customer:C1');
 assert.equal(acme.payload.status,'active');
 assert.equal(graph.history['customer:C1'].length,2);
 assert.equal(graph.relations.length,1);
});

test('why-query returns provenance, evidence and history for object',()=>{
 const explanation=explainGraphObject(records,{tenantId:'T1',subjectId:'customer:C1'});
 assert.equal(explanation.current.payload.status,'active');
 assert.deepEqual(explanation.evidenceIds,['E1','E2']);
 assert.deepEqual([...explanation.sources].sort(),['crm:c1','notion:p1']);
 assert.equal(explanation.history.length,2);
});

test('Business Graph projects every canonical subject as a node and predecessor lineage as dependency edges',()=>{
 const canonical=[
  {tenantId:'T1',type:'Evidence',kind:'evidence',id:'E10',subjectId:'integration:source',observedAt:'2026-09-01T06:00:00Z',owner:'brain',evidenceIds:['ext:1'],provenance:{source:'runtime'},payload:{health:'green'}},
  {tenantId:'T1',type:'Action',kind:'action',id:'A10',subjectId:'change:release',observedAt:'2026-09-01T06:01:00Z',owner:'delivery',predecessorIds:['E10'],evidenceIds:['ext:2'],provenance:{source:'brain'},payload:{status:'ready'}},
  {tenantId:'T2',type:'Evidence',kind:'evidence',id:'OTHER',subjectId:'other:tenant',observedAt:'2026-09-01T06:02:00Z',owner:'other',evidenceIds:[],provenance:{source:'other'},payload:{}}
 ];
 const graph=createBusinessGraphProjection(canonical,{tenantId:'T1'});
 assert.deepEqual(graph.entities.map(x=>x.subjectId).sort(),['change:release','integration:source']);
 assert.equal(graph.history['integration:source'].length,1);
 const lineage=graph.relations.find(x=>x.payload?.relation==='depends_on_lineage');
 assert.ok(lineage,'predecessor lineage must be projected as a graph relation');
 assert.equal(lineage.payload.from,'integration:source');
 assert.equal(lineage.payload.to,'change:release');
 assert.equal(graph.entities.some(x=>x.subjectId==='other:tenant'),false,'tenant isolation must remain fail closed');
});
