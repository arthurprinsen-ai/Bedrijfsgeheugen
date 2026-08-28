const HARD=new Set(['credentials','secrets','permissions','destructive_data','irreversible_data','paid_resource_increase','legal_commitment','financial_commitment','weaken_security']);
const SAFE_A1=new Set(['RESEARCH','DEDUPE','CACHE','VALIDATE','INTERNAL_ENRICHMENT','GENERATE_TEST','CLASSIFY','ANALYZE']);
export function evaluateAutonomy(m){
  if(HARD.has(String(m.hard_boundary||''))) return {result:'BLOCK_HARD_BOUNDARY',reason:m.hard_boundary,required_gates:[]};
  const cls=String(m.autonomy_class||'A0');
  if(cls==='A0'||cls==='A1') return {result:SAFE_A1.has(String(m.type||''))||cls==='A0'?'ALLOW':'SHADOW',reason:'safe_internal_policy',required_gates:['TRACE','OUTCOME_WRITEBACK']};
  if(cls==='A2') return {result:'ALLOW',reason:'reversible_business_action',required_gates:['POLICY','MEASUREMENT','CONTACT_PRESSURE','ROLLBACK','PROTECTED_METRICS']};
  if(cls==='A3') return {result:'ALLOW',reason:'production_constitution_required',required_gates:['BASELINE','REGRESSION','SECURITY','COST_PERFORMANCE','EXACT_CANDIDATE','PREVIEW_CANARY','ROLLBACK','PROTECTED_METRICS','EXACT_PRODUCTION_VERIFY']};
  return {result:'BLOCK_HARD_BOUNDARY',reason:'unknown_autonomy_class',required_gates:[]};
}
