import crypto from 'node:crypto';

export function businessDate(now = new Date(), timeZone = 'Europe/Amsterdam') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function stableTieBreaker(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function usedContentIds(ledger) {
  return new Set(Object.values(ledger?.days || {}).map((r) => r?.content_id).filter(Boolean));
}

function usedSlugs(ledger) {
  return new Set(Object.values(ledger?.days || {}).map((r) => r?.slug).filter(Boolean));
}

export function resolveDailyPublication({ date, ledger, candidates = [], learning = {}, policy = {} }) {
  if (!date) throw new Error('date is required');
  if (!ledger || typeof ledger !== 'object' || !ledger.days || typeof ledger.days !== 'object') {
    throw new Error('valid ledger is required');
  }

  const existing = ledger.days[date];
  if (existing?.state === 'live') {
    return { type: 'NO_ACTION_LIVE', record: existing };
  }
  if (existing) {
    return { type: 'RESUME_EXISTING', record: existing };
  }

  const usedIds = usedContentIds(ledger);
  const usedSlugsSet = usedSlugs(ledger);
  const candidateScores = learning?.candidate_scores || {};
  const eligible = candidates
    .filter((c) => c && c.eligible !== false && c.slug && c.content_id)
    .filter((c) => !usedIds.has(c.content_id) && !usedSlugsSet.has(c.slug))
    .map((c) => ({
      ...c,
      score: Number(candidateScores[c.content_id] ?? c.score ?? 0),
      tie: stableTieBreaker(c.content_id)
    }))
    .sort((a, b) => b.score - a.score || a.tie.localeCompare(b.tie));

  if (!eligible.length) return { type: 'NO_ELIGIBLE_DAILY_BLOG', date };

  const explorationRatio = Number(policy.explorationRatio ?? 0.2);
  const explore = Boolean(learning?.explore_today) && explorationRatio > 0;
  const pool = explore ? eligible.filter((c) => c.exploration === true) : eligible.filter((c) => c.exploration !== true);
  const selected = (pool.length ? pool : eligible)[0];

  return {
    type: 'SELECT_CANDIDATE',
    date,
    candidate: selected,
    record: {
      date,
      content_id: selected.content_id,
      slug: selected.slug,
      state: 'selected',
      selected_at: new Date().toISOString()
    }
  };
}

const ALLOWED_TRANSITIONS = {
  selected: new Set(['candidate']),
  candidate: new Set(['merged']),
  merged: new Set(['live']),
  live: new Set([])
};

export function transitionLedger(record, event) {
  if (!record?.state) throw new Error('record state is required');
  if (!event?.state) throw new Error('event state is required');
  if (record.state === event.state) return { ...record, ...event };
  if (!ALLOWED_TRANSITIONS[record.state]?.has(event.state)) {
    throw new Error(`invalid publication transition ${record.state}->${event.state}`);
  }
  return { ...record, ...event };
}
