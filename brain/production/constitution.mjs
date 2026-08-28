export function productionDecision(s){
  if(!s.rollback_sha) return {decision:'BLOCK_HARD_BOUNDARY',reason:'rollback_missing'};
  if(!s.candidate_sha||s.candidate_sha!==s.tested_sha) return {decision:'RECOVERING',reason:'candidate_identity_mismatch'};
  const gates=[['qa_green','qa'],['security_green','security'],['cost_performance_green','cost_performance'],['preview_green','preview']];
  for(const [k,n] of gates) if(s[k]!==true) return {decision:'RECOVERING',reason:`${n}_gate_red`};
  if(s.production_green===false||s.protected_metrics_green===false) return {decision:'ROLLBACK',reason:'production_protected_metric_red',rollback_sha:s.rollback_sha};
  if(s.production_green===true&&s.exact_production_sha&&s.exact_production_sha!==s.candidate_sha) return {decision:'ROLLBACK',reason:'production_identity_mismatch',rollback_sha:s.rollback_sha};
  if(s.protected_metrics_green!==true) return {decision:'RECOVERING',reason:'protected_metrics_not_green'};
  return {decision:'PROMOTE',reason:'exact_green_candidate',candidate_sha:s.candidate_sha,rollback_sha:s.rollback_sha};
}
