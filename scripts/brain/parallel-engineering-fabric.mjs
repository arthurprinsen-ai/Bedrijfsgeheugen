import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

function stableUnique(values = []) { return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b))); }
function pathMatches(target, rule) { return Boolean(target && rule && (target === rule || target.startsWith(rule))); }
function overlapPath(a, b) { return a === b || a.startsWith(b.endsWith('/') ? b : `${b}/`) || b.startsWith(a.endsWith('/') ? a : `${a}/`); }

function resolveForPaths(paths, deliveryConfig) {
  const lanes = []; const contracts = [];
  for (const lane of deliveryConfig.lanes ?? []) if (paths.some(p => (lane.paths ?? []).some(rule => pathMatches(p, rule)))) lanes.push(lane.id);
  for (const contract of deliveryConfig.conflictContracts ?? []) if (paths.some(p => (contract.paths ?? []).some(rule => pathMatches(p, rule)))) contracts.push(contract.id);
  return { lanes: stableUnique(lanes), contracts: stableUnique(contracts) };
}
function isKnownNonExecutableDocs(paths, deliveryConfig) { return paths.length > 0 && paths.every(p => (deliveryConfig.nonExecutableSharedPaths ?? []).some(rule => pathMatches(p, rule))); }
function profileMap(policy) { return policy?.test_profiles ?? policy?.affected_testing?.test_profiles ?? {}; }

export function selectAffectedTests({ paths, deliveryConfig, policy }) {
  const normalizedPaths = stableUnique(paths); const { lanes, contracts } = resolveForPaths(normalizedPaths, deliveryConfig); const profiles = new Set(); const tests = profileMap(policy);
  if (isKnownNonExecutableDocs(normalizedPaths, deliveryConfig)) { for (const p of tests.docs ?? []) profiles.add(p); return { profiles: stableUnique([...profiles]), lanes, contracts, failClosed: false, reason: null }; }
  for (const lane of lanes) for (const p of tests[lane] ?? []) profiles.add(p);
  if (contracts.includes('delivery-control-plane')) for (const p of tests.control_plane ?? []) profiles.add(p);
  const known = lanes.length > 0 || contracts.length > 0;
  if (!known && (policy?.fail_closed_unknown_material_scope ?? policy?.affected_testing?.fail_closed_unknown_material_scope) === true) {
    for (const p of tests.full ?? ['required']) profiles.add(p);
    return { profiles: stableUnique([...profiles]), lanes, contracts, failClosed: true, reason: `Unknown material scope: ${normalizedPaths.join(', ')}` };
  }
  if (profiles.size === 0 && known) for (const p of tests.full ?? ['required']) profiles.add(p);
  return { profiles: stableUnique([...profiles]), lanes, contracts, failClosed: false, reason: null };
}

export function buildImpactGraph({ paths = [], resources = [], dependencies = [], deliveryConfig, policy } = {}) {
  const affected = selectAffectedTests({ paths, deliveryConfig, policy });
  return Object.freeze({ paths: stableUnique(paths), resources: stableUnique(resources), dependencies: stableUnique(dependencies), lanes: affected.lanes, contracts: affected.contracts, testProfiles: affected.profiles, failClosed: affected.failClosed, reason: affected.reason });
}


function parseMigrationVersion(value) {
  const s=String(value??'');
  if(!/^\d{14}$/.test(s)) throw new Error(`Migration version must be YYYYMMDDHHMMSS: ${s}`);
  const y=Number(s.slice(0,4)),m=Number(s.slice(4,6)),d=Number(s.slice(6,8)),h=Number(s.slice(8,10)),mi=Number(s.slice(10,12)),sec=Number(s.slice(12,14));
  const ts=Date.UTC(y,m-1,d,h,mi,sec);
  const dt=new Date(ts);
  const roundtrip=`${dt.getUTCFullYear().toString().padStart(4,'0')}${String(dt.getUTCMonth()+1).padStart(2,'0')}${String(dt.getUTCDate()).padStart(2,'0')}${String(dt.getUTCHours()).padStart(2,'0')}${String(dt.getUTCMinutes()).padStart(2,'0')}${String(dt.getUTCSeconds()).padStart(2,'0')}`;
  if(roundtrip!==s) throw new Error(`Invalid migration version timestamp: ${s}`);
  return ts;
}
function formatMigrationVersion(ts) {
  const dt=new Date(ts);
  return `${dt.getUTCFullYear().toString().padStart(4,'0')}${String(dt.getUTCMonth()+1).padStart(2,'0')}${String(dt.getUTCDate()).padStart(2,'0')}${String(dt.getUTCHours()).padStart(2,'0')}${String(dt.getUTCMinutes()).padStart(2,'0')}${String(dt.getUTCSeconds()).padStart(2,'0')}`;
}
export function allocateMigrationVersion({existingVersions=[],preferredVersion,maxLookaheadSeconds=3600}={}) {
  const used=new Set(existingVersions.map(String));
  const start=parseMigrationVersion(preferredVersion);
  for(let offset=0;offset<=maxLookaheadSeconds;offset+=1){
    const candidate=formatMigrationVersion(start+offset*1000);
    if(!used.has(candidate)) return Object.freeze({version:candidate,preferredVersion:String(preferredVersion),collisionResolved:offset>0,offsetSeconds:offset});
  }
  throw new Error(`No free migration version within ${maxLookaheadSeconds}s of ${preferredVersion}`);
}

