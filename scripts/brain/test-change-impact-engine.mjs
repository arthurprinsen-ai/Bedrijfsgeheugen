import {analyzeChangeImpact} from '../../brain/operating-loop/change-impact.mjs';
const records=[
 {tenantId:'t1',kind:'relation',id:'r1',subjectId:'rel:r1',evidenceIds:['e1'],payload:{from:'process:sales',to:'system:crm',relation:'depends_on',weight:.9}},
 {tenantId:'t1',kind:'relation',id:'r2',subjectId:'rel:r2',evidenceIds:['e2'],payload:{from:'system:crm',to:'team:sales',relation:'used_by',weight:.8}},
 {tenantId:'t1',kind:'relation',id:'r3',subjectId:'rel:r3',evidenceIds:['e3'],payload:{from:'team:sales',to:'kpi:conversion',relation:'drives',weight:.7}},
 {tenantId:'other',kind:'relation',id:'x',subjectId:'rel:x',evidenceIds:['secret'],payload:{from:'process:sales',to:'tenant:other',relation:'leaks_to',weight:1}}
];
const result=analyzeChangeImpact(records,{tenantId:'t1',subjectId:'process:sales',maxDepth:2});
if(result.impacts.length!==2) throw new Error('maxDepth must bound graph traversal');
if(result.impacts.some(x=>x.subjectId==='tenant:other')) throw new Error('impact traversal must remain tenant scoped');
if(result.impacts[0].subjectId!=='system:crm'||result.impacts[0].impactScore!==.9) throw new Error('direct impact score invalid');
if(Math.abs(result.impacts[1].impactScore-.648)>.000001) throw new Error('multi-hop impact score must decay deterministically');
if(result.impacts[1].evidenceIds.join(',')!=='e1,e2') throw new Error('impact must preserve evidence chain');
if(result.impacts[1].path.join('>')!=='process:sales>system:crm>team:sales') throw new Error('impact path missing');

const lineage=[
 {tenantId:'t1',kind:'evidence',type:'Evidence',id:'ev-1',subjectId:'integration:source',evidenceIds:['source-proof'],observedAt:'2026-09-01T06:00:00Z',payload:{}},
 {tenantId:'t1',kind:'action',type:'Action',id:'act-1',subjectId:'change:release',predecessorIds:['ev-1'],evidenceIds:['action-proof'],observedAt:'2026-09-01T06:01:00Z',payload:{}},
 {tenantId:'t1',kind:'verification',type:'Verification',id:'ver-1',subjectId:'production:release',predecessorIds:['act-1'],evidenceIds:['production-proof'],observedAt:'2026-09-01T06:02:00Z',payload:{}}
];
const lineageResult=analyzeChangeImpact(lineage,{tenantId:'t1',subjectId:'integration:source',maxDepth:3});
if(lineageResult.impacts.map(x=>x.subjectId).join(',')!=='change:release,production:release') throw new Error('predecessor lineage must be traversed as canonical dependencies');
if(lineageResult.impacts[1].path.join('>')!=='integration:source>change:release>production:release') throw new Error('lineage traversal path missing');
if(!lineageResult.impacts[1].evidenceIds.includes('production-proof')) throw new Error('lineage impact must preserve successor evidence');
console.log('change impact engine tests passed');
