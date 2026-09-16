import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

function stableUnique(values = []) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function pathMatches(target, rule) {
  if (!target || !rule) return false;
  return target === rule || target.startsWith(rule);
}

function overlapPath(a, b) {
  return a === b || a.startsWith(b.endsWith('/') ? b : `${b}/`) || b.startsWith(a.endsWith('/') ? a : `${a}/`);
}

function resolveForPaths(paths, deliveryConfig) {
  const lanes = [];
  const contracts = [];
  for (const lane of deliveryConfig.lanes ?? []) {
    if (paths.some(p => (lane.paths ?? []).some(rule => pathMatches(p, rule)))) lanes.push(lane.id);
  }
  for (const contract of deliveryConfig.conflictContracts ?? []) {
    if (paths.some(p => (contract.paths ?? []).some(rule => pathMatches(p, rule)))) contracts.push(contract.id);
  }
  return { lanes: stableUnique(lanes), contracts: stableUnique(contracts) };
}

function isKnownNonExecutableDocs(paths, deliveryConfig) {
  return paths.length > 0 && paths.every(p => (deliveryConfig.nonExecutableSharedPaths ?? []).some(rule => pathMatches(p, rule)));
}

function profileMap(policy) {
  return policy?.test_profiles ?? policy?.affected_testing?.test_profiles ?? {};
}

export function selectAffectedTests({ paths, deliveryConfig, policy }) {
  const normalizedPaths = stableUnique(paths);
  const { lanes, contracts } = resolveForPaths(normalizedPaths, deliveryConfig);
  const profiles = new Set();
  const tests = profileMap(policy);

  if (isKnownNonExecutableDocs(normalizedPaths, deliveryConfig)) {
    for (const p of tests.docs ?? []) profiles.add(p);
    return { profiles: stableUnique([...profiles]), lanes, contracts, failClosed: false, reason: null };
  }

  for (const lane of lanes) for (const p of tests[lane] ?? []) profiles.add(p);
  if (contracts.includes('delivery-control-plane')) for (const p of tests.control_plane ?? []) profiles.add(p);

  const known = lanes.length > 0 || contracts.length > 0;
  if (!known && (policy?.fail_closed_unknown_material_scope ?? policy?.affected_testing?.fail_closed_unknown_material_scope) === true) {
    for (const p of tests.full ?? ['required']) profiles.add(p);
    return {
      profiles: stableUnique([...profiles]),
      lanes,
      contracts,
      failClosed: true,
      reason: `Unknown material scope: ${normalizedPaths.join(', ')}`
    };
  }

  if (profiles.size === 0 && known) for (const p of tests.full ?? ['required']) profiles.add(p);
  return { profiles: stableUnique([...profiles]), lanes, contracts, failClosed: false, reason: null };
}

export function buildCacheIdentity({ baseSha, candidateSha, paths = [], contracts = [], tests = [], policyVersion }) {
  const payload = JSON.stringify({
    baseSha,
    candidateSha,
    paths: stableUnique(paths),
    contracts: stableUnique(contracts),
    tests: stableUnique(tests),
    policyVersion
  });
  return createHash('sha256').update(payload).digest('hex');
}

function packageConflict(a, b) {
  if (a.dependsOn.includes(b.id) || b.dependsOn.includes(a.id)) return true;
  if (a.paths.some(pa => b.paths.some(pb => overlapPath(pa, pb)))) return true;
  if (a.contracts.some(c => b.contracts.includes(c))) return true;
  return false;
}

function validatePackages(workPackages) {
  const byId = new Map();
  for (const raw of workPackages) {
    if (!raw?.id) throw new Error('Work package id is required');
    if (!raw.baseSha || !raw.candidateSha) throw new Error(`Exact base/candidate identity required for ${raw.id}`);
    if (byId.has(raw.id)) throw new Error(`Duplicate work package id: ${raw.id}`);
    byId.set(raw.id, raw);
  }
  for (const raw of workPackages) {
    for (const dep of raw.dependsOn ?? []) if (!byId.has(dep)) throw new Error(`Missing dependency target ${dep} for ${raw.id}`);
  }
  return byId;
}

