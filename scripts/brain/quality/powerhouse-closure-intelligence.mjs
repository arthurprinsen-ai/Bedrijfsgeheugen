function unique(values){return [...new Set(values.filter(Boolean))];}

export function selectTestsForChange({changedPaths=[],capabilityTests={},mandatory=[]}={}){
  const selected=[];
  for(const path of changedPaths){
    for(const [prefix,tests] of Object.entries(capabilityTests)){
      if(path.startsWith(prefix))selected.push(...(Array.isArray(tests)?tests:[]));
    }
  }
  return unique([...selected,...mandatory]);
}

export function buildEscapedDefectLearning(defect={}){
  const fingerprint=String(defect.fingerprint||'').trim();
  if(!fingerprint||!defect.productionEvidenceRef)return {status:'invalid',obligation:null};
  if(defect.regressionGuardRef)return {status:'guarded',obligation:null,fingerprint,regressionGuardRef:defect.regressionGuardRef};
  return {
    status:'guard_required', fingerprint, evidenceRef:defect.productionEvidenceRef, rootCause:defect.rootCause||null,
    obligation:{type:'regression_guard',idempotencyKey:`escaped-defect|${fingerprint}|regression-guard`,expected:'A deterministic regression test or invariant permanently catches this escaped defect before promotion.',recoveryPolicy:'Add the smallest cause-specific guard, prove red-green, run protected gates, then write verified prevention back to Powerhouse.'}
  };
}

export function validateFaultInjection({environment,destructive=false,rollbackRef=null}={}){
  const errors=[];
  if(environment==='production')errors.push('fault injection is forbidden in production');
  if(destructive)errors.push('destructive fault injection is forbidden');
  if(!rollbackRef)errors.push('rollbackRef is required');
  return {ok:errors.length===0,errors};
}

export function buildPerformanceRca({metric,baseline,observed,traces=[],changedComponents=[]}={}){
  const b=Number(baseline); const o=Number(observed); const valid=Number.isFinite(b)&&Number.isFinite(o);
  return {metric:metric||null,baseline:valid?b:null,observed:valid?o:null,delta:valid?o-b:null,regressed:valid?o>b:false,evidenceRefs:unique(Array.isArray(traces)?traces:[]),changedComponents:unique(Array.isArray(changedComponents)?changedComponents:[]),rcaRequired:valid&&o>b};
}
