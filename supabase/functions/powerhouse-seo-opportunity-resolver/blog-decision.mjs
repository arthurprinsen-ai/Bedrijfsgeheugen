// Public-safe, deterministic SEO intent admission. No draft text, providers, or writes.
const norm = value => String(value ?? '').toLocaleLowerCase('nl-NL')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const words = value => new Set(norm(value).split(' ').filter(x => x.length >= 3));
const overlap = (a, b) => {
  const left = words(a), right = words(b);
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const x of left) if (right.has(x)) hits++;
  return hits / Math.max(left.size, right.size);
};
const BRAND_FAMILIES = ['twinfield', 'afas', 'exact online', 'power bi', 'microsoft 365'];
const AGE_LIMIT_MS = 14 * 86400000;
const sourceAge = (at, now) => {
  const value = Date.parse(String(at || ''));
  return Number.isFinite(value) ? now - value : Infinity;
};
const result = (action, reason, owner = null) =>
  Object.freeze({ action, reason, canonical_owner: owner?.route ?? null, public_release_authorized: false });

export function decideSeoBlogCandidate({
  keyword, existingOwner = null, pages = [], blogSlugs = [], search = null,
  forecast = null, market = {}, score = 0,
  asOf = new Date().toISOString()
} = {}) {
  const query = norm(keyword);
  const now = Date.parse(asOf);
  if (!query || !Number.isFinite(now))
    return result('NO_ACTION_EVIDENCE_INSUFFICIENT', 'INVALID_QUERY_OR_DATE');
  if (existingOwner)
    return result('UPDATE_MONEY_PAGE', 'CANONICAL_INTENT_OWNER', existingOwner);

  // Brand shortcuts may not create competing articles while a broader money
  // page owns the provider integration. Do not alter the canonical owner map.
  const brand = BRAND_FAMILIES.find(v => query === v || query.startsWith(v + ' ') || query.endsWith(' ' + v));
  if (brand) {
    const owned = pages.find(p => ['money', 'pillar'].includes(p?.role) &&
      [p.primary_keyword, ...(p.secondary_keywords || [])].some(v =>
        norm(v).includes(brand)));
    if (owned) return result('UPDATE_MONEY_PAGE', 'BRAND_FAMILY_CANONICAL_OWNER', owned);
  }

  // The canonical private publication registry is an exclusion set only.
  // Do not copy a slug or unapproved article into public evidence.
  if (blogSlugs.some(slug => overlap(query, slug) >= 0.5))
    return result('NO_ACTION_EVIDENCE_INSUFFICIENT', 'EXISTING_OR_PENDING_BLOG_INTENT');

  const age = sourceAge(market.observed_at, now);
  if (age < 0 || age > AGE_LIMIT_MS)
    return result('NO_ACTION_EVIDENCE_INSUFFICIENT', 'DATAFORSEO_MISSING_OR_STALE');

  const highValue = Number(market.search_volume) >= 20 &&
    Number(market.cpc) >= 2 &&
    Number(score) >= 68;
  if (!highValue)
    return result('NO_ACTION_EVIDENCE_INSUFFICIENT', 'COMMERCIAL_EVIDENCE_WEAK');

  // A DataForSEO keyword may be high volume yet completely unrelated to the
  // product. Either first-party search evidence or a dated, trusted external
  // signal must independently support a service-related query.
  const serviceSimilarity = Math.max(0, ...pages.flatMap(p =>
    [p.primary_keyword, ...(p.secondary_keywords || [])].map(v => overlap(query, v))));
  const external = Array.isArray(forecast?.external_sources) ? forecast.external_sources : [];
  const corroborated = external.some(s =>
    s?.allowed === true && Number(s.trust) >= 0.6 &&
    sourceAge(s.published_at, now) >= 0 &&
    sourceAge(s.published_at, now) <= 60 * 86400000 &&
    overlap(query, String(s.topic || '') + ' ' + String(s.title || '')) >= 0.5);
  const observedOwnDemand = Number(search?.impressions) >= 3;
  if (serviceSimilarity < 0.34 ||
      (!observedOwnDemand && !corroborated))
    return result('NO_ACTION_EVIDENCE_INSUFFICIENT', 'INTENT_OR_SOURCE_UNVERIFIED');

  // This is admission for a PRIVATE candidate, never publication approval.
  // Existing publisher and P0 last-mile egress/CI/Netlify gates still apply.
  return result('CREATE_INTENT_GAP_CONTENT', 'UNOWNED_CORROBORATED_COMMERCIAL_INTENT');
}
