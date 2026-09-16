const fingerprint=s=>`${s?.type||'unknown'}|${s?.entity_id||s?.capability_id||'unknown'}|${s?.source_id||''}`;

export function dedupeSignals(signals=[]){
 const map=new Map();
 for(const signal of signals){const key=fingerprint(signal);const prev=map.get(key);if(!prev||Number(signal.observed_at||0)>=Number(prev.observed_at||0)||Math.abs(Number(signal.delta)||0)>Math.abs(Number(prev.delta)||0))map.set(key,Object.freeze({...signal,fingerprint:key}));}
 return Object.freeze([...map.values()]);
}

export function materialSignals(signals=[],policy={}){
 const minDelta=Math.abs(Number(policy.min_abs_delta??0)),minConfidence=Number(policy.min_confidence??0);
 return Object.freeze(dedupeSignals(signals).filter(signal=>Math.abs(Number(signal.delta)||0)>=minDelta&&Number(signal.confidence??0)>=minConfidence));
}
