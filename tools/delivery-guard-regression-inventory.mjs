import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

function normalizeFailure(value, source) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.fingerprint !== 'string') return null;
  return {
    source,
    fingerprint: value.fingerprint,
    rootCause: typeof value.rootCause === 'string' ? value.rootCause : null,
    fix: typeof value.fix === 'string' ? value.fix : null,
    preventionRule: typeof value.preventionRule === 'string' ? value.preventionRule : null,
    regressionContract: typeof value.regressionContract === 'string' ? value.regressionContract : null,
    owner: typeof value.owner === 'string' ? value.owner : null,
    status: typeof value.status === 'string' ? value.status : null,
  };
}

function collectKnownFailures(doc, source) {
  const failures = [];
  const single = normalizeFailure(doc?.knownFailure, source);
  if (single) failures.push(single);
  for (const value of Array.isArray(doc?.knownFailures) ? doc.knownFailures : []) {
    const item = normalizeFailure(value, source);
    if (item) failures.push(item);
  }
  return failures;
}

function isGoverned(testPath, policy) {
  const normalized = testPath.replaceAll('\\', '/');
  return (policy.lanes || []).some(lane => (lane.paths || []).some(prefix => normalized.startsWith(prefix)));
}

export async function buildGuardRegressionInventory({ root = REPO_ROOT } = {}) {
  const configDir = path.join(root, 'config');
  const entries = await readdir(configDir, { recursive: true, withFileTypes: true });
  const guardFiles = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.json') && entry.name.includes('guard'))
    .map(entry => path.join(entry.parentPath || entry.path || configDir, entry.name));

  const policy = JSON.parse(await readFile(path.join(root, 'config/brain-delivery-system.json'), 'utf8'));
  const guards = [];
  for (const file of guardFiles) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const doc = JSON.parse(await readFile(file, 'utf8'));
    guards.push(...collectKnownFailures(doc, relative));
  }

  const missingRegressionContracts = guards.filter(item => !item.regressionContract).map(item => item.fingerprint);
  const missingRegressionFiles = [];
  const ungovernedRegressionFiles = [];
  for (const item of guards.filter(item => item.regressionContract)) {
    if (!(await exists(path.join(root, item.regressionContract)))) missingRegressionFiles.push(item.regressionContract);
    else if (!isGoverned(item.regressionContract, policy)) ungovernedRegressionFiles.push(item.regressionContract);
  }

  return Object.freeze({
    failClosed: true,
    guards: Object.freeze(guards),
    fingerprints: Object.freeze([...new Set(guards.map(item => item.fingerprint))]),
    missingRegressionContracts: Object.freeze([...new Set(missingRegressionContracts)]),
    missingRegressionFiles: Object.freeze([...new Set(missingRegressionFiles)]),
    ungovernedRegressionFiles: Object.freeze([...new Set(ungovernedRegressionFiles)]),
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inventory = await buildGuardRegressionInventory();
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
  if (inventory.missingRegressionContracts.length || inventory.missingRegressionFiles.length || inventory.ungovernedRegressionFiles.length) process.exitCode = 1;
}
