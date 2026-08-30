import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function verifyCostMembership(entries = []) {
  const seen = new Set();
  const blocked = [];
  const visibleUnclassified = [];
  for (const entry of entries) {
    const key = String(entry?.componentKey ?? '').trim();
    if (!key) throw new TypeError('componentKey is required');
    if (seen.has(key)) throw new Error(`duplicate component key: ${key}`);
    seen.add(key);
    if (entry.classificationState !== 'CLASSIFIED') {
      visibleUnclassified.push(key);
      if (entry.active === true) blocked.push(key);
    }
  }
  blocked.sort();
  visibleUnclassified.sort();
  return Object.freeze({
    ok: blocked.length === 0,
    blocked: Object.freeze(blocked),
    visibleUnclassified: Object.freeze(visibleUnclassified),
  });
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error('usage: node tools/verify-brain-cost-membership.mjs <catalog.json>');
  const parsed = JSON.parse(await readFile(inputPath, 'utf8'));
  const result = verifyCostMembership(Array.isArray(parsed) ? parsed : parsed.components);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
    process.exitCode = 1;
  });
}
