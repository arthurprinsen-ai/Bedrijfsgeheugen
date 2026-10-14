#!/usr/bin/env node
// Evidence-first catalog audit: URL reachability is NOT a verification of model claims.
// Usage: node scripts/audit-ai-model-catalog.mjs [output-file]
import fs from 'node:fs/promises';
const catalog = JSON.parse(await fs.readFile('data/ai-model-catalog-v1.json', 'utf8'));
const now = new Date();
const maxAgeDays = 14;
const sources = [...new Set(catalog.models.map(m => m.source).filter(Boolean))];
const ids = catalog.models.map(m => m.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const missingSources = catalog.models.filter(m => !m.source || !/^https:\\/\\//.test(m.source)).map(m => m.id);
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
  return {
    id: m.id, provider: m.provider, declared_status: m.status,
    last_claim_verification_at: m.verified_at ?? null,
    age_days: ageDays === null ? null : Math.round(ageDays * 10) / 10,
    source: m.source ?? null,
    source_reachable: sourceChecks.get(m.source)?.reachable ?? false,
    classification: stale ? 'STALE_CLAIMS_UNVERIFIED' : 'DATED_CLAIMS_REQUIRE_EVIDENCE',
    eligible_for_automatic_freshness_attestation: false
  };
});
const report = {
  generated_at: now.toISOString(), catalog_version: catalog.version,
  important: 'HTTP reachability cannot verify prices, lifecycle, model IDs, deployment, capabilities or governance; no verified_at timestamps are changed.',
  counts: { models: models.length, sources: sources.length, stale: models.filter(m => m.classification === 'STALE_CLAIMS_UNVERIFIED').length, unreachable_sources: [...sourceChecks.values()].filter(x => !x.reachable).length, duplicate_ids: duplicateIds.length, missing_official_urls: missingSources.length },
  duplicate_model_ids: [...new Set(duplicateIds)], missing_source_models: missingSources, source_checks: [...sourceChecks.values()], models
};
const json = JSON.stringify(report, null, 2) + '\n';
if (process.argv[2]) await fs.writeFile(process.argv[2], json);
else process.stdout.write(json);
if (report.counts.stale) process.exitCode = 2;
