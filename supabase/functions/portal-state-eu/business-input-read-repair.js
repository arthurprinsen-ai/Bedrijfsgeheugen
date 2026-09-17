const obj=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const arr=value=>Array.isArray(value)?value:[];
const time=value=>Number.isFinite(Date.parse(String(value||'')))?Date.parse(String(value)):0;

export function businessInputFromBrainRecord(record={}){
  if(record?.record_type!=='BusinessInput')return null;
  const payload=obj(record.payload);
  const id=String(payload.canonicalObjectId||record.subject_id||'').trim();
  if(!id)return null;
  const updatedAt=String(record.updated_at||record.observed_at||payload.submittedAt||'').trim();
  return {
    id,
    inputType:String(payload.inputType||'Unknown'),
    modelId:String(payload.modelId||id),
    instanceId:String(payload.instanceId||'primary'),
    schemaVersion:Number(payload.schemaVersion)||1,
    answers:obj(payload.answers),
    metadata:{...obj(payload.metadata),brainRecordId:String(record.record_id||''),sourceRevision:String(record.source_revision||payload.sourceRevision||'')},
    sourcePortal:String(payload.sourcePortal||''),
    submittedBy:String(payload.submittedBy||record.owner_id||''),
    submittedAt:String(payload.submittedAt||record.observed_at||updatedAt),
    truthClass:String(payload.truthClass||record.record_kind||'SourceTruth'),
    provenance:obj(record.provenance),
    updatedAt
  };
}

export function repairBusinessInputsFromAuthority(payload={},records=[]){
  const current=obj(payload);
  const byId=new Map(arr(current.businessInputs).filter(item=>item&&item.id).map(item=>[String(item.id),item]));
  for(const record of arr(records).slice().sort((a,b)=>time(a?.updated_at||a?.observed_at)-time(b?.updated_at||b?.observed_at))){
    const next=businessInputFromBrainRecord(record);
    if(!next)continue;
    const previous=byId.get(next.id);
    if(!previous||time(next.updatedAt)>=time(previous.updatedAt||previous.submittedAt))byId.set(next.id,{...previous,...next});
  }
  if(byId.size===0)return current;
  const latest=[...byId.values()].reduce((max,item)=>Math.max(max,time(item.updatedAt||item.submittedAt)),0);
  return {
    ...current,
    businessInputs:[...byId.values()],
    sourceMeta:{...obj(current.sourceMeta),kind:'canonical-brain',live:true,label:'Canonical Brain projectie',updatedAt:new Date(Math.max(latest,time(current?.sourceMeta?.updatedAt))||Date.now()).toISOString()}
  };
}
