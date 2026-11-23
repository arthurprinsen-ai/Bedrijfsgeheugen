// Deterministic fairness contract: a failed content generation may not starve other
// approved publication channels. This never grants delivery permission or loosens gates.
export function selectNextContentChannel(rows, nowMs = Date.now()) {
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => {
    const retryAfter = Date.parse(String(row?.delivery_evidence?.generation_retry_after || ''));
    return !Number.isFinite(retryAfter) || retryAfter <= nowMs;
  }) || null;
}

export function contentGenerationCooldown(reason, nowMs = Date.now(), previousAttempts = 0) {
  const text = String(reason || '');
  // P0 #5232: insufficient_quota is a provider-account / billing boundary,
  // not a transient rate limit. Escalate promptly while keeping the original
  // executor and all other channels alive. Never retry the same unchanged
  // external billing failure every two hours indefinitely.
  // Existing same-lane generation_retry_after is the exclusive cooldown gate:
  // first failure 2h, next 4h, then 8h, capped at 12h. A subsequent natural
  // run will retry after the cap, so approved credit repair can self-recover
  // without a second scheduler or an unsafe grant/bypass.
  const billing = /credit balance is too low|organization_delinquent|billing|payment required|insufficient.quota/i.test(text);
  const attempts = Math.min(10000, Math.max(0, Number(previousAttempts) || 0) + 1);
  const cooldownMs = billing
    ? Math.min(12 * 60 * 60 * 1000, 2 * 60 * 60 * 1000 * (2 ** Math.min(3, attempts - 1)))
    : 20 * 60 * 1000;
  return {
    reason: text.slice(0, 240),
    classification: billing ? 'PROVIDER_BILLING' : 'GENERATION_OR_EDITORIAL_RETRY',
    attempts,
    last_failed_at: new Date(nowMs).toISOString(),
    retry_after: new Date(nowMs + cooldownMs).toISOString(),
    provider_side_effect: false,
    requires_authorization: billing,
    recovery_action: billing ? 'RESTORE_APPROVED_PROVIDER_QUOTA_OR_PROVE_ACTIVE_APPROVED_FALLBACK' : 'RETRY_ORIGINAL_CHANNEL_AFTER_COOLDOWN'
  };
}
