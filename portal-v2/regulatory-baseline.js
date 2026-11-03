const FRAMEWORK_ALIAS=Object.freeze({'AI ACT':'EU_AI_ACT','EU_AI_ACT':'EU_AI_ACT','NIS2':'NIS2_CBW','NIS':'NIS2_CBW','NIS2_CBW':'NIS2_CBW','GDPR':'GDPR_DATA','AVG':'GDPR_DATA','GDPR_DATA':'GDPR_DATA'});
const canon=value=>FRAMEWORK_ALIAS[String(value??'').trim().toUpperCase()]||String(value??'').trim().toUpperCase();
const MONITORED_FRAMEWORKS=new Set(['EU_AI_ACT','NIS2_CBW','GDPR_DATA']);
export function regulatoryFrameworkDigest(state,framework){
  const key=canon(framework);
  // Pre-2026-10-30 source-state includes HTTP202 hashes that are NOT legal texts.
  // Only original same-host verified HTTP200 documents may serve as review baselines.
  const rows=Object.values(state?.sources||{}).filter(item=>
    canon(item?.framework)===key &&
    Number(item?.httpStatus)===200 &&
    item?.sourceContentVerified!==false &&
    (!item?.verification || item.verification==='VERIFIED_HTTP_DOCUMENT') &&
    item?.contentSha256
  ).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  return rows.length?rows.map(item=>item.id+':'+item.contentSha256).join('|'):null;
}
export function applyRegulatoryBaselineToPortalControls(controls=[],state={}){
  return (controls||[]).map(control=>{
    const digest=regulatoryFrameworkDigest(state,control.framework);
    const hadAssurance=control.reviewed===true||control.approved===true;
    if(!digest){
      if(!MONITORED_FRAMEWORKS.has(canon(control.framework)))return {...control};
      const diagnostic={...control,currentRegulatoryBaselineDigest:null,
        regulatorySourceVerification:'UNVERIFIED'};
      if(!hadAssurance)return diagnostic;
      return {...diagnostic,regulatoryReviewRequired:true,reviewed:false,approved:false,
        why:'De officiële wettelijke bronbaseline is niet onafhankelijk geverifieerd (bijvoorbeeld HTTP 202). Eerder bewijs blijft bewaard, maar de goedkeuring moet worden herbeoordeeld.',
        nextStep:'Herstel de geverifieerde officiële brontoegang, controleer de daadwerkelijke wetstekst en leg de nieuwe baseline bij de review vast.'};
    }
    const recorded=control.regulatoryBaselineDigest||control.regulatoryBaseline||null;
    const stale=hadAssurance&&recorded!==digest;
    if(!stale)return {...control,currentRegulatoryBaselineDigest:digest};
    return {...control,currentRegulatoryBaselineDigest:digest,regulatoryReviewRequired:true,reviewed:false,approved:false,
      why:'De officiële wettelijke bronbaseline is gewijzigd sinds de laatste review. Bestaand bewijs blijft bewaard, maar de conclusie moet opnieuw worden beoordeeld.',
      nextStep:'Herbeoordeel deze control tegen de actuele officiële bronbaseline en leg de nieuwe baseline-digest bij de review vast.'};
  });
}
export async function loadRegulatorySourceState(fetcher=globalThis.fetch){
  if(typeof fetcher!=='function')return {sources:{}};
  try{const response=await fetcher('../data/regulatory-source-state.json',{cache:'no-store'});if(!response.ok)throw new Error('regulatory state '+response.status);return await response.json();}
  catch{return {sources:{}};}
}
