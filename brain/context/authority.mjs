const rank={VERIFIED:7,SUPPORTED:6,INFERRED:5,HYPOTHESIS:4,CONTESTED:3,STALE:2,INVALID:1};
export function chooseAuthoritativeState(states=[]){
  return [...states].sort((a,b)=>{
    const r=(rank[b.truth_status]||0)-(rank[a.truth_status]||0); if(r) return r;
    const t=Date.parse(b.last_verified_at||0)-Date.parse(a.last_verified_at||0); if(t) return t;
    return (b.confidence||0)-(a.confidence||0);
  })[0]||null;
}
export function effectiveConfidence(item){
  const base=Math.max(0,Math.min(1,Number(item.confidence)||0));
  const factor={VERIFIED:1,SUPPORTED:.95,INFERRED:.75,HYPOTHESIS:.55,CONTESTED:.45,STALE:.35,INVALID:0}[item.truth_status]??.5;
  return Math.round(base*factor*1000)/1000;
}
