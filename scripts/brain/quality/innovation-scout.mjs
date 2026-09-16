import fs from 'node:fs';
import crypto from 'node:crypto';

const registryPath = process.env.QUALITY_SOURCE_REGISTRY || 'powerhouse/assurance/quality-innovation-sources.json';
const outPath = process.env.QUALITY_SCOUT_OUTPUT || 'artifacts/quality/innovation-scout.json';
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const now = new Date().toISOString();
const results = [];

for (const source of registry.sources || []) {
  try {
    const response = await fetch(source.url, { redirect: 'follow', headers: { 'user-agent': 'Bedrijfsgeheugen-Quality-Scout/1.0' } });
    const text = await response.text();
    results.push({
      id: source.id,
      domain: source.domain,
      url: source.url,
      status: response.status,
      ok: response.ok,
      etag: response.headers.get('etag'),
      last_modified: response.headers.get('last-modified'),
      content_sha256: crypto.createHash('sha256').update(text).digest('hex'),
      bytes: Buffer.byteLength(text),
      adoption_state: 'candidate_for_experiment',
      benchmark_required: true,
      benchmark_authority: 'scripts/brain/quality/innovation-benchmark.mjs',
      promotion_without_benchmark: false,
      required_dimensions: ['defect_yield', 'false_positive_rate', 'runtime_ms', 'cost', 'reproducibility', 'security_fit']
    });
  } catch (error) {
    results.push({ id: source.id, domain: source.domain, url: source.url, ok: false, error: error.message, adoption_state: 'unavailable', benchmark_required: true, promotion_without_benchmark: false });
  }
}

fs.mkdirSync('artifacts/quality', { recursive: true });
const payload = {
  fingerprint: 'powerhouse-quality-innovation-scout-v2',
  observed_at: now,
  policy: registry.policy,
  auto_adopt: false,
  benchmark_authority: 'scripts/brain/quality/innovation-benchmark.mjs',
  promotion_rule: 'candidate must beat incumbent on explicit benchmark evidence without security regression',
  sources: results,
  healthy: results.filter(x => x.ok).length,
  unhealthy: results.filter(x => !x.ok).length
};
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
if (results.length === 0) process.exitCode = 1;
