const arr=v=>Array.isArray(v)?v:[];
const newest=(a,b)=>String(b?.captured_at||b?.created_at||'').localeCompare(String(a?.captured_at||a?.created_at||''));
const uniqueRefs=refs=>{
  const seen=new Set();const out=[];
  for(const ref of refs){const key=[ref?.system,ref?.kind,ref?.id,ref?.sha,ref?.deploy_id,ref?.execution_id].map(x=>String(x||'')).join('|');if(!seen.has(key)){seen.add(key);out.push(ref);}}
  return out;
};

export function buildKnowledgeTimeline(events,{component,fingerprint,sourceType,outcomeStatus}={}){
  const selected=arr(events).filter(event=>{
    if(component&&String(event?.component)!==String(component)) return false;
    if(fingerprint&&String(event?.fingerprint)!==String(fingerprint)) return false;
    if(sourceType&&String(event?.source_type)!==String(sourceType)) return false;
    if(outcomeStatus&&String(event?.outcome?.status)!==String(outcomeStatus)) return false;
    return true;
  });
  const groups=new Map();
  for(const event of selected){
    const key=String(event?.correlation_id||event?.fingerprint||event?.component||event?.event_id||'unscoped');
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(event);
  }
  return [...groups.entries()].map(([key,items])=>{
    const sorted=[...items].sort(newest);
    const refs=uniqueRefs(sorted.flatMap(x=>arr(x?.source_refs)));
    return Object.freeze({
      key,
      component:sorted.find(x=>x?.component)?.component||null,
      fingerprint:sorted.find(x=>x?.fingerprint)?.fingerprint||null,
      latestAt:sorted[0]?.captured_at||sorted[0]?.created_at||null,
      status:sorted.some(x=>x?.writeback?.state==='blocked'||x?.outcome?.status==='blocked')?'BLOCKED':sorted.every(x=>x?.readback?.state==='verified')?'VERIFIED':'OPEN',
      sourceRefs:Object.freeze(refs),
      chain:Object.freeze(refs.flatMap(ref=>[ref?.id,ref?.sha,ref?.deploy_id,ref?.execution_id].filter(Boolean).map(String))),
      events:Object.freeze(sorted)
    });
  }).sort((a,b)=>String(b.latestAt||'').localeCompare(String(a.latestAt||'')));
}
