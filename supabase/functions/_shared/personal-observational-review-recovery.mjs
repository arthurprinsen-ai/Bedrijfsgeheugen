// Safe, bounded return from a pre-provider final reviewer 422 to the ORIGINAL
// daily content orchestrator, after editorial classifier source parity was fixed.
// This is NOT a publisher, a provider retry, or permission to bypass the reviewer.
export const PERSONAL_OBSERVATION_REVIEW_RECOVERY='original-personal-observation-review-rebootstrap-v1';
const clean=v=>typeof v==='string'?v.trim():'';
const flags=['provider_create_success','provider_publication_ack_verified',
 'provider_truth_verified','possible_provider_side_effect','republish_forbidden'];
const noEffect=v=>flags.every(f=>v?.[f]!==true);
// The original reviewer has two source-compatible 422 cases. These are
// NEVER permission to publish, only an opportunity for the same original
// editor to regenerate and return through every final-content gate.
const knownReviewCode=e=>{
 if(Number(e?.review_status)!==422||clean(e?.pre_publish_gate)!=='blocked'
   ||!Array.isArray(e?.violations))return null;
 const matching=e.violations.filter(v=>[
   'OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED',
   'FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED'
 ].includes(clean(v?.code)));
 // Do not recover compound or inconsistent errors through a narrow rule.
 return matching.length===1 && e.violations.length===1 ? clean(matching[0].code):null;
};
const userFactSource=e=>{
 const i=e?.identity_gate_evidence||{};
 return i.source_kind==='verified_personal_source'
   && i.personal_truth_verified===true
   && i.first_person_claims_verified===true
   && i.personal_life_topic===true
   && i.business_topic===false
   && i.corporate_voice===false
   && i.source_not_consumed_verified===true
   && clean(i.source_text).length>=70
   &&Array.isArray(i.source_lineage)
   &&i.source_lineage.some(x=>/^chat-history:user-fact:|^current-chat:user-fact:/.test(clean(x)));
};
export function planPersonalObservationalReviewRecovery({decision,obligation,consumedCapability=false,maxAttempts=3}={}){
 const d=decision?.delivery_evidence||{},o=obligation?.evidence||{};
 const source=clean(d.personal_source_recommendation_id);
 const attempts=Number(obligation?.recovery_attempts);
 const code=knownReviewCode(d);
 const exactlyRejected=decision?.channel==='linkedin_personal'
   &&decision?.decision==='publish'&&decision?.state==='blocked'
   &&obligation?.channel==='linkedin_personal'&&obligation?.status==='BLOCKED'
   &&!!code&&code===knownReviewCode(o)
   &&(code!=='FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED'
      ||(userFactSource(d)&&userFactSource(o)));
 const sourceMatched=!!source&&source===clean(o.personal_source_recommendation_id)
   &&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(source)
   &&/^[0-9a-f]{64}$/i.test(clean(d.reviewed_text_hash))
   &&clean(d.reviewed_text_hash)===clean(o.reviewed_text_hash);
 const unsent=!clean(decision?.delivery_ref)&&!clean(obligation?.external_id)
   &&!obligation?.published_at&&!obligation?.live_proven_at
   &&!consumedCapability&&noEffect(d)&&noEffect(o);
 const bounded=Number.isInteger(maxAttempts)&&maxAttempts>0&&maxAttempts<=3
   &&Number.isInteger(attempts)&&attempts>=0&&attempts<maxAttempts;
 const eligible=exactlyRejected&&sourceMatched&&unsent&&bounded;
 return Object.freeze({contract:PERSONAL_OBSERVATION_REVIEW_RECOVERY,eligible,
  reason:!exactlyRejected?'NOT_EXACT_OBSERVATIONAL_FINAL_REVIEW'
    :!sourceMatched?'SOURCE_OR_FINAL_TEXT_IDENTITY_MISMATCH'
    :!unsent?'POSSIBLE_PROVIDER_EFFECT_OR_AUTHORITY_USED'
    :!bounded?'REVIEW_RETRY_BUDGET_EXHAUSTED'
    :'REBOOTSTRAP_ORIGINAL_SOURCE_LOCKED_FINAL_REVIEW',
  source_recommendation_id:source||null,recovery_attempts:Number.isInteger(attempts)?attempts:null,
  max_attempts:maxAttempts});
}
