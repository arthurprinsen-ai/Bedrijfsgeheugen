import {normalizeBrainRecord,deriveLoopState,validateDoneOutcome} from '../../brain/operating-loop/model.mjs';

const evidence=normalizeBrainRecord({tenantId:'t1',type:'Evidence',id:'e1',source:'dataforseo',subjectId:'market:seo',observedAt:'2026-08-30T15:45:00Z',payload:{signal:'search demand rising'}});
if(evidence.kind!=='evidence'||evidence.provenance.source!=='dataforseo') throw new Error('evidence must preserve canonical kind and provenance');
if(!evidence.graph.nodes.includes('market:seo')) throw new Error('evidence must attach to the Business Graph');

const decision=normalizeBrainRecord({tenantId:'t1',type:'Decision',id:'d1',subjectId:'market:seo',evidenceIds:['e1'],owner:'BG158',status:'APPROVED',payload:{recommendation:'build landing page'}});
const action=normalizeBrainRecord({tenantId:'t1',type:'Action',id:'a1',subjectId:'market:seo',decisionId:'d1',owner:'BG156',status:'EXECUTED',payload:{result:'candidate deployed'}});
const outcome=normalizeBrainRecord({tenantId:'t1',type:'Outcome',id:'o1',subjectId:'market:seo',actionId:'a1',owner:'BG156',executed:true,verified:true,result:'conversion +12%',evidenceIds:['e1'],payload:{value:1200}});
const learning=normalizeBrainRecord({tenantId:'t1',type:'Learning',id:'l1',subjectId:'market:seo',outcomeId:'o1',owner:'BG168',payload:{pattern:'landing pages work for this demand class'}});

const state=deriveLoopState([evidence,decision,action,outcome,learning]);
for(const stage of ['detect','verify','match','impact','prioritise','recommend','act','measure','learn']) if(state.stages[stage]!==true) throw new Error(`universal loop stage missing: ${stage}`);
if(state.memory.livingMemory.length!==5) throw new Error('all material records must be retained in Living Memory');
if(state.graph.edges.length<4) throw new Error('canonical records must form linked Business Graph edges');
if(state.advice.length<1) throw new Error('loop must expose advice/recommendation state');
if(validateDoneOutcome(outcome)!==true) throw new Error('verified executed outcome with evidence must satisfy Done contract');

let rejected=false;
try{validateDoneOutcome({...outcome,verified:false});}catch{rejected=true;}
if(!rejected) throw new Error('unverified outcome must not satisfy Done');

console.log('universal operating loop tests passed');
