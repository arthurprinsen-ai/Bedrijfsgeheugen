// One Brain connector impact contract: administrative readbacks and approvals are not new data-flow changes.
const TOP_LEVEL_INTERNAL=new Set(['id','tenantId','tenant_id','version','state','status','createdAt','created_at','updatedAt','updated_at','activatedAt','activatedBy','executions','evidence','runtime']);
const RUNTIME_INTERNAL=new Set(['changeImpact','crossDomainApproval','activationEvidence','recoveryObligation','refreshPolicy','pausedAt','pausedBy','testEvidence','lastExecution','lastRun','lastTest','impactReviewPending']);
const ordered=value=>{
  if(Array.isArray(value))return value.map(ordered);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,ordered(v)]));
  return value;
};
export function connectorConfigurationForImpact(value){
  if(!value||typeof value!=='object')return value??null;
  const out=Object.fromEntries(Object.entries(value).filter(([key])=>!TOP_LEVEL_INTERNAL.has(key)));
  const runtime=Object.fromEntries(Object.entries(value.runtime&&typeof value.runtime==='object'?value.runtime:{}).filter(([key])=>!RUNTIME_INTERNAL.has(key)));
  if(Object.keys(runtime).length)out.runtime=runtime;
  return ordered(out);
}
export function isConnectorConfigurationChanged(before,after){
  return JSON.stringify(connectorConfigurationForImpact(before))!==JSON.stringify(connectorConfigurationForImpact(after));
}
export function pendingConnectorImpactReview(connector){
  const impact=connector?.runtime?.changeImpact;
  if(!impact||impact.contract!=='powerhouse-cross-domain-change-v1'||impact.changed!==true||impact.status!=='REVIEW_REQUIRED')return null;
  return Object.freeze({
    reviewKind:'CROSS_DOMAIN_CHANGE',
    id:'impact:'+String(connector.id)+':'+String(impact.changeId),
    connectorId:String(connector.id),
    changeId:String(impact.changeId),
    status:'pending',
    affectedDomains:Array.isArray(impact.affectedDomains)?impact.affectedDomains.filter(x=>typeof x==='string'):[],
    esrsReview:Array.isArray(impact.esrsReview)?impact.esrsReview.filter(x=>x?.reviewRequired===true).map(x=>({standard:String(x.standard||'UNKNOWN'),applicability:'UNDETERMINED',materiality:'UNDETERMINED'})):[]
  });
}
