import {projectLivingMemory} from '../../brain/operating-loop/living-memory.mjs';
const records=[
 {tenantId:'t1',kind:'evidence',id:'e1',subjectId:'seo:x',observedAt:'2026-08-30T16:55:00.000Z',evidenceIds:[],provenance:{source:'dataforseo',sourceId:'task:1'},payload:{}},
 {tenantId:'t1',kind:'outcome',id:'o1',subjectId:'seo:x',observedAt:'2026-08-29T12:00:00.000Z',evidenceIds:['e1'],provenance:{source:'make',sourceId:'run:1'},payload:{}},
 {tenantId:'t1',kind:'learning',id:'l1',subjectId:'seo:x',observedAt:'invalid',evidenceIds:['e1'],provenance:{source:'brain',sourceId:'l1'},payload:{}}
];
const p=projectLivingMemory(records,{now:'2026-08-30T17:00:00.000Z',defaultMaxAgeMs:3600000,maxAgeBySource:{dataforseo:900000}});
if(p.records.find(x=>x.id==='e1').freshness.status!=='fresh') throw new Error('recent source evidence must be fresh');
if(p.records.find(x=>x.id==='o1').freshness.status!=='stale') throw new Error('old outcome must be stale');
if(p.records.find(x=>x.id==='l1').freshness.status!=='unknown') throw new Error('invalid timestamp must be unknown');
if(p.records.some(x=>!x.provenance.source||!x.provenance.sourceId)) throw new Error('Living Memory must retain provenance');
if(p.summary.fresh!==1||p.summary.stale!==1||p.summary.unknown!==1) throw new Error('freshness summary invalid');
console.log('living memory provenance tests passed');
