import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const DAY_MS = 86_400_000;

const measured = (value, provenance = []) => ({ value, status: 'measured', provenance });
const unknown = (provenance = []) => ({ value: null, status: 'unknown', provenance });

function average(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((a, b) => a + b, 0) / finite.length : null;
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function msBetween(start, end) {
  const a = Date.parse(start ?? '');
  const b = Date.parse(end ?? '');
  return Number.isFinite(a) && Number.isFinite(b) && b >= a ? b - a : null;
}

export function detectFlakyTests(observations = []) {
  const groups = new Map();
  for (const item of observations) {
    if (!item?.test_id || !item?.source_revision || !['pass', 'fail'].includes(item?.outcome)) continue;
    const key = `${item.test_id}@@${item.source_revision}`;
    if (!groups.has(key)) groups.set(key, { test_id:item.test_id, source_revision:item.source_revision, outcomes:[] });
    groups.get(key).outcomes.push(item.outcome);
  }
  const flaky = [...groups.values()]
    .filter(group => new Set(group.outcomes).size > 1)
    .map(group => ({ test_id:group.test_id, source_revision:group.source_revision, observations:group.outcomes.length, fail_rate:group.outcomes.filter(x => x === 'fail').length / group.outcomes.length, classification:'same_revision_oscillation' }))
    .sort((a,b) => a.test_id.localeCompare(b.test_id) || a.source_revision.localeCompare(b.source_revision));
  return { flaky, flake_rate:groups.size ? flaky.length / groups.size : null, can_override_required_failure:false, policy:'diagnostic_only_never_rerun_until_green' };
}

export function computeEngineeringScorecard(input = {}) {
  const changes = Array.isArray(input.changes) ? input.changes : [];
  const gates = Array.isArray(input.gates) ? input.gates : [];
  const testObservations = Array.isArray(input.test_observations) ? input.test_observations : [];
  const escapedDefects = Array.isArray(input.escaped_defects) ? input.escaped_defects : [];
  const deployments = changes.filter(change => change?.deployed_at);
  const changeLead = average(changes.map(change => msBetween(change.committed_at, change.deployed_at)));
  const ideaLead = average(changes.map(change => msBetween(change.idea_at, change.live_proven_at)));
  const recovery = average(changes.filter(change => change.failed).map(change => msBetween(change.deployed_at, change.recovered_at)));
  const failedCount = deployments.filter(change => change.failed).length;
  const reworkCount = deployments.filter(change => change.rework === true).length;
  const deployedTimes = deployments.map(change => Date.parse(change.deployed_at)).filter(Number.isFinite).sort((a,b) => a - b);
  let deploymentFrequency = null;
  if (deployedTimes.length === 1) deploymentFrequency = 1;
  if (deployedTimes.length > 1) {
    const spanDays = Math.max((deployedTimes.at(-1) - deployedTimes[0]) / DAY_MS, 1);
    deploymentFrequency = deployedTimes.length / spanDays;
  }
  const gateLatency = median(gates.map(gate => Number(gate?.duration_ms ?? gate?.median_duration_ms)));
  const flake = detectFlakyTests(testObservations);
  const metrics = {
    change_lead_time_ms: changeLead === null ? unknown(['changes.committed_at','changes.deployed_at']) : measured(changeLead,['changes']),
    deployment_frequency_per_day: deploymentFrequency === null ? unknown(['changes.deployed_at']) : measured(deploymentFrequency,['changes']),
    failed_deployment_recovery_time_ms: recovery === null ? unknown(['changes.failed','changes.recovered_at']) : measured(recovery,['changes']),
    change_fail_rate: deployments.length ? measured(failedCount / deployments.length,['changes']) : unknown(['changes.deployed_at','changes.failed']),
    deployment_rework_rate: deployments.length ? measured(reworkCount / deployments.length,['changes']) : unknown(['changes.rework']),
    idea_to_live_bewezen_ms: ideaLead === null ? unknown(['changes.idea_at','changes.live_proven_at']) : measured(ideaLead,['changes']),
    test_flake_rate: flake.flake_rate === null ? unknown(['test_observations']) : measured(flake.flake_rate,['test_observations']),
    escaped_defect_rate: changes.length ? measured(escapedDefects.length / changes.length,['escaped_defects','changes']) : unknown(['escaped_defects','changes']),
    gate_latency_ms: gateLatency === null ? unknown(['gates.duration_ms']) : measured(gateLatency,['gates']),
  };
  const all = Object.values(metrics);
  return { fingerprint:'powerhouse-engineering-scorecard-v1', metrics, evidence_completeness:all.filter(metric => metric.status === 'measured').length / all.length, truth_rule:'unknown_is_not_zero' };
}

export function buildDependencyGraph({nodes = [], edges = []} = {}) {
  const uniqueNodes = [...new Set(nodes.map(String))].sort();
  const nodeSet = new Set(uniqueNodes);
  const normalizedEdges = [];
  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2) throw new TypeError('Each dependency edge must be [dependent, dependency]');
    const dependent = String(edge[0]);
    const dependency = String(edge[1]);
    if (!nodeSet.has(dependent) || !nodeSet.has(dependency)) throw new Error(`Unknown dependency node: ${dependent} -> ${dependency}`);
    normalizedEdges.push([dependent,dependency]);
  }
  normalizedEdges.sort((a,b) => `${a[0]}\u0000${a[1]}`.localeCompare(`${b[0]}\u0000${b[1]}`));
  return Object.freeze({nodes:uniqueNodes,edges:normalizedEdges,edge_semantics:'[dependent, dependency]'});
}

