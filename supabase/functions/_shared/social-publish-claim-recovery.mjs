// Same-lineage recovery only. A consumed lease or ambiguous provider side effect is never retryable.
const present = (v) => typeof v === 'string' ? v.trim().length > 0 : v !== null && v !== undefined;
const positive = (v) => v === true || v === 'true';

function canRecoverExpiredOriginalLinkedInClaim({runDate, currentDate, decision, obligation, capabilities, reservations, nowMs}, channel) {
  const deny = (reason) => ({authorized:false, reason});
  if (runDate !== currentDate) return deny('SAME_DAY_ONLY');
  if (!decision || decision.channel !== channel || decision.decision !== 'publish'
      || decision.state !== 'blocked' || present(decision.delivery_ref)) return deny('NOT_ORIGINAL_BLOCKED_CLAIM');
  const d = decision.delivery_evidence || {};
  if (d.error !== 'PUBLICATION_AUTHORITY_DENIED:DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED')
    return deny('DIFFERENT_BLOCKER');
  const e = obligation?.evidence || {};
  if (!obligation || obligation.channel !== channel || obligation.status !== 'BLOCKED'
      || present(obligation.external_id) || present(obligation.live_proven_at)) return deny('OBLIGATION_MAY_HAVE_BEEN_SENT');
  if (['provider_create_success','provider_publication_ack_verified','possible_provider_side_effect','republish_forbidden','provider_truth_verified']
      .some(key => positive(d[key]) || positive(e[key]))) return deny('AMBIGUOUS_OR_CONFIRMED_PROVIDER_EFFECT');
  if (['provider_create_success','provider_publication_ack_verified','possible_provider_side_effect']
      .some(key => e[key] !== false)) return deny('MISSING_EXPLICIT_NO_SEND_EVIDENCE');
  if (present(d.provider_post_id) || present(e.provider_post_id) || present(d.provider_id) || present(e.provider_id))
    return deny('EXTERNAL_PROVIDER_IDENTIFIER_EXISTS');
  if (!Array.isArray(capabilities) || capabilities.length === 0) return deny('NO_EXPIRED_LEASE_TO_REPAIR');
  if (!Number.isFinite(nowMs) || capabilities.some(cap =>
       present(cap.consumed_at) || (!present(cap.revoked_at)
          && (!Number.isFinite(Date.parse(cap.expires_at)) || Date.parse(cap.expires_at) > nowMs))))
    return deny('CAPABILITY_ACTIVE_OR_CONSUMED');
  if (!Array.isArray(reservations) || reservations.length > 0) return deny('UNIQUENESS_CLAIM_EXISTS');
  return {authorized:true,reason:'EXPIRED_UNCONSUMED_LEASE_NO_PROVIDER_EFFECT'};
}


// Both LinkedIn identities use the identical same-day/no-provider-side-effect proof.
export function canRecoverExpiredCompanyClaim(input) {
  return canRecoverExpiredOriginalLinkedInClaim(input,'linkedin_company');
}
export function canRecoverExpiredPersonalClaim(input) {
  return canRecoverExpiredOriginalLinkedInClaim(input,'linkedin_personal');
}
