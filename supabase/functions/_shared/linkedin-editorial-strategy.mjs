 // Original LinkedIn strategy, shared by BRAIN and the existing Edge editor; never publication authority.
export function stableIndex(value,length){
  const text=String(value||'');
  let hash=0;
  for(const char of text)hash=(hash*31+char.charCodeAt(0))>>>0;
  return length?hash%length:0;
}

export function rotateEligible(eligible,recent,seed){
 const history=Array.isArray(recent)?recent.filter(x=>eligible.includes(x)).slice(0,6):[];
 const least=Math.min(...eligible.map(x=>history.filter(y=>x===y).length));
 const pool=eligible.filter(x=>history.filter(y=>x===y).length===least);
 const alternatives=pool.filter(x=>x!==history[0]);
 const choices=alternatives.length?alternatives:pool;
 return choices[stableIndex(seed,choices.length)];
}
// Explicit user-approved editorial pillars, separate from format and method.
// Candidate selection never asserts a source, provider capability or measured lift.
export const LINKEDIN_EDITORIAL_PILLARS=Object.freeze({
 linkedin_personal:Object.freeze(['persoonlijk_ondernemerschap','thought_leadership','kennisdeling','storytelling','vernieuwing','opinie','persoonlijke_reflectie','onderzoek']),
 linkedin_company:Object.freeze(['herkenning','educatie','product','onderzoek','bewijs','innovatie','conversie','kennisproducten'])
});
export const LINKEDIN_EDITORIAL_FORMATS=Object.freeze(['tekstpost','carrousel','infographic','video','onderzoek','artikel','checklist','magazine_document']);
export function selectLinkedInEditorialStrategy({channel,seed='',eligiblePillars=[],eligibleFormats=[],recentPillars=[],recentFormats=[],experimentModes=[]}={}){
 const catalog=LINKEDIN_EDITORIAL_PILLARS[channel];
 if(!catalog)return null;
 const allowed=(catalog,list)=>catalog.filter(x=>Array.isArray(list)&&list.includes(x));
 const history=(list,catalog)=>Array.isArray(list)?list.slice(0,6).filter(x=>catalog.includes(x)):[];
 const pillars=history(recentPillars,catalog),formats=history(recentFormats,LINKEDIN_EDITORIAL_FORMATS);
 const p=allowed(catalog,eligiblePillars),f=allowed(LINKEDIN_EDITORIAL_FORMATS,eligibleFormats);
 const modes=Array.isArray(experimentModes)?experimentModes.filter(x=>x==='EXPLORE'||x==='EXPLOIT').slice(0,30):[];
 const date=Date.parse(seed);
 const mode=modes.length?(modes.filter(x=>x==='EXPLORE').length/modes.length<.2?'EXPLORE':'EXPLOIT'):Number.isFinite(date)&&Math.floor(date/86400000)%5!==0?'EXPLOIT':'EXPLORE';
 return {channel,mode,explorationTarget:.2,modeBasis:modes.length?'RECORDED_EXPERIMENT_MODES':'PLANNED_CADENCE_NOT_OBSERVED',
  pillar:p.length?rotateEligible(p,pillars,seed+':pillar'):null,
  format:f.length?rotateEligible(f,formats,seed+':editorial-format'):null,
  pillarCandidates:[...catalog].sort((a,b)=>pillars.filter(x=>x===a).length-pillars.filter(x=>x===b).length),
  formatCandidates:[...LINKEDIN_EDITORIAL_FORMATS].sort((a,b)=>formats.filter(x=>x===a).length-formats.filter(x=>x===b).length),
  recentPillars:pillars,recentFormats:formats,experimentRule:'CHANGE_ONE_MEASURABLE_VARIABLE_PER_TEST',
  measurementWindowsHours:[24,48,72,168,720],decision:'SOURCE_AND_PROVIDER_ELIGIBILITY_REQUIRED',
  learningApplied:false,causalLiftProven:false,authorizesPublication:false};
}


