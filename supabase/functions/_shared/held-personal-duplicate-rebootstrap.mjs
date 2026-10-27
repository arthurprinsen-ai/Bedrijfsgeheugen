const clean = value => String(value ?? '').trim();

// A rejected personal story may be retried by the EXISTING content orchestrator
// only when the original provider-bound operation is proved to have had NO
// side effect, and there is an evidence-backed alternative worth selecting.
// This never approves a post, generates a new fictional experience or bypasses
// the independent provider/identity/semantic-uniqueness prepublish gates.
export function shouldRebootstrapHeldPersonalDuplicate(decision,obligation,recommendations=[],runDate='') {
  if(clean(decision?.channel)!=='linkedin_personal' ||
      clean(decision?.state)!=='blocked' || clean(decision?.decision)!=='hold' ||
      clean(decision?.delivery_ref) ||
      clean(obligation?.channel)!=='linkedin_personal' ||
      clean(obligation?.status)!=='BLOCKED' ||
      clean(obligation?.external_id)) return false;
  const reason=clean(obligation?.last_error);
  const oe=obligation?.evidence || {},de=decision?.delivery_evidence || {};
  if(!reason.startsWith('GLOBAL_POST_DUPLICATE_BLOCKED:') ||
     oe.global_uniqueness_gate!=='blocked' ||
     oe.publication_authority?.issued!==true ||
     oe.publication_authority?.consumed!==false) return false;
  for(const e of [oe,de]){
    if(e.possible_provider_side_effect===true ||
       e.provider_create_success===true ||
       e.provider_publication_ack_verified===true ||
       e.provider_truth_verified===true ||
       e.republish_forbidden===true) return false;
  }
  const rejected=new Set([
    ...(Array.isArray(oe.rejected_recommendation_ids)?oe.rejected_recommendation_ids:[]),
    ...(Array.isArray(de.rejected_recommendation_ids)?de.rejected_recommendation_ids:[]),
    oe.personal_source_recommendation_id,oe.fallback_recommendation_id,
    de.personal_source_recommendation_id,de.fallback_recommendation_id
  ].map(clean).filter(Boolean));
  const eligible=(Array.isArray(recommendations)?recommendations:[])
    .filter(r=>['suggested','accepted'].includes(clean(r?.status)));
  // If there are viable alternatives, choose them using the EXISTING publisher
  // with the daily one-time capability, never a new external sender.
  if(eligible.some(r=>clean(r.recommendation_id)&&!rejected.has(clean(r.recommendation_id)))) return true;
  // First failure: allow the existing orchestrator to seed its bounded,
  // idempotent source reserve once. When all reserved stories are exhausted,
  // stop replaying rather than looping on the same known-duplicate content.
  const reserve=eligible.some(r=>clean(r.dedupe_key).startsWith('founder-proof-reserve:'+runDate+':'));
  const n=Number(obligation?.recovery_attempts ?? 0);
  return !reserve && Number.isFinite(n) && n>=0 && n<3;
}
