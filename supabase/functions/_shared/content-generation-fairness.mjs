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
  // Provider billing errors cannot be resolved by re-polling every five minutes.
  const billing = /credit balance is too low|organization_delinquent|billing|payment required|insufficient.quota/i.test(text);
  const seconds = billing ? 2 * 60 * 60 : 20 * 60;
  return {
    reason: text.slice(0, 240),
    classification: billing ? 'PROVIDER_BILLING' : 'GENERATION_OR_EDITORIAL_RETRY',
    attempts: Math.min(10000, Math.max(0, Number(previousAttempts) || 0) + 1),
    last_failed_at: new Date(nowMs).toISOString(),
    retry_after: new Date(nowMs + seconds * 1000).toISOString(),
    provider_side_effect: false
  };
}
