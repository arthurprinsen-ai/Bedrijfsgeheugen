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
      adoption_state: 'candidate_for_experiment'
    });
  } catch (error) {
    results.push({ id: source.id, domain: source.domain, url: source.url, ok: false, error: error.message, adoption_state: 'unavailable' });
  }
}

fs.mkdirSync('artifacts/quality', { recursive: true });
const payload = {
  fingerprint: 'powerhouse-quality-innovation-scout-v1',
  observed_at: now,
  policy: registry.policy,
  auto_adopt: false,
  sources: results,
  healthy: results.filter(x => x.ok).length,
  unhealthy: results.filter(x => !x.ok).length
};
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
if (results.length === 0) process.exitCode = 1;
