import {projectVerifiedValue} from '../../brain/operating-loop/verified-value.mjs';
const records=[
 {kind:'outcome',id:'o1',subjectId:'seo:x',owner:'agent',executed:true,verified:true,result:'lead +2',evidenceIds:['e1'],payload:{realisedValue:1200,valueUnit:'EUR'}},
 {kind:'outcome',id:'o2',subjectId:'cost:y',owner:'agent',executed:true,verified:false,result:'estimate',evidenceIds:['e2'],payload:{realisedValue:9999,valueUnit:'EUR'}},
 {kind:'outcome',id:'o3',subjectId:'ops:z',owner:'agent',executed:true,verified:true,result:'time saved',evidenceIds:['e3'],payload:{realisedValue:4,valueUnit:'hours'}}
];
const p=projectVerifiedValue(records);if(p.verifiedOutcomes.length!==2) throw new Error('only verified evidence-backed outcomes count');if(p.totals.EUR!==1200||p.totals.hours!==4) throw new Error('verified value totals incorrect');if(p.verifiedOutcomes.some(x=>!x.evidenceIds.length)) throw new Error('verified value must retain evidence');console.log('verified value projection tests passed');
