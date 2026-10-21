import {ACTION_RISK_CLASS,ACTION_STATES,canAutoExecute} from './contracts.js';

export function classifyActionRisk(action={}){
 if(action.external||action.customer_facing||action.financial||action.identity_sensitive||action.channel)return ACTION_RISK_CLASS.EXTERNAL;
 if(action.material_mutation)return ACTION_RISK_CLASS.INTERNAL_MATERIAL;
 if(action.internal&&action.reversible)return ACTION_RISK_CLASS.INTERNAL_REVERSIBLE;
 return ACTION_RISK_CLASS.READ_ONLY;
}

export function evaluateActionEligibility(action={},context={}){
 const risk=Number.isInteger(action.risk_class)?action.risk_class:classifyActionRisk(action);
 if(!action.tenant_id||!action.provenance)return Object.freeze({eligible:false,state:'BLOCKED',risk_class:risk,reason:'MISSING_SCOPE_OR_PROVENANCE'});
 if(risk===3){
  if(!context.approved)return Object.freeze({eligible:false,state:'APPROVAL_REQUIRED',risk_class:risk,reason:'EXPLICIT_APPROVAL_REQUIRED'});
  if(!action.identity_verified||!action.permission_verified||!action.destination)return Object.freeze({eligible:false,state:'BLOCKED',risk_class:risk,reason:'OUTBOUND_GATES_FAILED'});
  return Object.freeze({eligible:true,state:'ELIGIBLE',risk_class:risk});
 }
 if(risk===2){
  if(!context.policy_allowed||!action.permission_verified)return Object.freeze({eligible:false,state:'APPROVAL_REQUIRED',risk_class:risk,reason:'POLICY_OR_ROLE_GATE'});
  return Object.freeze({eligible:true,state:'ELIGIBLE',risk_class:risk});
 }
 if(canAutoExecute({...action,risk_class:risk}))return Object.freeze({eligible:true,state:'AUTO_APPROVED',risk_class:risk});
 if(risk===0&&action.tenant_id&&action.provenance)return Object.freeze({eligible:true,state:'AUTO_APPROVED',risk_class:risk});
 return Object.freeze({eligible:false,state:'BLOCKED',risk_class:risk,reason:'SAFETY_GATES_FAILED'});
}

const ALLOWED=Object.freeze({
 PROPOSED:['ELIGIBLE','APPROVAL_REQUIRED','AUTO_APPROVED','BLOCKED'],ELIGIBLE:['QUEUED','BLOCKED'],APPROVAL_REQUIRED:['QUEUED','BLOCKED'],AUTO_APPROVED:['QUEUED','BLOCKED'],QUEUED:['EXECUTING','FAILED'],EXECUTING:['READBACK_PENDING','FAILED'],READBACK_PENDING:['VERIFIED','FAILED'],VERIFIED:['OUTCOME_PENDING'],OUTCOME_PENDING:['OUTCOME_RECORDED'],OUTCOME_RECORDED:['LEARNED'],LEARNED:[],BLOCKED:[],FAILED:[]
});

export function transitionAction(action={},nextState,context={}){
 const current=action.state||'PROPOSED';
 if(!ACTION_STATES.includes(nextState)||!ALLOWED[current]?.includes(nextState))throw new Error('ACTION_TRANSITION_FORBIDDEN');
 const risk=Number.isInteger(action.risk_class)?action.risk_class:classifyActionRisk(action);
 if(nextState==='QUEUED'&&risk===3&&(!context.approved||!context.destination_verified||!context.readback_required))throw new Error('ACTION_TRANSITION_FORBIDDEN');
 return Object.freeze({...action,risk_class:risk,state:nextState,updated_at:context.now||new Date().toISOString()});
}
