import {prioritizeIntelligence} from '../../brain/operating-loop/intelligence.mjs';
const records=[
 {schemaVersion:'brain-record.v1',tenantId:'t1',kind:'opportunity',id:'o1',subjectId:'seo:x',owner:'agent-seo',evidenceIds:['e1'],payload:{recommendation:'Build page X',impact:0.9,confidence:0.8,urgency:0.7}},
 {schemaVersion:'brain-record.v1',tenantId:'t1',kind:'opportunity',id:'o2',subjectId:'cost:make',owner:'agent-cost',evidenceIds:['e2'],payload:{recommendation:'Reduce polling',impact:0.8,confidence:0.95,urgency:0.95}},
 {schemaVersion:'brain-record.v1',tenantId:'t1',kind:'signal',id:'s1',subjectId:'market:y',owner:'UNASSIGNED',evidenceIds:[],payload:{recommendation:'Guess without evidence',impact:1,confidence:1,urgency:1}}
];
const out=prioritizeIntelligence(records,{limit:10});
if(out.length!==2) throw new Error('recommendations without evidence must be excluded');
if(out[0].sourceId!=='o2') throw new Error('highest impact-confidence-urgency candidate must rank first');
if(out.some(x=>!x.owner||x.owner==='UNASSIGNED'||!x.evidenceIds.length)) throw new Error('advice must have owner and evidence');
if(out[0].priorityScore<=out[1].priorityScore) throw new Error('priority score ordering invalid');
console.log('intelligence prioritizer tests passed');
