import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FINGERPRINT = 'powerhouse-assurance-layer-v1';
const ACTIVE_LIFECYCLES = new Set(['active', 'experimental']);
const VALID_LIFECYCLES = new Set(['experimental', 'active', 'deprecated', 'retired', 'superseded']);
const REQUIRED_ACTIVE_FIELDS = [
  'canonical_id', 'name', 'lifecycle', 'authority', 'owner', 'code_paths',
  'runtime_surfaces', 'docs', 'dependencies', 'data_contract', 'security_contract',
  'observability_contract', 'recovery_contract', 'cost_capacity_contract',
  'test_contract', 'evidence_contract', 'learning_contract', 'last_verified_at',
];
const NONEMPTY_ARRAY_FIELDS = new Set(['code_paths', 'runtime_surfaces', 'docs', 'test_contract']);
const REQUIRED_PARITY_FIELDS = [
  'legacy_key', 'canonical_id', 'status', 'v2_surface', 'authority', 'writeback', 'tests', 'evidence',
];

const missingScalar = (value) => value == null || value === '';
const missingField = (field, value) => missingScalar(value) || (NONEMPTY_ARRAY_FIELDS.has(field) && Array.isArray(value) && value.length === 0);

export function validateComponentRegistry(registry = {}) {
  const components = Array.isArray(registry.components) ? registry.components : [];
  const gaps = [];
  const seen = new Set();

  for (const [index, component] of components.entries()) {
    const label = component?.canonical_id || `component[${index}]`;
    if (!VALID_LIFECYCLES.has(component?.lifecycle)) gaps.push(`${label}: invalid lifecycle`);
    if (component?.canonical_id) {
      if (seen.has(component.canonical_id)) gaps.push(`${label}: duplicate canonical_id`);
      seen.add(component.canonical_id);
    }
    if (ACTIVE_LIFECYCLES.has(component?.lifecycle)) {
      for (const field of REQUIRED_ACTIVE_FIELDS) {
        if (missingField(field, component?.[field])) gaps.push(`${label}: missing ${field}`);
      }
      const recovery = component?.recovery_contract;
      if (recovery?.critical === true && (recovery.status !== 'tested' || missingScalar(recovery.evidence))) {
        gaps.push(`${label}: critical component requires tested recovery evidence`);
      }
    }
    if (component?.lifecycle === 'deprecated' || component?.lifecycle === 'superseded') {
      if (missingScalar(component?.retirement)) gaps.push(`${label}: missing retirement/migration evidence`);
    }
  }
  if (components.length === 0) gaps.push('registry: no components registered');
  return { ok: gaps.length === 0, gaps, count: components.length };
}

export function validatePortalParity(parity = {}) {
  const capabilities = Array.isArray(parity.capabilities) ? parity.capabilities : [];
  const gaps = [];
  const seen = new Set();
  for (const [index, capability] of capabilities.entries()) {
    const label = capability?.legacy_key || `capability[${index}]`;
    for (const field of REQUIRED_PARITY_FIELDS) {
      const value = capability?.[field];
      if (missingScalar(value) || (Array.isArray(value) && value.length === 0)) gaps.push(`${label}: missing ${field}`);
    }
    if (!['verified', 'retired'].includes(capability?.status)) gaps.push(`${label}: parity status must be verified or retired`);
    if (capability?.legacy_key) {
      if (seen.has(capability.legacy_key)) gaps.push(`${label}: duplicate legacy_key`);
      seen.add(capability.legacy_key);
    }
    if (capability?.status === 'retired' && missingScalar(capability?.retirement)) gaps.push(`${label}: retired capability requires retirement evidence`);
  }
  return { ok: gaps.length === 0, gaps, count: capabilities.length };
}

function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLE_STAR___/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function walk(root, relative = '') {
  const dir = path.join(root, relative);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.posix.join(relative.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) out.push(...walk(root, rel));
    else out.push(rel);
  }
  return out;
}

export function discoverRepositoryDrift({ rootDir, registry }) {
  const roots = Array.isArray(registry.drift_roots) ? registry.drift_roots : [];
  const patterns = (registry.components || []).flatMap((component) => component.code_paths || []).map(globToRegex);
  const discovered = roots.flatMap((root) => walk(rootDir, root));
  const unregistered = discovered.filter((file) => !patterns.some((pattern) => pattern.test(file)));
  return { ok: unregistered.length === 0, discovered, unregistered };
}

export function buildAssuranceReport({ registry = {}, parity = {}, drift = null } = {}) {
  const registryResult = validateComponentRegistry(registry);
  const parityResult = validatePortalParity(parity);
  const gaps = [...registryResult.gaps, ...parityResult.gaps];
  if (drift && !drift.ok) gaps.push(...drift.unregistered.map((file) => `unregistered production surface: ${file}`));
  return {
    fingerprint: FINGERPRINT,
    status: gaps.length === 0 ? 'LIVE & BEWEZEN' : 'DEELS LIVE',
    gaps,
    components: registryResult.count,
    portal_parity: parityResult.count,
    drift: drift ? { discovered: drift.discovered.length, unregistered: drift.unregistered } : null,
  };
}

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(here, '..');
  const registry = loadJson(path.join(rootDir, 'powerhouse/assurance/component-registry.json'));
  const parity = loadJson(path.join(rootDir, 'powerhouse/assurance/portal-v2-parity.json'));
  const drift = discoverRepositoryDrift({ rootDir, registry });
  const report = buildAssuranceReport({ registry, parity, drift });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (process.argv.includes('--check') && report.gaps.length > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
