// Bounded source rotation for the ORIGINAL company editorial owner after a
// deterministic pre-provider 422. No second publisher or approval authority.
export const COMPANY_REGENERATION_CONTRACT='original-company-first-time-right-recovery-v1';
const clean=value=>typeof value==='string'?value.trim():'';
const protectedFlags=['provider_create_success','provider_publication_ack_verified',
 'provider_truth_verified','possible_provider_side_effect','republish_forbidden'];
const protectedState=evidence=>protectedFlags.some(flag=>evidence?.[flag]===true);
const validSource=(row,nowMs)=>{
 const source=row?.evidence||{};
 const url=clean(source.source_url),observed=Date.parse(clean(source.source_observed_at));
 let parsed;try{parsed=new URL(url);}catch{return false;}
 return source.source_backed===true
   &&parsed.protocol==='https:'&&!parsed.username&&!parsed.password
   &&Number.isFinite(observed)&&observed<=nowMs
   &&nowMs-observed<=14*86400000
   &&['suggested','accepted'].includes(clean(row?.status))
   &&['linkedin_company','cross-channel'].includes(clean(row?.target_channel));
};
export function planRejectedCompanyRegeneration({
 decision,obligation,recommendations=[],consumedCapability=false,
 now=new Date().toISOString(),maxCandidates=3
}={}){
 const rejected=[
  ...(Array.isArray(decision?.delivery_evidence?.rejected_recommendation_ids)
   ?decision.delivery_evidence.rejected_recommendation_ids:[]),
  ...(Array.isArray(obligation?.evidence?.rejected_recommendation_ids)
   ?obligation.evidence.rejected_recommendation_ids:[])
 ].map(clean).filter(Boolean);
 const sourceId=clean(decision?.delivery_evidence?.fallback_recommendation_id);
 const excluded=[...new Set([...rejected,sourceId].filter(Boolean))];
 const evidence=decision?.delivery_evidence||{},oe=obligation?.evidence||{};
 const hasExactRejection=Number(evidence.review_status)===422
   &&Array.isArray(evidence.violations)
   &&evidence.violations.some(v=>v?.code==='COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT');
 const unsent=decision?.channel==='linkedin_company'
   &&decision?.decision==='publish'&&decision?.state==='blocked'
   &&!clean(decision?.delivery_ref)
   &&obligation?.channel==='linkedin_company'
   &&obligation?.status==='BLOCKED'&&!clean(obligation?.external_id)
   &&!obligation?.published_at&&!obligation?.live_proven_at
   &&!consumedCapability&&!protectedState(evidence)&&!protectedState(oe)
   &&evidence.publication_authority?.consumed!==true
   &&oe.publication_authority?.consumed!==true
   &&evidence.capability_state!=='BLOCKED_HARD_BOUNDARY';
 const timestamp=Date.parse(now);
 const safe=hasExactRejection&&unsent&&Number.isFinite(timestamp)
   &&Array.isArray(recommendations)&&Number.isInteger(maxCandidates)
   &&maxCandidates>0&&excluded.length<maxCandidates;
 const alternative=safe?recommendations
   .filter(r=>validSource(r,timestamp)
     &&!excluded.includes(clean(r?.recommendation_id)))
   .sort((a,b)=>Number(b.priority||0)-Number(a.priority||0))
   .find(r=>Boolean(clean(r?.recommendation_id)))||null:null;
 return Object.freeze({
  contract:COMPANY_REGENERATION_CONTRACT,eligible:!!alternative,
  reason:!hasExactRejection?'NOT_EXACT_EDITORIAL_REJECTION'
   :!unsent?'PROVIDER_SIDE_EFFECT_OR_AUTHORITY_UNCERTAIN'
   :!safe?'RETRY_BUDGET_OR_SOURCE_UNVERIFIED'
   :!alternative?'NO_NEW_VERIFIED_SOURCE':'NEW_VERIFIED_SOURCE_AVAILABLE',
  rejectedRecommendationIds:excluded,
  selectedAlternativeRecommendationId:alternative?clean(alternative.recommendation_id):null,
  failureCode:'COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT',
  maxCandidates
 });
}
