import fs from 'node:fs';
import path from 'node:path';
import { buildCapabilityInventory } from './completion-runtime.mjs';

const ROOTS = [
  'scripts/brain',
  'supabase/migrations',
  'platform/agents',
  '.github/workflows',
  'tests',
  'docs/brain',
  'powerhouse/assurance',
  'contracts/openapi',
  'netlify/functions',
  'portal-v2',
  'site'
];

const REQUIREMENTS = [
  'replay',
  'safe-chaos',
  'capability-inventory',
  'technology-discovery',
  'scheduler-proof',
  'causal-value-lineage',
  'meta-learning',
  'executive-control'
];

const RUNTIME_CAPABILITIES = [
  ['executeReplayExperiment', 'replay'],
  ['runSafeChaosSuite', 'safe-chaos'],
  ['buildCapabilityInventory', 'capability-inventory'],
  ['selectTechnologyCandidates', 'technology-discovery'],
  ['buildSchedulerProvenance', 'scheduler-proof'],
  ['buildValueLineage', 'causal-value-lineage'],
  ['buildMetaLearningPolicy', 'meta-learning'],
  ['buildExecutiveImprovementProjection', 'executive-control']
];

function walk(root, out = []) {
  if (!fs.existsSync(root)) return out;
  const stat = fs.statSync(root);
  if (stat.isFile()) { out.push(root); return out; }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'artifacts') continue;
    walk(path.join(root, entry.name), out);
  }
  return out;
}

function activeDomains(files) {
  const has = prefix => files.some(file => file === prefix || file.startsWith(`${prefix}/`));
  const domains = new Set(['github-actions', 'node-runtime', 'security']);
  if (has('site') || has('portal-v2')) ['frontend-browser','accessibility','frontend-performance'].forEach(x => domains.add(x));
  if (has('contracts/openapi')) domains.add('api-testing');
  if (has('supabase/migrations')) ['supabase','postgresql','integration-testing'].forEach(x => domains.add(x));
  if (files.some(file => file.includes('brain-quality-performance'))) domains.add('performance');
  if (files.some(file => file.includes('stryker') || file.includes('mutation'))) domains.add('mutation-testing');
  if (files.some(file => file.endsWith('.py'))) domains.add('property-testing');
  if (files.some(file => file.includes('codeql'))) domains.add('security-sast');
  if (files.some(file => file.includes('trivy'))) domains.add('supply-chain-security');
  if (files.some(file => file.includes('zap'))) domains.add('security-dast');
  if (has('netlify/functions')) domains.add('netlify');
  domains.add('ai-models');
  return [...domains].sort();
}

const files = [...new Set(ROOTS.flatMap(root => walk(root)))].sort();
const runtimeSource = fs.readFileSync('scripts/brain/continuous-improvement/completion-runtime.mjs', 'utf8');
const capabilities = RUNTIME_CAPABILITIES.map(([symbol, capability]) => ({
  id: `runtime:${symbol}`,
  provides: [capability],
  usage_count: runtimeSource.includes(`export function ${symbol}`) ? 1 : 0,
  last_observed_at: new Date().toISOString(),
  source: 'scripts/brain/continuous-improvement/completion-runtime.mjs'
}));

for (const file of files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))) {
  capabilities.push({ id: `workflow:${file}`, provides: [`workflow:${path.basename(file).replace(/\.ya?ml$/i,'')}`], usage_count: 1, last_observed_at: new Date().toISOString(), source: file });
}

for (const file of files.filter(file => file.startsWith('supabase/migrations/') && file.endsWith('.sql')).slice(-250)) {
  const migrationName = path.basename(file, '.sql');
  capabilities.push({ id: `migration:${migrationName}`, provides: [`migration:${migrationName}`], usage_count: 1, last_observed_at: new Date().toISOString(), source: file });
}

const inventory = buildCapabilityInventory({ capabilities, requirements: REQUIREMENTS, now: new Date().toISOString(), staleAfterDays: 36500 });
const payload = {
  fingerprint: 'powerhouse-autonomous-improvement-capability-inventory-v1',
  observed_at: new Date().toISOString(),
  authority: 'existing-repository-and-runtime-projection',
  new_persistent_authority: false,
  roots: ROOTS,
  source_file_count: files.length,
  active_domains: activeDomains(files),
  requirements: REQUIREMENTS,
  ...inventory,
  simplification_policy: {
    auto_delete: false,
    dependency_use_proof_required: true,
    replay_required: true,
    regression_tests_required: true,
    rollback_required: true
  }
};

const output = process.env.AIR_CAPABILITY_INVENTORY_OUTPUT || 'artifacts/quality/autonomous-improvement-capability-inventory.json';
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ fingerprint: payload.fingerprint, source_file_count: payload.source_file_count, capabilities: payload.capabilities.length, gaps: payload.gaps, overlaps: payload.overlaps.length, active_domains: payload.active_domains })}\n`);
if (payload.gaps.length) process.exitCode = 2;
