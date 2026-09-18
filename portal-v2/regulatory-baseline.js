const FRAMEWORK_ALIAS=Object.freeze({'AI ACT':'EU_AI_ACT','EU_AI_ACT':'EU_AI_ACT','NIS2':'NIS2_CBW','NIS':'NIS2_CBW','NIS2_CBW':'NIS2_CBW','GDPR':'GDPR_DATA','AVG':'GDPR_DATA','GDPR_DATA':'GDPR_DATA'});
const canon=value=>FRAMEWORK_ALIAS[String(value??'').trim().toUpperCase()]||String(value??'').trim().toUpperCase();
export function regulatoryFrameworkDigest(state,framework){
  const key=canon(framework);
  const rows=Object.values(state?.sources||{}).filter(item=>canon(item?.framework)===key&&item?.contentSha256).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  return rows.length?rows.map(item=>item.id+':'+item.contentSha256).join('|'):null;
}
export function applyRegulatoryBaselineToPortalControls(controls=[],state={}){
  return (controls||[]).map(control=>{
    const digest=regulatoryFrameworkDigest(state,control.framework);
    if(!digest)return {...control};
    const recorded=control.regulatoryBaselineDigest||control.regulatoryBaseline||null;
    const hadAssurance=control.reviewed===true||control.approved===true;
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
