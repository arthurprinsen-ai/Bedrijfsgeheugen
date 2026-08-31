const RISK_LEVELS=new Set(['unacceptable','high','transparency','minimal_or_no_risk']);
const text=value=>typeof value==='string'&&value.trim()?value.trim():null;
const list=value=>Array.isArray(value)?[...new Set(value.map(item=>text(item)).filter(Boolean))]:[];
const evidenceFor=record=>[...new Set([...(record.evidenceIds||[]),...(record.references||[])].map(item=>text(item)).filter(Boolean))];
const riskOf=value=>{
  const risk=text(value)?.toLowerCase();
  if(!risk) return null;
  if(risk==='prohibited'||risk==='unacceptable') return 'unacceptable';
  if(risk==='high') return 'high';
  if(risk==='limited'||risk==='transparency') return 'transparency';
  if(risk==='minimal'||risk==='minimal_or_no_risk') return 'minimal_or_no_risk';
  return risk;
};
const timeOf=record=>{const parsed=Date.parse(record?.observedAt||'');return Number.isNaN(parsed)?0:parsed;};

function projectSystem(record,{now}={}){
  const payload=record?.payload||{};
  const riskLevel=riskOf(payload.riskLevel);
  const missing=[];
  if(!text(payload.systemName)) missing.push('system_name');
  if(!text(payload.provider)) missing.push('provider');
  if(!text(payload.model)) missing.push('model');
  if(!text(payload.purpose)) missing.push('purpose');
  if(!text(payload.role)) missing.push('role');
  if(!riskLevel||!RISK_LEVELS.has(riskLevel)) missing.push('risk_classification');
  if(!text(payload.classificationSource)) missing.push('classification_source');
  if(!text(record?.owner)||record.owner==='UNASSIGNED') missing.push('owner');
  const evidenceIds=evidenceFor(record);
  if(record?.verified!==true||evidenceIds.length===0) missing.push('verified_evidence');
  if(payload.approved!==true) missing.push('approval');
  if(list(payload.approvalEvidenceIds).length===0) missing.push('approval_evidence');
  const humanOversight=payload.humanOversight&&typeof payload.humanOversight==='object'?payload.humanOversight:{required:false,control:null};
  if(humanOversight.required===true&&!text(humanOversight.control)) missing.push('human_oversight_control');
  if(riskLevel==='high'&&!text(humanOversight.control)) missing.push('human_oversight_control');
  if(riskLevel==='transparency'&&!text(payload.transparencyControl)) missing.push('transparency_control');
  if((riskLevel==='high'||riskLevel==='transparency')&&!text(payload.loggingControl)) missing.push('logging_control');
  const reviewDueAt=text(payload.reviewDueAt);
  if(!reviewDueAt||Number.isNaN(Date.parse(reviewDueAt))) missing.push('review_due_at');
  const referenceNow=now?Date.parse(now):Date.now();
  if(reviewDueAt&&!Number.isNaN(Date.parse(reviewDueAt))&&!Number.isNaN(referenceNow)&&Date.parse(reviewDueAt)<referenceNow) missing.push('review_overdue');
  const uniqueMissing=[...new Set(missing)];
  const blocked=riskLevel==='unacceptable';
  const readiness=blocked?'BLOCKED':uniqueMissing.length?'INCOMPLETE':'EVIDENCED';
  return Object.freeze({id:record.id,subjectId:record.subjectId,systemName:text(payload.systemName),provider:text(payload.provider),model:text(payload.model),modelRevision:text(payload.modelRevision),purpose:text(payload.purpose),role:text(payload.role),riskLevel,classificationSource:text(payload.classificationSource),dataCategories:list(payload.dataCategories),humanOversight:Object.freeze({required:humanOversight.required===true,control:text(humanOversight.control)}),transparencyControl:text(payload.transparencyControl),loggingControl:text(payload.loggingControl),reviewDueAt,approved:payload.approved===true,approvalEvidenceIds:list(payload.approvalEvidenceIds),owner:text(record.owner)||'UNASSIGNED',evidenceIds,provenance:record.provenance||null,status:record.status||null,observedAt:record.observedAt||null,missing:uniqueMissing,readiness,productionAllowed:readiness==='EVIDENCED'});
}

export function projectAiGovernance(records=[],options={}){
  const latest=new Map();
  for(const record of Array.isArray(records)?records:[]){
    if(!record||(record.kind!=='governance'&&record.type!=='Governance')) continue;
    const key=record.subjectId||record.id;
    const current=latest.get(key);
    if(!current||timeOf(record)>timeOf(current)||(timeOf(record)===timeOf(current)&&String(record.id)>String(current.id))) latest.set(key,record);
  }
  const systems=[...latest.values()].map(record=>projectSystem(record,options)).sort((a,b)=>String(a.systemName||a.subjectId).localeCompare(String(b.systemName||b.subjectId)));
  return Object.freeze({schemaVersion:'brain-ai-governance.v1',systems,summary:Object.freeze({total:systems.length,evidenced:systems.filter(item=>item.readiness==='EVIDENCED').length,incomplete:systems.filter(item=>item.readiness==='INCOMPLETE').length,blocked:systems.filter(item=>item.readiness==='BLOCKED').length})});
}
