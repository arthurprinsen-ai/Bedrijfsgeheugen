const clean=v=>String(v??'').trim();
const sortTime=(a,b)=>clean(a.observedAt).localeCompare(clean(b.observedAt));
const uniq=xs=>[...new Set((xs||[]).filter(Boolean).map(String))];

export function createBusinessGraphProjection(records,{tenantId}={}){
  if(!tenantId) throw new TypeError('Business Graph tenantId required');
  const scoped=(Array.isArray(records)?records:[]).filter(r=>String(r?.tenantId)===String(tenantId));
  const entityHistory={};
  for(const record of scoped.filter(r=>r?.type==='Entity'||r?.kind==='entity')){
    const key=clean(record.subjectId||record.id); if(!key) continue;
    (entityHistory[key]??=[]).push(record);
  }
  for(const rows of Object.values(entityHistory)) rows.sort(sortTime);
  const entities=Object.entries(entityHistory).map(([subjectId,rows])=>Object.freeze({...rows.at(-1),subjectId})).sort((a,b)=>clean(a.subjectId).localeCompare(clean(b.subjectId)));
  const relations=scoped.filter(r=>r?.type==='Relation'||r?.kind==='relation').filter(r=>r?.payload?.from&&r?.payload?.to).sort(sortTime).map(r=>Object.freeze({...r}));
  const history=Object.fromEntries(Object.entries(entityHistory).map(([k,rows])=>[k,Object.freeze(rows.map(r=>Object.freeze({...r})))]));
  return Object.freeze({schemaVersion:'brain-business-graph.v1',tenantId:String(tenantId),entities:Object.freeze(entities),relations:Object.freeze(relations),history:Object.freeze(history),summary:Object.freeze({entities:entities.length,relations:relations.length})});
}

export function explainGraphObject(records,{tenantId,subjectId}={}){
  if(!tenantId||!subjectId) throw new TypeError('graph explanation requires tenantId and subjectId');
  const history=(Array.isArray(records)?records:[]).filter(r=>String(r?.tenantId)===String(tenantId)&&String(r?.subjectId)===String(subjectId)).sort(sortTime);
  if(history.length===0) return Object.freeze({schemaVersion:'brain-graph-explanation.v1',tenantId:String(tenantId),subjectId:String(subjectId),current:null,history:Object.freeze([]),evidenceIds:Object.freeze([]),sources:Object.freeze([])});
  const evidenceIds=uniq(history.flatMap(r=>Array.isArray(r.evidenceIds)?r.evidenceIds:[]));
  const sources=uniq(history.map(r=>{
    const source=clean(r?.provenance?.source); const sourceId=clean(r?.provenance?.sourceId);
    return source?`${source}:${sourceId||'unknown'}`:null;
  }));
  return Object.freeze({schemaVersion:'brain-graph-explanation.v1',tenantId:String(tenantId),subjectId:String(subjectId),current:Object.freeze({...history.at(-1)}),history:Object.freeze(history.map(r=>Object.freeze({...r}))),evidenceIds:Object.freeze(evidenceIds),sources:Object.freeze(sources)});
}
