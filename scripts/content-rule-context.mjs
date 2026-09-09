#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { requireRuleContext } from '../lib/content-learning/rule-preflight.mjs';
import policy from '../config/content-growth-policy.json' with { type: 'json' };

const url = String(process.env.CONTENT_LEARNING_URL || 'https://www.bedrijfsgeheugen.nl/api/content-learning').trim();
const timeoutMs = Math.max(1000, Math.min(15000, Number(process.env.CONTENT_RULE_TIMEOUT_MS || 5000)));
const maxAgeHours = Math.max(1, Math.min(96, Number(process.env.CONTENT_RULE_MAX_AGE_HOURS || 24)));

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function compactRule(entry, kind) {
  const contentId = String(entry?.content_id || '').trim();
  if (!contentId) return null;
  const score = number(entry?.score, 0);
  const diagnosis = String(entry?.diagnosis || '').trim();
  if (kind === 'avoid') {
    return {
      id: `avoid:${contentId}:${diagnosis || 'underperforming'}`,
      subject: contentId,
      rule: `Vermijd het herhalen van dit patroon zonder nieuwe hypothese: ${diagnosis || 'onderpresterend patroon'}.`,
      confidence: Math.max(0, Math.min(1, number(entry?.support, 0) / 20)),
      evidence_count: number(entry?.support, 0),
    };
  }
  return {
    id: `prefer:${contentId}`,
    subject: contentId,
    rule: 'Gebruik aantoonbaar werkende inhoudspatronen als richting; kopieer nooit letterlijk en behoud contextuele relevantie.',
    confidence: Math.max(0, Math.min(1, Math.abs(score) / 100)),
    evidence_count: number(entry?.support, 0),
    score,
  };
}

export function snapshotFromLearning(learning, { now = new Date() } = {}) {
  const generatedAt = new Date(String(learning?.generated_at || ''));
  if (Number.isNaN(generatedAt.getTime())) throw new Error('CONTENT_RULE_CONTEXT_UNAVAILABLE');
  const ageMs = now.getTime() - generatedAt.getTime();
  const maxAgeMs = maxAgeHours * 3600000;
  if (ageMs < -300000 || ageMs > maxAgeMs) throw new Error('CONTENT_RULE_CONTEXT_STALE');

  const winners = Array.isArray(learning?.exploit_candidates) ? learning.exploit_candidates.slice(0, 10) : [];
  const losers = Array.isArray(learning?.failure_diagnoses) ? learning.failure_diagnoses.slice(0, 10) : [];
  const positiveRules = winners.map((entry) => compactRule(entry, 'prefer')).filter(Boolean);
  const avoidRules = losers.map((entry) => compactRule(entry, 'avoid')).filter(Boolean);
  if (!positiveRules.length && !avoidRules.length) throw new Error('CONTENT_RULE_CONTEXT_UNAVAILABLE');

  const source = JSON.stringify({ generated_at: learning.generated_at, winners, losers });
  const digest = createHash('sha256').update(source).digest('hex').slice(0, 20);
  return {
    snapshot_id: `content-learning:${digest}`,
    generated_at: generatedAt.toISOString(),
    expires_at: new Date(generatedAt.getTime() + maxAgeMs).toISOString(),
    positive_rules: positiveRules,
    avoid_rules: avoidRules,
    experiment_allocation: number(policy.explorationRatio, 0.2),
    winners,
    losers,
  };
}

export async function loadContentRuleContext({ fetchImpl = fetch, now = new Date() } = {}) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`CONTENT_RULE_CONTEXT_SOURCE_FAILED:${response.status}`);
  const learning = await response.json();
  return requireRuleContext(async () => snapshotFromLearning(learning, { now }), { now });
}

async function main() {
  const context = await loadContentRuleContext();
  const serialized = JSON.stringify(context);
  if (process.env.GITHUB_OUTPUT) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.GITHUB_OUTPUT, `context<<CONTENT_RULE_CONTEXT_JSON\n${serialized}\nCONTENT_RULE_CONTEXT_JSON\n`);
  }
  process.stdout.write(`${serialized}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(String(error?.message || error));
    process.exit(1);
  });
}
