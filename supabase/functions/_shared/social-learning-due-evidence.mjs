/** Deterministic source-time windows. Observed metrics can inform a test, but
 * only the actual provider snapshot is used later for evaluation. */
export function tagDuePostsWithObservedWindows(due=[],snapshots=[],{toleranceHours=6}={}){
  const tolerance=Math.max(0,Math.min(12,Number(toleranceHours)||6));
  const byId=new Map();
  for(const s of snapshots){
    if(!s||!s.post_id||!['OBSERVED','PROVIDER_OBSERVED'].includes(String(s.data_quality)))continue;
    const observed=Date.parse(s.observed_at||'');
    if(!Number.isFinite(observed))continue;
    const arr=byId.get(s.post_id)||[];arr.push(observed);byId.set(s.post_id,arr);
  }
  return due.map(p=>{
    const target=Date.parse(p.publishedAt||'')+Number(p.dueWindow||p.windowHours)*3600000;
    const match=Number.isFinite(target)&&(byId.get(p.postId)||[])
      .some(observed=>Math.abs(observed-target)<=tolerance*3600000);
    return {...p,hasWindowSnapshot:match};
  });
}
