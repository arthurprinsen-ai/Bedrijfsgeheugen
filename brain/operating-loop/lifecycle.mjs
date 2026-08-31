import {validateDoneOutcome} from './model.mjs';

const evidenceOf=record=>Array.isArray(record?.evidenceIds)?[...record.evidenceIds]:[];
const lineage=(record,id)=>({correlationId:record?.correlationId||null,predecessorIds:record?.id?[String(record.id)]:[],evidenceIds:evidenceOf(record),subjectId:record?.subjectId,tenantId:record?.tenantId,id:String(id)});

export function intelligenceToImpact(intelligence,{id,owner,impactScore=0,status='ASSESSED',payload={}}={}){
  if(!['Signal','Opportunity'].includes(intelligence?.type)||!intelligence?.id||!intelligence?.tenantId) throw new TypeError('Impact requires Signal or Opportunity');
  if(!id) throw new TypeError('Impact requires id');
  return {...lineage(intelligence,id),type:'Impact',owner:String(owner||intelligence.owner||'UNASSIGNED'),status,payload:{...payload,impactScore:Number(impactScore)||0}};
}

export function recommendationToDecision(advice,{tenantId,id,status='PROPOSED'}={}){
  if(!tenantId||!id) throw new TypeError('Decision requires tenantId and id');
  if(!advice?.recommendation||!advice?.owner||advice.owner==='UNASSIGNED'||!Array.isArray(advice.evidenceIds)||advice.evidenceIds.length===0) throw new Error('Decision requires evidence-backed owned recommendation');
  return {tenantId:String(tenantId),type:'Decision',id:String(id),subjectId:advice.subjectId||`decision:${id}`,correlationId:advice.correlationId||null,predecessorIds:Array.isArray(advice.predecessorIds)?[...advice.predecessorIds]:advice.sourceId?[String(advice.sourceId)]:[],owner:advice.owner,status,evidenceIds:[...advice.evidenceIds],sourceId:advice.sourceId,payload:{recommendation:advice.recommendation,priorityScore:Number(advice.priorityScore)||0}};
}

export function decisionToAction(decision,{id,owner,status='PLANNED'}={}){
  if(decision?.type!=='Decision'||!decision.id||!decision.tenantId) throw new TypeError('Action requires Decision');
  if(!id||!owner||owner==='UNASSIGNED') throw new Error('Action requires id and owner');
  return {...lineage(decision,id),type:'Action',decisionId:decision.id,owner:String(owner),status,payload:{recommendation:decision.payload?.recommendation||null,priorityScore:decision.payload?.priorityScore||0}};
}

export function actionToExecution(action,{id,owner,status='EXECUTED',result=null,payload={}}={}){
  if(action?.type!=='Action'||!action.id||!action.tenantId) throw new TypeError('Execution requires Action');
  if(!id) throw new TypeError('Execution requires id');
  return {...lineage(action,id),type:'Execution',actionId:action.id,owner:String(owner||action.owner||'UNASSIGNED'),status,executed:true,result,payload:{...payload}};
}

export function executionToVerification(execution,{id,owner,status,verified=false,result=null,payload={}}={}){
  if(execution?.type!=='Execution'||!execution.id||!execution.tenantId||execution.executed!==true) throw new TypeError('Verification requires executed Execution');
  if(!id) throw new TypeError('Verification requires id');
  return {...lineage(execution,id),type:'Verification',executionId:execution.id,actionId:execution.actionId,owner:String(owner||execution.owner||'UNASSIGNED'),status:status|| (verified?'VERIFIED':'FAILED'),executed:true,verified:verified===true,result,payload:{...payload}};
}

export function verificationToOutcome(verification,{id,owner,status='OBSERVED',result=null,payload={}}={}){
  if(verification?.type!=='Verification'||!verification.id||!verification.tenantId||verification.verified!==true) throw new Error('Outcome requires verified Verification');
  if(!id) throw new TypeError('Outcome requires id');
  if(result===null||result===undefined||result==='') throw new Error('Outcome requires result');
  return {...lineage(verification,id),type:'Outcome',verificationId:verification.id,executionId:verification.executionId,actionId:verification.actionId,owner:String(owner||verification.owner||'UNASSIGNED'),status,executed:true,verified:true,result,payload:{...payload}};
}

