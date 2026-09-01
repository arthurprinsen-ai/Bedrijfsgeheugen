import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const REQUIRED = [
  'producer_id',
  'source_system',
  'path_patterns',
  'adapter_owner',
  'retention_class',
  'idempotency_key',
  'outcome_evidence',
  'brain_writeback',
  'cost_guard',
];

function matches(path, pattern) {
  const value = String(path ?? '').trim();
  const p = String(pattern ?? '').trim();
  return Boolean(p) && (value === p || value.startsWith(p));
}

export function validateProducerRegistration(registration) {
  const missing = REQUIRED.filter(field => {
    const value = registration?.[field];
    if (field === 'path_patterns') return !Array.isArray(value) || value.length === 0 || value.some(item => !String(item ?? '').trim());
    return !String(value ?? '').trim();
  });
  return Object.freeze({ ok: missing.length === 0, missing: Object.freeze(missing) });
}

export function checkChangedProducerPaths(paths = [], registry = []) {
  const validRegistry = registry.filter(row => validateProducerRegistration(row).ok);
  const uncovered = [...new Set(paths.map(value => String(value).trim()).filter(Boolean))]
    .filter(path => !validRegistry.some(row => row.path_patterns.some(pattern => matches(path, pattern))))
    .sort();
  return Object.freeze({ ok: uncovered.length === 0, uncovered: Object.freeze(uncovered) });
}

export function validateProducerRegistry(registry = []) {
  const ids = new Set();
  const errors = [];
  for (const row of registry) {
    const result = validateProducerRegistration(row);
    if (!result.ok) errors.push(`${row?.producer_id || 'unknown'}:${result.missing.join(',')}`);
    const id = String(row?.producer_id ?? '').trim();
    if (id && ids.has(id)) errors.push(`${id}:duplicate`);
    if (id) ids.add(id);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

async function main() {
  const registryDoc = JSON.parse(await readFile('config/universal-event-producers.json', 'utf8'));
  const result = validateProducerRegistry(registryDoc.producers || []);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify({ ok:false, error:error.message })}\n`);
    process.exitCode = 1;
  });
}
