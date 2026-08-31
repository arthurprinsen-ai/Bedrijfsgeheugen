const TYPE_KIND={Evidence:'evidence',Signal:'signal',Opportunity:'opportunity',Impact:'impact',Decision:'decision',Action:'action',Execution:'execution',Verification:'verification',Outcome:'outcome',Value:'value',Learning:'learning',Memory:'memory',Entity:'entity',Relation:'relation',CurrentState:'current_state'};
const clean=v=>typeof v==='string'?v.trim():v;
const unique=xs=>[...new Set(xs.filter(Boolean))];
function requireField(input,key){const value=input?.[key];if(value===undefined||value===null||value==='') throw new TypeError(`Brain record requires ${key}`);return value;}
export function normalizeBrainRecord(input){
  const tenantId=clean(requireField(input,'tenantId'));const type=clean(requireField(input,'type'));const id=clean(requireField(input,'id'));const kind=TYPE_KIND[type];
  if(!kind) throw new TypeError(`Unsupported Brain record type: ${type}`);
  const subjectId=clean(input.subjectId||`${kind}:${id}`);const evidenceIds=unique(Array.isArray(input.evidenceIds)?input.evidenceIds.map(clean):[]);const predecessorIds=unique(Array.isArray(input.predecessorIds)?input.predecessorIds.map(clean):[]);const correlationId=clean(input.correlationId||'')||null;
  const references=unique([input.decisionId,input.actionId,input.executionId,input.verificationId,input.outcomeId,input.valueId,input.learningId,input.memoryId,...predecessorIds,...evidenceIds].map(clean));const nodes=unique([subjectId,...references]);
  const edges=references.map(target=>({from:id,to:target,relation:predecessorIds.includes(target)?'follows':'supports_or_derives_from'}));
  return Object.freeze({schemaVersion:'brain-record.v1',tenantId,type,kind,id,subjectId,correlationId,predecessorIds,owner:clean(input.owner||'UNASSIGNED'),status:clean(input.status||'OBSERVED'),observedAt:input.observedAt||new Date().toISOString(),executed:input.executed===true,verified:input.verified===true,result:input.result??null,evidenceIds,references,payload:input.payload||{},provenance:{source:clean(input.source||input.provenance?.source||'brain'),sourceId:clean(input.sourceId||input.provenance?.sourceId||id)},graph:{nodes,edges}});
}
export function validateDoneOutcome(record){
  if(record?.kind!=='outcome') throw new TypeError('Done contract requires an outcome');
  if(!record.owner||record.owner==='UNASSIGNED') throw new Error('Done requires owner');
  if(record.executed!==true) throw new Error('Done requires executed=true');
  if(record.verified!==true) throw new Error('Done requires verified=true');
  if(record.result===null||record.result===undefined||record.result==='') throw new Error('Done requires result');
  if(!Array.isArray(record.evidenceIds)||record.evidenceIds.length===0) throw new Error('Done requires evidence');return true;
}
function graphFrom(records){
  const nodes=new Map();const edges=[];
  for(const record of records){
    nodes.set(record.id,{id:record.id,kind:record.kind,subjectId:record.subjectId,tenantId:record.tenantId,correlationId:record.correlationId||null});
    nodes.set(record.subjectId,{id:record.subjectId,kind:'subject',tenantId:record.tenantId});
    edges.push({from:record.id,to:record.subjectId,relation:'about'});
    for(const ref of record.references||[]) edges.push({from:record.id,to:ref,relation:(record.predecessorIds||[]).includes(ref)?'follows':'supports_or_derives_from'});
    if(record.kind==='relation'&&record.payload?.from&&record.payload?.to){
      const from=String(record.payload.from),to=String(record.payload.to);
      nodes.set(from,{id:from,kind:'subject',tenantId:record.tenantId});nodes.set(to,{id:to,kind:'subject',tenantId:record.tenantId});
      edges.push({from,to,relation:record.payload.relation||'related_to',weight:Number(record.payload.weight??1),evidenceIds:[...(record.evidenceIds||[])],relationRecordId:record.id,loopStage:record.payload.loopStage||null});
    }
  }
  return {nodes:[...nodes.values()],edges};
}
export function deriveLoopState(records){
  const normalized=records.map(r=>r?.schemaVersion==='brain-record.v1'?r:normalizeBrainRecord(r));const evidence=normalized.filter(r=>r.kind==='evidence');const graphRecords=normalized.filter(r=>(r.kind==='entity'||r.kind==='relation')&&r.payload?.loopStage!=='graph_feedback');const intelligence=normalized.filter(r=>r.kind==='signal'||r.kind==='opportunity');const impacts=normalized.filter(r=>r.kind==='impact');const decisions=normalized.filter(r=>r.kind==='decision');const actions=normalized.filter(r=>r.kind==='action');const executions=normalized.filter(r=>r.kind==='execution');const verifications=normalized.filter(r=>r.kind==='verification');const outcomes=normalized.filter(r=>r.kind==='outcome');const values=normalized.filter(r=>r.kind==='value');const learnings=normalized.filter(r=>r.kind==='learning');const memories=normalized.filter(r=>r.kind==='memory');const graphFeedback=normalized.filter(r=>r.kind==='relation'&&r.payload?.loopStage==='graph_feedback');
  const advice=decisions.map(r=>({id:r.id,subjectId:r.subjectId,owner:r.owner,recommendation:r.payload?.recommendation||r.result||null,status:r.status})).filter(x=>x.recommendation);
  const canonicalStages={evidence:evidence.length>0,graph:graphRecords.length>0,intelligence:intelligence.length>0,impact:impacts.length>0,decision:decisions.length>0,action:actions.length>0,execution:executions.length>0,verification:verifications.length>0,value:values.length>0,learning:learnings.length>0,memory:memories.length>0,graph_feedback:graphFeedback.length>0};
  const legacyStages={detect:evidence.length>0,verify:evidence.some(r=>Boolean(r.provenance?.source)),match:normalized.some(r=>Boolean(r.subjectId)),impact:canonicalStages.impact||decisions.length>0||outcomes.length>0,prioritise:decisions.length>0,recommend:advice.length>0,act:actions.length>0,measure:values.length>0||outcomes.length>0,learn:learnings.length>0};
  return Object.freeze({stages:{...canonicalStages,...legacyStages},graph:graphFrom(normalized),advice,memory:{livingMemory:normalized},counts:{evidence:evidence.length,graph:graphRecords.length,intelligence:intelligence.length,impact:impacts.length,decisions:decisions.length,actions:actions.length,executions:executions.length,verifications:verifications.length,outcomes:outcomes.length,value:values.length,learnings:learnings.length,memory:memories.length,graphFeedback:graphFeedback.length}});
}
