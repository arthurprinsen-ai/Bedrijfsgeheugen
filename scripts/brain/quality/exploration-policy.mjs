const DESTRUCTIVE=new Set(['DELETE','PATCH','PUT','POST']);
export function evaluateExplorationAction({method='GET',target='preview',budget={}}={}) {
  const m=String(method).toUpperCase(); const production=target==='production';
  const allowed=!(production&&DESTRUCTIVE.has(m));
  return Object.freeze({allowed,reason:allowed?'bounded_safe_action':'destructive_production_action_forbidden',budget:{max_pages:budget.max_pages??50,max_actions:budget.max_actions??250,max_minutes:budget.max_minutes??15}});
}
export function normalizeFinding(finding={}) {
  return Object.freeze({...finding,status:'candidate_finding',release_evidence:false,requires_deterministic_reproduction:true});
}
