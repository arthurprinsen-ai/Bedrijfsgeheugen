function byScoreDesc(a, b) {
  return (b.score || 0) - (a.score || 0) || String(a.content_id).localeCompare(String(b.content_id));
}

function diagnose(bucket) {
  const e = bucket.events || {};
  if ((e.reach || 0) + (e.engagement || 0) >= 10 && (e.click || 0) === 0) return 'high_reach_low_click';
  if ((e.click || 0) >= 3 && (e.lead || 0) + (e.qualified_lead || 0) === 0) return 'high_click_low_conversion';
  if ((e.lead || 0) + (e.qualified_lead || 0) >= 2 && (e.order || 0) === 0) return 'leads_no_orders';
  if ((e.order || 0) > 0 || (bucket.orders || 0) > 0) return 'commercial_win';
  return null;
}

function tokens(value) {
  return new Set(String(value || '').toLowerCase().replace(/^blog:/, '').split(/[^a-z0-9]+/).filter((x) => x.length >= 3));
}

function topicSimilarity(candidate, learned) {
  const a=tokens([candidate.slug,candidate.keyword,candidate.title].filter(Boolean).join(' '));
  const b=tokens(learned.content_id);
  if(!a.size||!b.size)return 0;
  let overlap=0;for(const t of a)if(b.has(t))overlap+=1;
  return overlap/Math.max(a.size,b.size);
}

function transferredScore(candidate, learning) {
  const exact=Number(learning?.candidate_scores?.[candidate.content_id]);
  if(Number.isFinite(exact))return exact;
  let best=0;
  for(const learned of learning?.exploit_candidates||[]){
    const similarity=topicSimilarity(candidate,learned);
    if(similarity<=0)continue;
    best=Math.max(best,similarity*Number(learned.score||0));
  }
  return best+Number(candidate.score||0);
}

export function buildLearningContext({ performance, now = new Date(), policy = {} }) {
  const entries = Object.values(performance?.content || {}).map((bucket) => ({
    content_id: bucket.content_id,
    content_type: bucket.content_type,
    score: Number(bucket.score || 0),
    revenue: Number(bucket.revenue || 0),
    orders: Number(bucket.orders || 0),
    support: Object.values(bucket.events || {}).reduce((a, b) => a + Number(b || 0), 0),
    diagnosis: diagnose(bucket)
  })).sort(byScoreDesc);

  const minimumSupport = Number(policy.minimumSupport ?? 3);
  const proven = entries.filter((e) => e.support >= minimumSupport || e.orders > 0 || e.revenue > 0);
  const candidate_scores = Object.fromEntries(entries.map((e) => [e.content_id, e.score]));
  const failures = entries.filter((e) => e.diagnosis && e.diagnosis !== 'commercial_win');

  return {
    version: 1,
    generated_at: now.toISOString(),
    source_window: 'all_available_bounded_events',
    horizons_days: policy.horizonsDays || [1, 3, 7, 30],
    commercial_totals: performance?.commercialTotals || { orders: 0, revenue: 0, currency: policy.revenueCurrency || 'EUR' },
    candidate_scores,
    exploit_candidates: proven.slice(0, 10),
    exploration_hypotheses: failures.slice(0, 5).map((e) => ({ content_id: e.content_id, diagnosis: e.diagnosis })),
    failure_diagnoses: failures,
    confidence: {
      minimum_support: minimumSupport,
      proven_items: proven.length,
      observed_items: entries.length
    }
  };
}

export function explorationForDate(date, policy = {}) {
  const ratio = Number(policy.explorationRatio ?? 0.2);
  if (ratio <= 0) return false;
  const target = Math.max(1, Math.round(1 / ratio));
  const day = Number(String(date).slice(-2));
  return Number.isFinite(day) && day % target === 0;
}

export function rankCandidates({ candidates = [], learning = {}, policy = {}, date }) {
  const explore = explorationForDate(date, policy);
  return candidates.map((c) => ({ ...c, score: transferredScore(c,learning) }))
    .sort((a, b) => {
      if (explore && Boolean(a.exploration) !== Boolean(b.exploration)) return a.exploration ? -1 : 1;
      if (!explore && Boolean(a.exploration) !== Boolean(b.exploration)) return a.exploration ? 1 : -1;
      return (b.score || 0) - (a.score || 0) || String(a.content_id).localeCompare(String(b.content_id));
    });
}
