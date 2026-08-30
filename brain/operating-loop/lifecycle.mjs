import {validateDoneOutcome} from './model.mjs';

export function recommendationToDecision(advice,{tenantId,id,status='PROPOSED'}={}){
  if(!tenantId||!id) throw new TypeError('Decision requires tenantId and id');
  if(!advice?.recommendation||!advice?.owner||advice.owner==='UNASSIGNED'||!Array.isArray(advice.evidenceIds)||advice.evidenceIds.length===0) throw new Error('Decision requires evidence-backed owned recommendation');
  return {tenantId:String(tenantId),type:'Decision',id:String(id),subjectId:advice.subjectId||`decision:${id}`,owner:advice.owner,status,evidenceIds:[...advice.evidenceIds],sourceId:advice.sourceId,payload:{recommendation:advice.recommendation,priorityScore:Number(advice.priorityScore)||0}};
}

export function decisionToAction(decision,{id,owner,status='PLANNED'}={}){
  if(decision?.type!=='Decision'||!decision.id||!decision.tenantId) throw new TypeError('Action requires Decision');
  if(!id||!owner||owner==='UNASSIGNED') throw new Error('Action requires id and owner');
  return {tenantId:decision.tenantId,type:'Action',id:String(id),subjectId:decision.subjectId,decisionId:decision.id,owner:String(owner),status,evidenceIds:Array.isArray(decision.evidenceIds)?[...decision.evidenceIds]:[],payload:{recommendation:decision.payload?.recommendation||null,priorityScore:decision.payload?.priorityScore||0}};
}

export function outcomeToLearning(outcome,{id,owner='BG168'}={}){
  const normalized={...outcome,kind:'outcome'};
  validateDoneOutcome(normalized);
  if(!id) throw new TypeError('Learning requires id');
  return {tenantId:outcome.tenantId,type:'Learning',id:String(id),subjectId:outcome.subjectId,outcomeId:outcome.id,owner:String(owner),status:'LEARNED',evidenceIds:[...outcome.evidenceIds],payload:{result:outcome.result,actionId:outcome.actionId||null}};
}
