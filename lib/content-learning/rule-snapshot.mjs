import { createHash } from 'node:crypto';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const text = value => String(value ?? '').trim();

export function buildRuleSnapshot(rows = [], { now = new Date(), maxAgeHours = 96, maxRules = 12 } = {}) {
  const normalized = (Array.isArray(rows) ? rows : []).map(row => ({
    id: text(row.regel_id || row.id),
    subject: text(row.onderwerp || row.subject),
    rule: text(row.regel || row.rule),
    confidence: clamp(Number(row.vertrouwen ?? row.confidence ?? 0) || 0, 0, 1),
    status: text(row.status).toLowerCase(),
    updated_at: text(row.bijgewerkt_op || row.updated_at),
  })).filter(row => row.id && row.rule && row.updated_at);

  const active = normalized.filter(row => row.status === 'actief').sort((a,b) => b.confidence - a.confidence).slice(0, maxRules);
  if (!active.length) throw new Error('CONTENT_RULE_CONTEXT_UNAVAILABLE');

  const timestamps = active.map(row => Date.parse(row.updated_at)).filter(Number.isFinite);
  if (timestamps.length !== active.length) throw new Error('CONTENT_RULE_CONTEXT_UNAVAILABLE');
  const newest = Math.max(...timestamps);
  const oldest = Math.min(...timestamps);
  const maxAgeMs = Number(maxAgeHours) * 3600000;
  if (!Number.isFinite(maxAgeMs) || now.getTime() - newest > maxAgeMs) throw new Error('CONTENT_RULE_CONTEXT_STALE');

  const evidenceGaps = normalized.filter(row => row.status !== 'actief').slice(0, maxRules).map(({id,subject,rule,status,confidence,updated_at}) => ({id,subject,rule,status,confidence,updated_at}));
  const positiveRules = active.map(({id,subject,rule,confidence,updated_at}) => ({id,subject,rule,confidence,updated_at}));
  const source = JSON.stringify({positiveRules,evidenceGaps,newest,oldest});
  const digest = createHash('sha256').update(source).digest('hex').slice(0, 20);
  const expiresAt = new Date(newest + maxAgeMs).toISOString();

  return {
    snapshot_id: `brain-rules:${digest}`,
    generated_at: now.toISOString(),
    source_updated_at: new Date(newest).toISOString(),
    expires_at: expiresAt,
    positive_rules: positiveRules,
    avoid_rules: [],
    evidence_gaps: evidenceGaps,
    policy: 'active_rules_are_directives_non_active_rules_are_context_only',
  };
}
