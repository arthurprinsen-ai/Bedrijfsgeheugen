// Powerhouse ONE LOOP — pure transition contract, no scheduler or competing authority.
// Runtime adapters must persist transitions through the existing canonical Supabase authority.
export const STATES=Object.freeze(['PROPOSED','AUTHORIZED','QUEUED','LEASED','EXECUTED','VERIFIED','LEARNED','CLOSED','RETRY_WAIT','NEEDS_INTERVENTION']);
export const TRANSITIONS=Object.freeze({
 PROPOSED:['AUTHORIZED','NEEDS_INTERVENTION'],
 AUTHORIZED:['QUEUED','NEEDS_INTERVENTION'],
 QUEUED:['LEASED','NEEDS_INTERVENTION'],
 LEASED:['EXECUTED','RETRY_WAIT','NEEDS_INTERVENTION'],
 EXECUTED:['VERIFIED','RETRY_WAIT','NEEDS_INTERVENTION'],
 VERIFIED:['LEARNED','NEEDS_INTERVENTION'],
 LEARNED:['CLOSED'],
 RETRY_WAIT:['QUEUED','NEEDS_INTERVENTION'],
 NEEDS_INTERVENTION:['QUEUED'],
 CLOSED:[]
});
export function transition(current,next,{evidence,tenantId,correlationId}={}){
 if(!STATES.includes(current)||!TRANSITIONS[current].includes(next)) throw new Error('INVALID_ONE_LOOP_TRANSITION');
 if(!tenantId||!correlationId) throw new Error('MISSING_ONE_LOOP_IDENTITY');
 if(['EXECUTED','VERIFIED','LEARNED','CLOSED'].includes(next)&&(!Array.isArray(evidence)||evidence.length===0)) throw new Error('MISSING_ONE_LOOP_EVIDENCE');
 return Object.freeze({state:next,tenant_id:tenantId,correlation_id:correlationId,evidence_refs:evidence||[]});
}
export function actionKey({tenantId,sourceFingerprint,actionType,subject}){
 for(const value of [tenantId,sourceFingerprint,actionType,subject]) if(typeof value!=='string'||!value.trim()) throw new Error('INVALID_ONE_LOOP_KEY_PART');
 return JSON.stringify([tenantId,sourceFingerprint,actionType,subject]);
}
