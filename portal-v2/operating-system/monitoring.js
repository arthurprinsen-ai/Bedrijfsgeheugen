const fingerprint=s=>`${s?.type||'unknown'}|${s?.entity_id||s?.capability_id||'unknown'}|${s?.source_id||''}`;
const observedAt=value=>{const numeric=Number(value);if(Number.isFinite(numeric)&&numeric>0)return numeric;const parsed=Date.parse(String(value||''));return Number.isFinite(parsed)?parsed:0;};

export function dedupeSignals(signals=[]){
 const map=new Map();
 for(const signal of signals){
  const key=fingerprint(signal),prev=map.get(key);
  const newer=!prev||observedAt(signal.observed_at)>=observedAt(prev.observed_at);
  const stronger=!prev||Math.abs(Number(signal.delta)||0)>Math.abs(Number(prev.delta)||0);
  if(newer||stronger)map.set(key,Object.freeze({...signal,fingerprint:key}));
 }
 return Object.freeze([...map.values()]);
}

export function materialSignals(signals=[],policy={}){
 const minDelta=Math.abs(Number(policy.min_abs_delta??0)),minConfidence=Number(policy.min_confidence??0);
 return Object.freeze(dedupeSignals(signals).filter(signal=>Math.abs(Number(signal.delta)||0)>=minDelta&&Number(signal.confidence??0)>=minConfidence));
}