export function computeBlastRadius(graph, seeds = []) {
  const known = new Set(graph?.nodes ?? []);
  const impacted = new Set(seeds.map(String).filter(seed => known.has(seed)));
  const queue = [...impacted];
  while (queue.length) {
    const dependency = queue.shift();
    for (const [dependent, dependsOn] of graph?.edges ?? []) if (dependsOn === dependency && !impacted.has(dependent)) { impacted.add(dependent); queue.push(dependent); }
  }
  return [...impacted].sort();
}

export function evaluateRecoveryProof({now = new Date().toISOString(), max_age_days = 90, required_domains = [], evidence = []} = {}) {
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new TypeError('now must be an ISO timestamp');
  const latestByDomain = new Map();
  for (const item of evidence) {
    if (!item?.domain || !item?.rehearsed_at) continue;
    const at = Date.parse(item.rehearsed_at);
    if (!Number.isFinite(at)) continue;
    const previous = latestByDomain.get(item.domain);
    if (!previous || at > Date.parse(previous.rehearsed_at)) latestByDomain.set(item.domain,item);
  }
  const domains = {};
  const blocking = [];
  for (const domain of required_domains) {
    const item = latestByDomain.get(domain);
    if (!item) { domains[domain] = {status:'missing',success:false,age_days:null}; blocking.push(domain); continue; }
    const ageDays = Math.max(0,(nowMs - Date.parse(item.rehearsed_at)) / DAY_MS);
    const fresh = ageDays <= max_age_days;
    const ok = item.success === true && fresh;
    domains[domain] = {status:ok ? 'proven' : item.success === true ? 'stale' : 'failed',success:item.success === true,age_days:ageDays,evidence:item};
    if (!ok) blocking.push(domain);
  }
  return {recovery_proven:blocking.length === 0 && required_domains.length > 0,max_age_days,domains,blocking_domains:blocking.sort(),policy:'fresh_successful_bounded_rehearsal_required'};
}

const scaffoldDefinitions = Object.freeze({
  frontend: slug => [`components/${slug}/${slug}.js`,`tests/site-shell-${slug}.test.mjs`,`docs/changes/${slug}.md`],
  backend: slug => [`scripts/brain/${slug}.mjs`,`tests/brain-${slug}.test.mjs`,`docs/changes/${slug}.md`],
  migration: slug => [`supabase/migrations/{UTC_TIMESTAMP}_${slug}.sql`,`tests/supabase-${slug}.test.mjs`,`docs/changes/${slug}.md`],
  agent: slug => [`brain/agents/${slug}.mjs`,`tests/brain-agent-${slug}.test.mjs`,`docs/changes/${slug}.md`],
  integration: slug => [`scripts/brain/integration-${slug}.mjs`,`tests/brain-integration-${slug}.test.mjs`,`docs/changes/${slug}.md`],
});

