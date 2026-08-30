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
console.log('change impact engine tests passed');
