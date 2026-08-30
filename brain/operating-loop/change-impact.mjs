const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const unique=xs=>[...new Set(xs.filter(Boolean))];

export function analyzeChangeImpact(records,{tenantId,subjectId,maxDepth=3,hopDecay=.9}={}){
  if(!tenantId||!subjectId) throw new TypeError('impact analysis requires tenantId and subjectId');
  const depthLimit=Math.max(0,Math.min(10,Number(maxDepth)||0));
  const decay=clamp(hopDecay);
  const relations=(Array.isArray(records)?records:[]).filter(r=>r?.tenantId===tenantId&&r?.kind==='relation'&&r.payload?.from&&r.payload?.to);
  const outgoing=new Map();
  for(const relation of relations){
    const from=String(relation.payload.from);const edge={to:String(relation.payload.to),relation:relation.payload.relation||'related_to',weight:clamp(relation.payload.weight??1),evidenceIds:Array.isArray(relation.evidenceIds)?relation.evidenceIds:[],relationId:relation.id};
    if(!outgoing.has(from)) outgoing.set(from,[]);outgoing.get(from).push(edge);
  }
  for(const edges of outgoing.values()) edges.sort((a,b)=>a.to.localeCompare(b.to)||String(a.relationId).localeCompare(String(b.relationId)));
  const queue=[{node:String(subjectId),depth:0,score:1,path:[String(subjectId)],evidenceIds:[]}];
  const best=new Map();
  while(queue.length){
    const current=queue.shift();if(current.depth>=depthLimit) continue;
    for(const edge of outgoing.get(current.node)||[]){
      if(current.path.includes(edge.to)) continue;
      const depth=current.depth+1;
      const score=current.score*edge.weight*(depth>1?decay:1);
      const evidenceIds=unique([...current.evidenceIds,...edge.evidenceIds]);
      const candidate={subjectId:edge.to,depth,impactScore:Number(score.toFixed(12)),relation:edge.relation,path:[...current.path,edge.to],evidenceIds,relationIds:[...(current.relationIds||[]),edge.relationId]};
      const existing=best.get(edge.to);
      if(!existing||candidate.impactScore>existing.impactScore||(candidate.impactScore===existing.impactScore&&candidate.depth<existing.depth)){
        best.set(edge.to,candidate);
        queue.push({node:edge.to,depth,score:candidate.impactScore,path:candidate.path,evidenceIds,relationIds:candidate.relationIds});
      }
    }
  }
  const impacts=[...best.values()].sort((a,b)=>a.depth-b.depth||b.impactScore-a.impactScore||a.subjectId.localeCompare(b.subjectId));
  return Object.freeze({tenantId:String(tenantId),subjectId:String(subjectId),maxDepth:depthLimit,impacts});
}
