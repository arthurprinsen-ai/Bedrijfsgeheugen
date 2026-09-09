function clampArray(value, maxItems) {
  return Array.isArray(value) ? value.slice(0, maxItems) : [];
}

export async function requireRuleContext(loader, { now = new Date(), maxItems = 25 } = {}) {
  if (typeof loader !== 'function') throw new TypeError('CONTENT_RULE_LOADER_REQUIRED');
  const snapshot = await loader();
  if (!snapshot || !snapshot.snapshot_id) throw new Error('CONTENT_RULE_CONTEXT_UNAVAILABLE');
  const expiresAt = snapshot.expires_at ? new Date(snapshot.expires_at) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= now) throw new Error('CONTENT_RULE_CONTEXT_STALE');
  return {
    snapshot_id: String(snapshot.snapshot_id),
    generated_at: snapshot.generated_at ?? null,
    expires_at: snapshot.expires_at,
    positive_rules: clampArray(snapshot.positive_rules, maxItems),
    avoid_rules: clampArray(snapshot.avoid_rules, maxItems),
    experiment_allocation: Number.isFinite(Number(snapshot.experiment_allocation)) ? Number(snapshot.experiment_allocation) : 0,
    winners: clampArray(snapshot.winners, maxItems),
    losers: clampArray(snapshot.losers, maxItems),
  };
}