export function buildCacheIdentity({ baseSha, candidateSha, paths = [], contracts = [], tests = [], policyVersion, environment = null, configDigest = null, schemaDigest = null, dependencyDigest = null, gateVersion = null, contractDigest = null }) {
  const payload = JSON.stringify({ baseSha, candidateSha, paths: stableUnique(paths), contracts: stableUnique(contracts), tests: stableUnique(tests), policyVersion, environment, configDigest, schemaDigest, dependencyDigest, gateVersion, contractDigest });
  return createHash('sha256').update(payload).digest('hex');
}

function packageConflict(a, b) {
  if (a.dependsOn.includes(b.id) || b.dependsOn.includes(a.id)) return true;
  if (a.paths.some(pa => b.paths.some(pb => overlapPath(pa, pb)))) return true;
  if (a.contracts.some(c => b.contracts.includes(c))) return true;
  if (a.resources.some(r => b.resources.includes(r))) return true;
  return false;
}
function validatePackages(workPackages) {
  const byId = new Map();
  for (const raw of workPackages) { if (!raw?.id) throw new Error('Work package id is required'); if (!raw.baseSha || !raw.candidateSha) throw new Error(`Exact base/candidate identity required for ${raw.id}`); if (byId.has(raw.id)) throw new Error(`Duplicate work package id: ${raw.id}`); byId.set(raw.id, raw); }
  for (const raw of workPackages) for (const dep of raw.dependsOn ?? []) if (!byId.has(dep)) throw new Error(`Missing dependency target ${dep} for ${raw.id}`);
}

