export function evaluateShadowObservation(o={}) {
  const drift=o.expected!==o.observed;
  const base={id:String(o.id||'unknown'),status:drift?'DRIFT':'MATCH',evidence:o.evidence??null,release_authority:false};
  if (!drift) return Object.freeze(base);
  return Object.freeze({...base,obligation:{kind:'escaped_defect',fingerprint:`quality-shadow:${base.id}`,required:o.required!==false,root_cause:'OPEN',regression_test:'OPEN',prevention_rule:'OPEN',learning_authority:'BRAIN-CLOSED-LOOP-v1',production_authority:'BG169',evidence:o.evidence??null}});
}
