import { deriveOrganismEffects } from '../organism/organism-graph.mjs';

const FRAMEWORK_START = Object.freeze({
  EU_AI_ACT: Object.freeze(['compliance.eu_ai_act','ai.inventory']),
  NIS2_CBW: Object.freeze(['compliance.nis2_cbw','security.risk','suppliers']),
  GDPR_DATA: Object.freeze(['compliance.gdpr','data.inventory'])
});

const clean=value=>String(value??'').trim().toUpperCase();

export function startNodesForFramework(framework){
  return FRAMEWORK_START[clean(framework)] || Object.freeze(['regulatory.scope']);
}

export function deriveRegulatoryChangeImpact({sourceId,framework,previousSha256,currentSha256,observedAt=new Date().toISOString()}={}){
  const changed=Boolean(currentSha256 && previousSha256 && currentSha256!==previousSha256);
  const firstObservation=Boolean(currentSha256 && !previousSha256);
  const organism=deriveOrganismEffects({}, {startNodes:startNodesForFramework(framework)});
  return Object.freeze({
    contract:'powerhouse-regulatory-change-impact-v1',
    sourceId:String(sourceId||'unknown'),
    framework:clean(framework)||'UNKNOWN',
    observedAt,
    previousSha256:previousSha256||null,
    currentSha256:currentSha256||null,
    changed,
    firstObservation,
    reviewRequired:changed,
    organism: changed ? organism : null
  });
}

export function applyRegulatoryChangesToControls(controls=[], changes=[]){
  const latest=new Map();
  for(const change of changes||[]){
    if(!change?.changed)continue;
    const framework=clean(change.framework);
    const at=new Date(change.observedAt||0);
    if(Number.isNaN(at.getTime()))continue;
    const previous=latest.get(framework);
    if(!previous || at>previous)latest.set(framework,at);
  }
  return (controls||[]).map(control=>{
    const framework=clean(control.framework);
    const changedAt=latest.get(framework);
    if(!changedAt)return {...control};
    const existing=control.regulatoryChangedAt ? new Date(control.regulatoryChangedAt) : null;
    const strongest=existing&&!Number.isNaN(existing.getTime())&&existing>changedAt?existing:changedAt;
    return {...control,regulatoryChangedAt:strongest.toISOString(),regulatoryReviewRequired:true};
  });
}
