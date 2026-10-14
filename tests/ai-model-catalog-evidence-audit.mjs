#!/usr/bin/env node
// Evidence-first catalog audit: URL reachability is NOT a verification of model claims.
// Usage: node tests/ai-model-catalog-evidence-audit.mjs [output-file]
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const catalog = JSON.parse(await fs.readFile('data/ai-model-catalog-v1.json', 'utf8'));
const now = new Date();
const maxAgeDays = 14;
const requiredClaims = ['model_id','status','pricing','capabilities','deployment','governance'];
function hasFullEvidence(m) {
  const e=m.verification_evidence;
  if (!e || e.claim_scope !== 'full' || e.source_url !== m.source || e.checked_on !== m.verified_at) return false;
  if (!Array.isArray(e.verified_claims) || requiredClaims.some(claim => !e.verified_claims.includes(claim))) return false;
  if (Array.isArray(e.not_verified) && e.not_verified.length) return false;
  // A claimed full verification must have one scoped, inspectable supplier receipt per required claim.
  // Reachable URLs, generic marketing links and restamped dates cannot satisfy this contract.
  if (!Array.isArray(e.claim_evidence)) return false;
  for (const claim of requiredClaims) {
    const receipt = e.claim_evidence.find(x => x.claim === claim &&
      typeof x.url === 'string' && x.url.startsWith('https://') &&
      typeof x.locator === 'string' && x.locator.trim().length > 0 &&
      typeof x.observed_value === 'string' && x.observed_value.trim().length > 0 &&
      x.checked_on === e.checked_on);
    if (!receipt) return false;
  }
  const age=(now-new Date(e.checked_on+'T00:00:00Z'))/86400000;
  return Number.isFinite(age) && age >= 0 && age <= maxAgeDays;
}
const sources = [...new Set(catalog.models.map(m => m.source).filter(Boolean))];
const ids = catalog.models.map(m => m.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const missingSources = catalog.models.filter(m => !m.source || !m.source.startsWith('https://')).map(m => m.id);
async function probe(url) {
  try {
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'Bedrijfsgeheugen-model-catalog-audit/1.0' }, redirect: 'follow' });
    await response.body?.cancel();
    return { url, reachable: response.ok, http_status: response.status, checked_at: now.toISOString(), claim_verified: false };
  } catch (error) {
    return { url, reachable: false, error: String(error.message ?? error), checked_at: now.toISOString(), claim_verified: false };
  }
}
const sourceChecks = new Map();
for (let i = 0; i < sources.length; i += 5) {
  const results = await Promise.all(sources.slice(i, i + 5).map(probe));
  for (const entry of results) sourceChecks.set(entry.url, entry);
}
const models = catalog.models.map(m => {
  const verified = m.verified_at ? new Date(m.verified_at + 'T00:00:00Z') : null;
  const ageDays = verified && Number.isFinite(+verified) ? (now - verified) / 86400000 : null;
  const stale = ageDays === null || ageDays > maxAgeDays || ageDays < 0;
  const fullyVerified=hasFullEvidence(m);
  return {
    id: m.id, provider: m.provider, declared_status: m.status,
    last_claim_verification_at: m.verified_at ?? null,
    age_days: ageDays === null ? null : Math.round(ageDays * 10) / 10,
    source: m.source ?? null,
    source_reachable: sourceChecks.get(m.source)?.reachable ?? false,
    classification: fullyVerified ? 'FULL_CLAIMS_VERIFIED' : (stale ? 'STALE_CLAIMS_UNVERIFIED' : 'DATED_CLAIMS_REQUIRE_EVIDENCE'),
    eligible_for_automatic_freshness_attestation: fullyVerified
  };
});
const report = {
  generated_at: now.toISOString(), catalog_version: catalog.version,
  important: 'HTTP reachability cannot verify prices, lifecycle, model IDs, deployment, capabilities or governance; no verified_at timestamps are changed.',
  counts: { models: models.length, sources: sources.length, stale: models.filter(m => m.classification === 'STALE_CLAIMS_UNVERIFIED').length, fully_verified: models.filter(m => m.eligible_for_automatic_freshness_attestation).length, not_fully_verified: models.filter(m => !m.eligible_for_automatic_freshness_attestation).length, unreachable_sources: [...sourceChecks.values()].filter(x => !x.reachable).length, duplicate_ids: duplicateIds.length, missing_official_urls: missingSources.length },
  duplicate_model_ids: [...new Set(duplicateIds)], missing_source_models: missingSources, source_checks: [...sourceChecks.values()], models
};
// Production readback is explicit and immutable: compare semantic catalog JSON, not HTTP 200.
// The URL must point to the deployed canonical JSON artifact and be supplied by the release job.
// No URL => no claim of production validation. A mismatch or fetch failure blocks acceptance.
const productionUrl = process.env.MODEL_CATALOG_PRODUCTION_URL;
report.production_readback = {
  status: 'NOT_REQUESTED', local_sha256: createHash('sha256').update(JSON.stringify(catalog)).digest('hex')
};
if (productionUrl) {
  report.production_readback.status = 'FAILED';
  report.production_readback.url = productionUrl;
  try {
    if (!productionUrl.startsWith('https://')) throw new Error('HTTPS_REQUIRED');
    const response = await fetch(productionUrl, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP_' + response.status);
    const live = await response.json();
    const liveHash = createHash('sha256').update(JSON.stringify(live)).digest('hex');
    report.production_readback.live_sha256 = liveHash;
    if (liveHash !== report.production_readback.local_sha256) throw new Error('CATALOG_CONTENT_MISMATCH');
    if (live.version !== catalog.version || live.models?.length !== catalog.models.length) throw new Error('CATALOG_SCHEMA_MISMATCH');
    report.production_readback.status = 'MATCH';
  } catch (error) {
    report.production_readback.error = String(error.message ?? error);
    process.exitCode = 2;
  }
}
const json = JSON.stringify(report, null, 2) + '\n';
if (process.argv[2]) await fs.writeFile(process.argv[2], json);
else process.stdout.write(json);
if (report.counts.not_fully_verified || report.counts.duplicate_ids || report.counts.missing_official_urls) process.exitCode = 2;