export function outcomeToValue(outcome,{id,owner,status='REALISED',realisedValue=0,valueUnit='count',result=null,payload={}}={}){
  if(outcome?.type!=='Outcome'||!outcome.id||!outcome.tenantId||outcome.executed!==true||outcome.verified!==true) throw new Error('Value requires verified Outcome');
  if(!id) throw new TypeError('Value requires id');
  return {...lineage(outcome,id),type:'Value',outcomeId:outcome.id,verificationId:outcome.verificationId,executionId:outcome.executionId,actionId:outcome.actionId,owner:String(owner||outcome.owner||'UNASSIGNED'),status,executed:true,verified:true,result:result??outcome.result,payload:{...payload,realised:true,realisedValue:Number(realisedValue)||0,valueUnit:String(valueUnit||'count')}};
}

// Legacy compatibility only: new canonical producers must use verificationToOutcome -> outcomeToValue.
export function verificationToValue(verification,{id,owner,status='REALISED',realisedValue=0,valueUnit='count',result=null,payload={}}={}){
  if(verification?.type!=='Verification'||!verification.id||!verification.tenantId||verification.verified!==true) throw new Error('Value requires verified Verification');
  if(!id) throw new TypeError('Value requires id');
  return {...lineage(verification,id),type:'Value',verificationId:verification.id,executionId:verification.executionId,actionId:verification.actionId,owner:String(owner||verification.owner||'UNASSIGNED'),status,executed:true,verified:true,result:result??verification.result,payload:{...payload,realisedValue:Number(realisedValue)||0,valueUnit:String(valueUnit||'count'),legacyDirectVerificationValue:true}};
}

export function valueToLearning(value,{id,owner='BG168',status='LEARNED',payload={}}={}){
  if(value?.type!=='Value'||!value.id||!value.tenantId||value.verified!==true) throw new Error('Learning requires verified Value');
  if(!id) throw new TypeError('Learning requires id');
  return {...lineage(value,id),type:'Learning',valueId:value.id,owner:String(owner),status,executed:true,verified:true,result:value.result,payload:{...payload,realisedValue:value.payload?.realisedValue??0,valueUnit:value.payload?.valueUnit||'count'}};
}

export function learningToMemory(learning,{id,owner='BG167',status='CURRENT',payload={}}={}){
  if(learning?.type!=='Learning'||!learning.id||!learning.tenantId) throw new TypeError('Memory requires Learning');
  if(!id) throw new TypeError('Memory requires id');
  return {...lineage(learning,id),type:'Memory',learningId:learning.id,owner:String(owner),status,executed:true,verified:learning.verified===true,result:learning.result,payload:{...payload,learningId:learning.id}};
}

export function memoryToGraphFeedback(memory,{id,targetSubjectId,owner='BusinessGraph',relation='learned_update',payload={}}={}){
  if(memory?.type!=='Memory'||!memory.id||!memory.tenantId) throw new TypeError('Graph feedback requires Memory');
  if(!id||!targetSubjectId) throw new TypeError('Graph feedback requires id and targetSubjectId');
  return {...lineage(memory,id),type:'Relation',memoryId:memory.id,owner:String(owner),status:'ACTIVE',executed:true,verified:memory.verified===true,result:memory.result,payload:{...payload,loopStage:'graph_feedback',from:memory.subjectId||`memory:${memory.id}`,to:String(targetSubjectId),relation}};
}

export function outcomeToLearning(outcome,{id,owner='BG168'}={}){
  const normalized={...outcome,kind:'outcome'};
  validateDoneOutcome(normalized);
  if(!id) throw new TypeError('Learning requires id');
  return {tenantId:outcome.tenantId,type:'Learning',id:String(id),subjectId:outcome.subjectId,correlationId:outcome.correlationId||null,predecessorIds:[String(outcome.id)],outcomeId:outcome.id,owner:String(owner),status:'LEARNED',evidenceIds:[...outcome.evidenceIds],payload:{result:outcome.result,actionId:outcome.actionId||null}};
}