export function buildExecutionPlan({ workPackages, deliveryConfig, policy }) {
  validatePackages(workPackages);
  const packages = workPackages.map(raw => {
    const graph = buildImpactGraph({ paths: raw.paths ?? [], resources: raw.resources ?? [], dependencies: raw.dependsOn ?? [], deliveryConfig, policy });
    if (graph.failClosed) throw new Error(`Fail-closed work package ${raw.id}: ${graph.reason}`);
    return { ...raw, paths: graph.paths, resources: graph.resources, dependsOn: graph.dependencies, lanes: graph.lanes, contracts: graph.contracts, testProfiles: graph.testProfiles, failClosed: false, failClosedReason: null,
      cacheIdentity: buildCacheIdentity({ baseSha: raw.baseSha, candidateSha: raw.candidateSha, paths: graph.paths, contracts: graph.contracts, tests: graph.testProfiles, policyVersion: policy?.version ?? 1, environment: raw.environment ?? null, configDigest: raw.configDigest ?? null, schemaDigest: raw.schemaDigest ?? null, dependencyDigest: raw.dependencyDigest ?? null, gateVersion: raw.gateVersion ?? null, contractDigest: raw.contractDigest ?? null })
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const remaining = new Map(packages.map(p => [p.id, p])); const completed = new Set(); const waves = [];
  while (remaining.size > 0) {
    const ready = [...remaining.values()].filter(p => p.dependsOn.every(dep => completed.has(dep))).sort((a, b) => a.id.localeCompare(b.id));
    if (ready.length === 0) throw new Error('Dependency cycle detected');
    const wave = [];
    for (const candidate of ready) if (wave.every(existing => !packageConflict(existing, candidate))) wave.push(candidate);
    if (wave.length === 0) throw new Error('Dependency cycle or unschedulable conflict detected');
    waves.push(wave); for (const p of wave) { completed.add(p.id); remaining.delete(p.id); }
  }
  return { fingerprint: policy?.fingerprint ?? null, waves, packages };
}

export async function executePlanWaves(plan, workers = {}) {
  if (!plan || !Array.isArray(plan.waves)) throw new TypeError('execution plan with waves is required');
  const results = {};
  const waveResults = [];
  for (const wave of plan.waves) {
    const executions = wave.map(async pkg => {
      const specialist = pkg.specialist ?? pkg.owner ?? pkg.lanes?.[0] ?? null;
      const worker = specialist ? workers[specialist] : null;
      if (typeof worker !== 'function') throw new Error(`Missing specialist worker for ${pkg.id}: ${specialist ?? 'unassigned'}`);
      const value = await worker(pkg, Object.freeze({ priorResults: { ...results }, promotionAuthority: false }));
      return [pkg.id, value];
    });
    const completed = await Promise.all(executions);
    for (const [id, value] of completed) results[id] = value;
    waveResults.push(Object.freeze(Object.fromEntries(completed)));
  }
  return Object.freeze({ results:Object.freeze({ ...results }), waves:Object.freeze(waveResults), promotionAuthority:false });
}

export function buildSpeculativeIntegrations(plan) {
  const result = [];
  for (const wave of plan.waves ?? []) for (let i = 0; i < wave.length; i += 1) for (let j = i + 1; j < wave.length; j += 1) if (!packageConflict(wave[i], wave[j])) result.push({ packageIds: [wave[i].id, wave[j].id], promotionAuthority: false });
  return result;
}
export async function loadParallelEngineeringPolicy() { return JSON.parse(await readFile(path.join(repoRoot, 'config', 'powerhouse-parallel-engineering-fabric.json'), 'utf8')); }
export async function validateParallelEngineeringFabric() {
  const policy = await loadParallelEngineeringPolicy(); const errors = [];
  if (policy.fingerprint !== 'powerhouse-parallel-engineering-fabric-v1') errors.push('fingerprint drift');
  if (policy.protocol_extension !== 'powerhouse-fast-development-protocol-v2') errors.push('fast development protocol extension drift');
  if (policy.authority?.delivery !== 'config/brain-delivery-system.json') errors.push('delivery authority drift');
  if (policy.authority?.engineering_os !== 'config/powerhouse-engineering-os.json') errors.push('engineering OS authority drift');
  if (policy.authority?.production_promotion !== 'BG169') errors.push('production promotion authority drift');
  if (policy.authority?.creates_parallel_authority !== false) errors.push('parallel authority must remain false');
  if (policy.scheduling?.deterministic !== true) errors.push('deterministic scheduling required');
  if (policy.scheduling?.parallel_only_without?.includes('mutable-resource-overlap') !== true) errors.push('mutable resource conflict guard drift');
  if (policy.affected_testing?.fail_closed_unknown_material_scope !== true) errors.push('unknown material scope must fail closed');
  if (policy.affected_testing?.fast_path_never_replaces_release_gates !== true) errors.push('fast path cannot replace release gates');
  if (policy.cache?.never_skips_production_readback !== true) errors.push('cache cannot skip production readback');
  for (const required of ['schemaDigest','dependencyDigest','gateVersion','environment','contractDigest']) if (!policy.cache?.inputs?.includes(required)) errors.push(`cache identity missing ${required}`);
  if (policy.speculative_integration?.may_promote !== false) errors.push('speculative integration may not promote');
  if (policy.completion?.success !== 'LIVE & BEWEZEN') errors.push('completion status drift');
  return { ok: errors.length === 0, fingerprint: policy.fingerprint, errors };
}
async function main() { const mode = process.argv[2] ?? '--check'; if (mode !== '--check') { console.error('Usage: node scripts/brain/parallel-engineering-fabric.mjs --check'); process.exitCode = 2; return; } const validation = await validateParallelEngineeringFabric(); console.log(JSON.stringify({ status: validation.ok ? 'PARALLEL_ENGINEERING_READY' : 'PARALLEL_ENGINEERING_BLOCKED', ...validation }, null, 2)); if (!validation.ok) process.exitCode = 1; }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
