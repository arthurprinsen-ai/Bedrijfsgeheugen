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
