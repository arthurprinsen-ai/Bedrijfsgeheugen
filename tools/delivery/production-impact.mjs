import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function unique(values = []) {
  return [...new Set(values.map(value => String(value || '').trim().replace(/^\.\//, '')).filter(Boolean))].sort();
}

export function classifyProductionImpact({ changedPaths = [], policy } = {}) {
  if (!policy || policy.version !== 'POWERHOUSE-PRODUCTION-IMPACT-v1') {
    throw new TypeError('POWERHOUSE-PRODUCTION-IMPACT-v1 policy is required');
  }
  const paths = unique(changedPaths);
  const exact = new Set(policy.ignoredExact || []);
  const prefixes = policy.ignoredPrefixes || [];
  const productionBearingPaths = paths.filter(path => !exact.has(path) && !prefixes.some(prefix => path.startsWith(prefix)));
  return Object.freeze({
    version: policy.version,
    changedPaths: Object.freeze(paths),
    productionBearingPaths: Object.freeze(productionBearingPaths),
    productionReadbackRequired: productionBearingPaths.length > 0,
    mode: productionBearingPaths.length > 0 ? 'PRODUCTION_READBACK_REQUIRED' : 'GITHUB_MAIN_CONTAINMENT'
  });
}

export async function loadProductionImpactPolicy(path = 'config/powerhouse-production-impact-v1.json') {
  return JSON.parse(await readFile(path, 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const changedPaths = String(process.env.CHANGED_PATHS || '').split(/\r?\n/).filter(Boolean);
  const policy = await loadProductionImpactPolicy();
  process.stdout.write(`${JSON.stringify(classifyProductionImpact({ changedPaths, policy }))}\n`);
}
