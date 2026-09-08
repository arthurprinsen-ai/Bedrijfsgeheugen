const nonEmpty=v=>Array.isArray(v)?v.length>0:Boolean(String(v??'').trim());

export function evaluateKnowledgeCompletion(event={}){
  const missing=[];
  if(!nonEmpty(event.source_refs)) missing.push('source_refs');
  if(!nonEmpty(event.evidence)) missing.push('evidence');
  if(!event.outcome?.status) missing.push('outcome');
  if(event.architecture_impact?.status!=='MAPPED'||!nonEmpty(event.architecture_impact?.components)) missing.push('architecture_mapping');
  if(!String(event.rollback?.strategy||'').trim()) missing.push('rollback');
  if(event.projection?.state!=='projected') missing.push('projection');
  if(event.writeback?.state!=='written') missing.push('brain_writeback');
  if(event.readback?.state!=='verified'||!String(event.readback?.bg167_ref||'').trim()) missing.push('bg167_readback');
  const blocked=event.writeback?.state==='blocked'||event.outcome?.status==='blocked';
  const status=blocked?'BLOCKED':missing.length?'OPEN':'COMPLETE';
  return Object.freeze({status,missing:Object.freeze(missing),closable:status==='COMPLETE'});
}
