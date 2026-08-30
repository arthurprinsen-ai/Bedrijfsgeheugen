import {recommendationToDecision,decisionToAction,outcomeToLearning} from '../../brain/operating-loop/lifecycle.mjs';
const advice={sourceId:'o1',subjectId:'seo:x',owner:'agent-seo',evidenceIds:['e1'],recommendation:'Build X',priorityScore:.8};
const decision=recommendationToDecision(advice,{tenantId:'t1',id:'d1'});if(decision.type!=='Decision'||decision.evidenceIds[0]!=='e1'||decision.payload.recommendation!=='Build X') throw new Error('recommendation must become evidence-backed Decision');
const action=decisionToAction(decision,{id:'a1',owner:'agent-build'});if(action.type!=='Action'||action.decisionId!=='d1'||action.owner!=='agent-build') throw new Error('Decision must become owned Action');
const learning=outcomeToLearning({tenantId:'t1',type:'Outcome',id:'v1',subjectId:'seo:x',actionId:'a1',owner:'agent-build',executed:true,verified:true,result:'conversion +12%',evidenceIds:['e1']},{id:'l1',owner:'BG168'});if(learning.type!=='Learning'||learning.outcomeId!=='v1'||learning.payload.result!=='conversion +12%') throw new Error('verified Outcome must become Learning');
let rejected=false;try{outcomeToLearning({tenantId:'t1',type:'Outcome',id:'bad',verified:false,evidenceIds:['e1']},{id:'l2'});}catch{rejected=true;}if(!rejected) throw new Error('unverified Outcome must not become Learning');
console.log('decision action value lifecycle tests passed');