export function buildExecutionPlan({ workPackages, deliveryConfig, policy }) {
  validatePackages(workPackages);
  const packages = workPackages.map(raw => {
    const paths = stableUnique(raw.paths ?? []);
    const affected = selectAffectedTests({ paths, deliveryConfig, policy });
    if (affected.failClosed) throw new Error(`Fail-closed work package ${raw.id}: ${affected.reason}`);
    return {
      ...raw,
      paths,
      dependsOn: stableUnique(raw.dependsOn ?? []),
      lanes: affected.lanes,
      contracts: affected.contracts,
      testProfiles: affected.profiles,
      failClosed: false,
      failClosedReason: null,
      cacheIdentity: buildCacheIdentity({
        baseSha: raw.baseSha,
        candidateSha: raw.candidateSha,
        paths,
        contracts: affected.contracts,
        tests: affected.profiles,
        policyVersion: policy?.version ?? 1
      })
    };
  }).sort((a, b) => a.id.localeCompare(b.id));

  const remaining = new Map(packages.map(p => [p.id, p]));
  const completed = new Set();
  const waves = [];

  while (remaining.size > 0) {
    const ready = [...remaining.values()].filter(p => p.dependsOn.every(dep => completed.has(dep))).sort((a, b) => a.id.localeCompare(b.id));
    if (ready.length === 0) throw new Error('Dependency cycle detected');

    const wave = [];
    for (const candidate of ready) {
      if (wave.every(existing => !packageConflict(existing, candidate))) wave.push(candidate);
    }
    if (wave.length === 0) throw new Error('Dependency cycle or unschedulable conflict detected');
    waves.push(wave);
    for (const p of wave) {
      completed.add(p.id);
      remaining.delete(p.id);
    }
  }

  return { fingerprint: policy?.fingerprint ?? null, waves, packages };
}

export function buildSpeculativeIntegrations(plan) {
  const result = [];
  for (const wave of plan.waves ?? []) {
    for (let i = 0; i < wave.length; i += 1) {
      for (let j = i + 1; j < wave.length; j += 1) {
        if (!packageConflict(wave[i], wave[j])) result.push({ packageIds: [wave[i].id, wave[j].id], promotionAuthority: false });
      }
    }
  }
  return result;
}

export async function loadParallelEngineeringPolicy() {
  return JSON.parse(await readFile(path.join(repoRoot, 'config', 'powerhouse-parallel-engineering-fabric.json'), 'utf8'));
}

export async function validateParallelEngineeringFabric() {
  const policy = await loadParallelEngineeringPolicy();
  const errors = [];
  if (policy.fingerprint !== 'powerhouse-parallel-engineering-fabric-v1') errors.push('fingerprint drift');
  if (policy.authority?.delivery !== 'config/brain-delivery-system.json') errors.push('delivery authority drift');
  if (policy.authority?.engineering_os !== 'config/powerhouse-engineering-os.json') errors.push('engineering OS authority drift');
  if (policy.authority?.production_promotion !== 'BG169') errors.push('production promotion authority drift');
  if (policy.authority?.creates_parallel_authority !== false) errors.push('parallel authority must remain false');
  if (policy.scheduling?.deterministic !== true) errors.push('deterministic scheduling required');
  if (policy.affected_testing?.fail_closed_unknown_material_scope !== true) errors.push('unknown material scope must fail closed');
  if (policy.affected_testing?.fast_path_never_replaces_release_gates !== true) errors.push('fast path cannot replace release gates');
  if (policy.cache?.never_skips_production_readback !== true) errors.push('cache cannot skip production readback');
  if (policy.speculative_integration?.may_promote !== false) errors.push('speculative integration may not promote');
  if (policy.completion?.success !== 'LIVE & BEWEZEN') errors.push('completion status drift');
  return { ok: errors.length === 0, fingerprint: policy.fingerprint, errors };
}

async function main() {
  const mode = process.argv[2] ?? '--check';
  if (mode !== '--check') {
    console.error('Usage: node scripts/brain/parallel-engineering-fabric.mjs --check');
    process.exitCode = 2;
    return;
  }
  const validation = await validateParallelEngineeringFabric();
  console.log(JSON.stringify({ status: validation.ok ? 'PARALLEL_ENGINEERING_READY' : 'PARALLEL_ENGINEERING_BLOCKED', ...validation }, null, 2));
  if (!validation.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
