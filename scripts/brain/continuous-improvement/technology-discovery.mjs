import fs from 'node:fs';
import path from 'node:path';

const inventoryPath = process.env.AIR_CAPABILITY_INVENTORY_OUTPUT || 'artifacts/quality/autonomous-improvement-capability-inventory.json';
const scoutPath = process.env.QUALITY_SCOUT_OUTPUT || 'artifacts/quality/innovation-scout.json';
const output = process.env.AIR_TECH_DISCOVERY_OUTPUT || 'artifacts/quality/autonomous-improvement-technology-candidates.json';

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const scout = JSON.parse(fs.readFileSync(scoutPath, 'utf8'));
const domains = new Set(inventory.active_domains || []);

const candidates = (scout.sources || [])
  .filter(source => source.ok === true && domains.has(source.domain))
  .map(source => ({
    id: source.id,
    domain: source.domain,
    source_url: source.url,
    content_sha256: source.content_sha256,
    etag: source.etag ?? null,
    last_modified: source.last_modified ?? null,
    inventory_relevance: 'ACTIVE_DOMAIN_MATCH',
    adoption_state: 'CANDIDATE_FOR_EXPERIMENT',
    benchmark_required: true,
    replay_required: true,
    challenger_required: true,
    auto_adopt: false,
    stable_or_proven_required: true,
    promotion_rule: 'must beat incumbent on explicit benchmark evidence without correctness, security, tenancy, cost or rollback regression'
  }))
  .sort((a, b) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id));

const payload = {
  fingerprint: 'powerhouse-autonomous-improvement-technology-discovery-v1',
  observed_at: new Date().toISOString(),
  inventory_fingerprint: inventory.fingerprint,
  scout_fingerprint: scout.fingerprint,
  authority: 'existing-quality-intelligence-executor',
  new_persistent_authority: false,
  latest_version_chasing: false,
  relevant_domains: [...domains].sort(),
  candidates,
  rejected_irrelevant_or_unhealthy: (scout.sources || []).length - candidates.length,
  next_step: 'benchmark -> replay -> challenger -> existing improvement obligation lifecycle'
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ fingerprint: payload.fingerprint, candidates: payload.candidates.length, rejected: payload.rejected_irrelevant_or_unhealthy })}\n`);
