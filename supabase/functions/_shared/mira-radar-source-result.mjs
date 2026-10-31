// One original Mira radar: classify its EXISTING Supabase source materializer.
// Read-only, deterministic, no new planner, provider, approval, or sender.
export const MIRA_SOURCE_SHORTAGE_CONTRACT='original-mira-source-shortage-readback-v1';
const EMPTY_STATES=new Set([
  'NO_FRESH_PUBLIC_PROBLEM_SIGNAL',
  'SOURCE_LINEAGE_SIGNAL_MISSING',
  'SOURCE_PUBLICATION_DATE_UNVERIFIED_OR_STALE'
]);
const READY_STATES=new Set(['RECOMMENDATION_MATERIALIZED','WINNER_ALREADY_FROZEN']);

export function classifyOriginalMiraSourceResult({runDate,materialized,error}={}){
 const date=typeof runDate==='string'?runDate:'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))
  return Object.freeze({contract:MIRA_SOURCE_SHORTAGE_CONTRACT,ok:false,reason:'RUN_DATE_INVALID',code:'MIRA_SOURCE_RESULT_UNVERIFIED',recoveryDue:true,sourceReady:false});
 if(error)
  return Object.freeze({contract:MIRA_SOURCE_SHORTAGE_CONTRACT,ok:false,reason:'MATERIALIZER_RPC_FAILED',code:'MIRA_SOURCE_RESULT_UNVERIFIED',recoveryDue:true,sourceReady:false});
 const state=typeof materialized?.state==='string'?materialized.state:'';
 if(materialized?.ok===true&&READY_STATES.has(state))
  return Object.freeze({contract:MIRA_SOURCE_SHORTAGE_CONTRACT,ok:true,reason:state,code:null,recoveryDue:false,sourceReady:true});
 if(materialized?.ok===false&&EMPTY_STATES.has(state))
  return Object.freeze({contract:MIRA_SOURCE_SHORTAGE_CONTRACT,ok:false,reason:state,code:'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED',recoveryDue:true,sourceReady:false});
 // A malformed, missing, or unknown RPC result is NEVER source success.
 return Object.freeze({contract:MIRA_SOURCE_SHORTAGE_CONTRACT,ok:false,reason:'MATERIALIZER_RESULT_UNVERIFIED',code:'MIRA_SOURCE_RESULT_UNVERIFIED',recoveryDue:true,sourceReady:false});
}