const owners=Object.freeze({linkedin_personal:'canonical',linkedin_company:'bedrijfsgeheugen'});
const urn=x=>typeof x==='string'&&/^urn:li:(share|ugcPost):[0-9]+$/.test(x);
const instant=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):null;
const formatMap=Object.freeze({text_story:'tekstpost',text:'tekstpost',carousel:'carrousel',infographic:'infographic',video:'video',article:'artikel',document:'magazine_document',checklist:'checklist',research:'onderzoek'});
// Called only by the existing source owner. Exact publication proof is joined to
// the canonical obligation independently; merely published status is insufficient.
export function verifiedLinkedInEditorialHistory({channel,posts=[],obligations=[],at}={}){
 if(!Object.hasOwn(owners,channel)||instant(at)===null||!Array.isArray(posts)||!Array.isArray(obligations))return [];
 const now=instant(at), proofs=new Set(obligations.filter(o=>o?.tenant_id==='canonical'&&o.channel===channel&&urn(o.external_id)&&instant(o.live_proven_at)!==null&&instant(o.live_proven_at)<=now).map(o=>o.external_id));
 const rows=posts.filter(p=>p?.tenant_id===owners[channel]&&p.platform==='linkedin'&&p.channel_kind===channel&&urn(p.external_post_id)&&proofs.has(p.external_post_id)&&instant(p.published_at)!==null&&instant(p.published_at)<=now);
 const counts=new Map(); for(const row of rows)counts.set(row.external_post_id,(counts.get(row.external_post_id)||0)+1);
 return rows.filter(row=>counts.get(row.external_post_id)===1).sort((a,b)=>instant(b.published_at)-instant(a.published_at)).slice(0,6).map(row=>({providerPostId:row.external_post_id,pillar:LINKEDIN_EDITORIAL_PILLARS[channel].includes(row.content_pillar)?row.content_pillar:null,format:formatMap[row.format]||null}));
}
// Source eligibility is provided by the original editor after its own gates;
// this helper cannot validate a claim or create a send permission.
export function prepareOriginalLinkedInEditorialDecision({channel,runDate,source,posts,obligations,at,experimentOwner}={}){
 if(!Object.hasOwn(owners,channel))return null;
 const history=verifiedLinkedInEditorialHistory({channel,posts,obligations,at});
 const eligible=source?.verified===true&&typeof source.sourceId==='string'&&source.sourceId.trim()&&typeof source.sourceRevision==='string'&&source.sourceRevision.trim()&&source.channel===channel;
 const competing=experimentOwner!=='NO_NEW_EXPERIMENT';
 const selection=selectLinkedInEditorialStrategy({channel,seed:runDate,eligiblePillars:eligible&&!competing?source.eligiblePillars:[],eligibleFormats:eligible&&!competing?source.eligibleFormats:[],recentPillars:history.map(r=>r.pillar),recentFormats:history.map(r=>r.format)});
 return {contract:'ORIGINAL_LINKEDIN_EDITORIAL_DECISION-v1',channel,runDate,sourceId:eligible?source.sourceId:null,sourceRevision:eligible?source.sourceRevision:null,historyPostIds:history.map(r=>r.providerPostId),selection,existingExperimentOwner:experimentOwner||null,state:competing?'DEFER_TO_ORIGINAL_EXPERIMENT':!eligible?'SOURCE_ELIGIBILITY_REQUIRED':selection.pillar&&selection.format?'EDITORIAL_CANDIDATE':'ELIGIBLE_PILLAR_AND_FORMAT_REQUIRED',learningApplied:false,authorizesPublication:false};
}

/** Derive conservative editorial angles, not new factual claims. Existing source
 * owner must independently validate truth and current recommendation first. */
export function originalLinkedInSourceAngles({channel,verified,evidence={},founderPerspective=false,builder=false}={}){
 if(verified!==true)return [];
 if(channel==='linkedin_company')return ['herkenning','educatie'];
 if(channel!=='linkedin_personal')return [];
 if(founderPerspective===true||builder===true)return ['thought_leadership','kennisdeling','opinie'];
 if(evidence.personal_truth_verified===true&&evidence.arthur_anchor_verified===true&&evidence.first_person_claims_verified===true)return ['storytelling','persoonlijke_reflectie'];
 if(evidence.observational_personal_theme_verified===true&&evidence.public_theme_source_verified===true&&evidence.first_person_claims_present===false)return ['onderzoek','vernieuwing'];
 return [];
}