function slugify(name) {
  const slug = String(name ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if (!slug) throw new TypeError('scaffold name must contain letters or numbers');
  return slug;
}

export function createGoldenPathScaffold(kind,name) {
  if (!scaffoldDefinitions[kind]) throw new RangeError(`Unsupported scaffold kind: ${kind}`);
  const slug = slugify(name);
  return {kind,name:slug,files:scaffoldDefinitions[kind](slug),hooks:['contract','test','observability','documentation','rollback','readback'],delivery:'BRAIN-DELIVERY-v2',parallel_authority_created:false};
}

export function evaluateEngineeringMetaLearning({gates = [], escaped_defects = [], flake_rate = null} = {}) {
  const recommendations = [];
  for (const gate of gates) {
    const runs = Number(gate?.runs ?? 0);
    if (!gate?.id || runs <= 0) continue;
    const caught = Number(gate.caught_defects ?? 0);
    const falseFailures = Number(gate.false_failures ?? 0);
    const falseFailureRate = falseFailures / runs;
    if (caught > 0) recommendations.push({gate:gate.id,action:'preserve_and_optimize_runtime',evidence:{runs,caught_defects:caught},promotion:'protected_delivery_required'});
    if (falseFailureRate >= 0.05) recommendations.push({gate:gate.id,action:'investigate_flake_or_environment_root_cause',evidence:{runs,false_failures:falseFailures,false_failure_rate:falseFailureRate},promotion:'protected_delivery_required'});
  }
  for (const defect of escaped_defects) recommendations.push({gate:defect.should_have_been_caught_by ?? null,action:'add_or_strengthen_regression_from_escaped_defect',evidence:{fingerprint:defect.fingerprint ?? 'unknown'},promotion:'protected_delivery_required'});
  if (Number.isFinite(flake_rate) && flake_rate > 0.02) recommendations.push({gate:null,action:'reduce_flake_rate_without_rerun_until_green',evidence:{flake_rate},promotion:'protected_delivery_required'});
  return {direct_mutation_allowed:false,recommendations,promotion_rule:'all_changes_use_existing_engineering_golden_path'};
}

async function readJsonInput(file) {
  if (file) return JSON.parse(await readFile(path.resolve(file),'utf8'));
  if (process.stdin.isTTY) return {};
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text.trim() ? JSON.parse(text) : {};
}

function resolveMigrationTimestamp(file,timestamp = new Date()) {
  if (!file.includes('{UTC_TIMESTAMP}')) return file;
  const digits = timestamp.toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
  return file.replace('{UTC_TIMESTAMP}',digits);
}

async function writeScaffold(scaffold) {
  const written = [];
  for (const raw of scaffold.files) {
    const relative = resolveMigrationTimestamp(raw);
    const absolute = path.join(repoRoot,relative);
    await mkdir(path.dirname(absolute),{recursive:true});
    let content = '';
    if (relative.endsWith('.md')) content = `# ${scaffold.name}\n\nGenerated by powerhouse-engineering-closed-loop-v1.\n`;
    else if (relative.endsWith('.sql')) content = `-- ${scaffold.name}\n-- Source-controlled migration; add the minimal reversible or forward-fix-safe change.\n`;
    else if (relative.endsWith('.test.mjs')) content = `import test from 'node:test';\nimport assert from 'node:assert/strict';\n\ntest('${scaffold.name} contract', () => { assert.ok(true); });\n`;
    else content = `export const capability = ${JSON.stringify(scaffold.name)};\n`;
    await writeFile(absolute,content,{encoding:'utf8',flag:'wx'});
    written.push(relative);
  }
  return written;
}

export function runSelfTest() {
  const score = computeEngineeringScorecard({changes:[{id:'x',committed_at:'2026-01-01T00:00:00Z',deployed_at:'2026-01-01T00:01:00Z'}]});
  const flake = detectFlakyTests([{test_id:'x',source_revision:'s',outcome:'pass'},{test_id:'x',source_revision:'s',outcome:'fail'}]);
  const graph = buildDependencyGraph({nodes:['a','b'],edges:[['b','a']]});
  const recovery = evaluateRecoveryProof({now:'2026-01-02T00:00:00Z',required_domains:['code'],evidence:[{domain:'code',rehearsed_at:'2026-01-01T00:00:00Z',success:true}]});
  return {ok:score.metrics.change_lead_time_ms.status === 'measured' && flake.flaky.length === 1 && computeBlastRadius(graph,['a']).length === 2 && recovery.recovery_proven};
}

async function main() {
  const [mode='--self-test',arg1,arg2,arg3] = process.argv.slice(2);
  if (mode === '--self-test') { const result = runSelfTest(); console.log(JSON.stringify(result,null,2)); if (!result.ok) process.exitCode = 1; return; }
  if (mode === '--scaffold') { const scaffold = createGoldenPathScaffold(arg1,arg2); if (arg3 === '--write') scaffold.written = await writeScaffold(scaffold); console.log(JSON.stringify(scaffold,null,2)); return; }
  const input = await readJsonInput(arg1);
  const handlers = {
    '--scorecard':computeEngineeringScorecard,
    '--flakes':detectFlakyTests,
    '--graph':value => { const graph = buildDependencyGraph(value.graph ?? value); return {graph,blast_radius:computeBlastRadius(graph,value.seeds ?? [])}; },
    '--recovery':evaluateRecoveryProof,
    '--learn':evaluateEngineeringMetaLearning,
  };
  const handler = handlers[mode];
  if (!handler) { console.error('Usage: --self-test | --scorecard [file] | --flakes [file] | --graph [file] | --recovery [file] | --learn [file] | --scaffold <kind> <name> [--write]'); process.exitCode = 2; return; }
  console.log(JSON.stringify(handler(input),null,2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
