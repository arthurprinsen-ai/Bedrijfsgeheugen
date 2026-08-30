const TYPE_KIND={
  Evidence:'evidence',Signal:'signal',Opportunity:'opportunity',Decision:'decision',Action:'action',Outcome:'outcome',Learning:'learning',Entity:'entity',Relation:'relation',CurrentState:'current_state'
};

const clean=v=>typeof v==='string'?v.trim():v;
const unique=xs=>[...new Set(xs.filter(Boolean))];

function requireField(input,key){
  const value=input?.[key];
  if(value===undefined||value===null||value==='') throw new TypeError(`Brain record requires ${key}`);
  return value;
}

export function normalizeBrainRecord(input){
  const tenantId=clean(requireField(input,'tenantId'));
  const type=clean(requireField(input,'type'));
  const id=clean(requireField(input,'id'));
  const kind=TYPE_KIND[type];
  if(!kind) throw new TypeError(`Unsupported Brain record type: ${type}`);
  const subjectId=clean(input.subjectId||`${kind}:${id}`);
  const evidenceIds=unique(Array.isArray(input.evidenceIds)?input.evidenceIds.map(clean):[]);
  const references=unique([
    input.decisionId,input.actionId,input.outcomeId,
    ...evidenceIds
  ].map(clean));
  const nodes=unique([subjectId,...references]);
  const edges=references.map(target=>({from:id,to:target,relation:'supports_or_derives_from'}));
  return Object.freeze({
    schemaVersion:'brain-record.v1',tenantId,type,kind,id,subjectId,
    owner:clean(input.owner||'UNASSIGNED'),status:clean(input.status||'OBSERVED'),
    observedAt:input.observedAt||new Date().toISOString(),
    executed:input.executed===true,verified:input.verified===true,
    result:input.result??null,evidenceIds,references,payload:input.payload||{},
    provenance:{source:clean(input.source||input.provenance?.source||'brain'),sourceId:clean(input.sourceId||input.provenance?.sourceId||id)},
    graph:{nodes,edges}
  });
}

export function validateDoneOutcome(record){
  if(record?.kind!=='outcome') throw new TypeError('Done contract requires an outcome');
  if(!record.owner||record.owner==='UNASSIGNED') throw new Error('Done requires owner');
  if(record.executed!==true) throw new Error('Done requires executed=true');
  if(record.verified!==true) throw new Error('Done requires verified=true');
  if(record.result===null||record.result===undefined||record.result==='') throw new Error('Done requires result');
  if(!Array.isArray(record.evidenceIds)||record.evidenceIds.length===0) throw new Error('Done requires evidence');
  return true;
}

function graphFrom(records){
  const nodes=new Map();
  const edges=[];
  for(const record of records){
    nodes.set(record.id,{id:record.id,kind:record.kind,subjectId:record.subjectId,tenantId:record.tenantId});
    nodes.set(record.subjectId,{id:record.subjectId,kind:'subject',tenantId:record.tenantId});
    edges.push({from:record.id,to:record.subjectId,relation:'about'});
    for(const ref of record.references||[]) edges.push({from:record.id,to:ref,relation:'supports_or_derives_from'});
  }
  return {nodes:[...nodes.values()],edges};
}

export function deriveLoopState(records){
  const normalized=records.map(r=>r?.schemaVersion==='brain-record.v1'?r:normalizeBrainRecord(r));
  const has=kind=>normalized.some(r=>r.kind===kind);
  const evidence=normalized.filter(r=>r.kind==='evidence');
  const decisions=normalized.filter(r=>r.kind==='decision');
  const actions=normalized.filter(r=>r.kind==='action');
  const outcomes=normalized.filter(r=>r.kind==='outcome');
  const learnings=normalized.filter(r=>r.kind==='learning');
  const advice=decisions.map(r=>({id:r.id,subjectId:r.subjectId,owner:r.owner,recommendation:r.payload?.recommendation||r.result||null,status:r.status})).filter(x=>x.recommendation);
  return Object.freeze({
    stages:{
      detect:evidence.length>0,
      verify:evidence.some(r=>Boolean(r.provenance?.source)),
      match:normalized.some(r=>Boolean(r.subjectId)),
      impact:decisions.length>0||outcomes.length>0,
      prioritise:decisions.length>0,
      recommend:advice.length>0,
      act:actions.length>0,
      measure:outcomes.length>0,
      learn:learnings.length>0
    },
    graph:graphFrom(normalized),
    advice,
    memory:{livingMemory:normalized},
    counts:{evidence:evidence.length,decisions:decisions.length,actions:actions.length,outcomes:outcomes.length,learnings:learnings.length}
  });
}
