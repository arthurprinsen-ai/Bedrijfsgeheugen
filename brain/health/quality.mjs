const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
export function assessRecord(r){
  if(r.schema_valid===false) return {action:'QUARANTINE',source_state:'DEGRADED',truth_status:'INVALID',confidence:0};
  const state=r.source_state||'HEALTHY', base=clamp(r.confidence??1);
  if(state==='UNAVAILABLE') return r.last_known_good?{action:'USE_LKG',source_state:state,truth_status:'STALE',confidence:Math.round(base*Math.max(.1,1-(r.age_hours||0)/168)*1000)/1000,last_known_good:r.last_known_good}:{action:'DEGRADE',source_state:state,truth_status:'STALE',confidence:0};
  if(state==='STALE') return {action:'DEGRADE',source_state:state,truth_status:'STALE',confidence:Math.round(base*.5*1000)/1000};
  if(state==='CONTRADICTED') return {action:'RESEARCH',source_state:state,truth_status:'CONTESTED',confidence:Math.round(base*.45*1000)/1000};
  if(state==='DEGRADED') return {action:'DEGRADE',source_state:state,truth_status:'INFERRED',confidence:Math.round(base*.7*1000)/1000};
  return {action:'ACCEPT',source_state:'HEALTHY',truth_status:r.truth_status||'SUPPORTED',confidence:base};
}
export function resolveIdentity({deterministic_match=false,fuzzy_score=0}){
  if(deterministic_match) return {status:'MATCH',auto_merge:true,confidence:1};
  if(fuzzy_score>=.85) return {status:'CANDIDATE_MATCH',auto_merge:false,confidence:fuzzy_score};
  return {status:'POSSIBLE_MATCH',auto_merge:false,confidence:Math.max(0,fuzzy_score)};
}
