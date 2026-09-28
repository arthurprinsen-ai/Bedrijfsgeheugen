import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildExecutionPlan } from './parallel-engineering-fabric.mjs';
import { DEFAULT_AGENT_TEAM } from '../../platform/agents/agent-team.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const uniq = values => [...new Set((values ?? []).map(v => String(v).trim()).filter(Boolean))].sort();
const starts = (p, roots) => roots.some(r => p === r || p.startsWith(r.endsWith('/') ? r : r + '/'));

const R4 = ['supabase/migrations/','supabase/functions/','platform/security/','platform/saas/','.github/workflows/','netlify/functions/stripe','auth/'];
const R3 = ['platform/','brain/','scripts/brain/','config/','tools/brain-delivery-system.mjs','tools/delivery-required-test-suites.mjs'];
const R1 = ['portal-v2/','site/','styles.css','index.html','docs/content/'];
const DOCS = ['docs/','brain/learning/','.agents/skills/'];

export function classifyEngineeringRisk(paths = []) {
  const rows = uniq(paths);
  if (!rows.length) return 'R0';
  if (rows.some(p => starts(p,R4) || /rls|auth|secret|payment|stripe|credential/i.test(p))) return 'R4';
  if (rows.some(p => starts(p,R3))) return 'R3';
  if (rows.every(p => starts(p,DOCS))) return 'R0';
  if (rows.every(p => starts(p,R1) || starts(p,DOCS))) return 'R1';
  return 'R2';
}

function domainHints(paths = []) {
  const p = uniq(paths);
  const domains = new Set();
  if (p.some(x => /portal|site|html|css|frontend|website/i.test(x))) domains.add('Website');
  if (p.some(x => /security|rls|auth|secret/i.test(x))) domains.add('Security');
  if (p.some(x => /supabase|sql|migration|data/i.test(x))) domains.add('Data');
  if (p.some(x => /workflow|automation|github|delivery|agent/i.test(x))) domains.add('Operations');
  if (!domains.size) domains.add('Product');
  return [...domains];
}

function historyWeight(score = {}, observations = 0, minObservations = 5) {
  if (observations < minObservations) return 0;
  const positive = Number(score.first_pass_success ?? 0.5);
  const rework = Number(score.rework_rate ?? 0);
  const ci = Number(score.ci_failure_rate ?? 0);
  const incidents = Number(score.production_incident_rate ?? 0);
  const lead = Number(score.normalized_lead_time ?? 0.5);
  return (positive * 4) - (rework * 2) - (ci * 2) - (incidents * 3) - lead;
}

export function routeEngineeringAgent({ paths = [], capabilities = ['analyze','verify'], scorecard = {}, policy = {} } = {}) {
  const domains = domainHints(paths);
  const minObs = policy?.routing?.minimum_observations_for_history_weight ?? 5;
  const candidates = DEFAULT_AGENT_TEAM.map(agent => {
    const domainMatch = agent.domains.filter(d => domains.includes(d)).length;
    const capabilityMatch = agent.capabilities.filter(c => capabilities.includes(c)).length;
    const history = scorecard[agent.id] ?? {};
    const score = (domainMatch * 10) + (capabilityMatch * 3) + historyWeight(history, Number(history.observations ?? 0), minObs);
    return { agentId:agent.id, score, domainMatch, capabilityMatch };
  }).sort((a,b) => b.score-a.score || a.agentId.localeCompare(b.agentId));
  const eligible = candidates.filter(c => c.domainMatch > 0);
  const selected = eligible[0] ?? candidates[0];
  return Object.freeze({ primaryAgentId:selected.agentId, supportAgentIds:Object.freeze((eligible.length ? eligible : candidates).slice(1,4).map(c=>c.agentId)), domains:Object.freeze(domains), score:selected.score });
}

export function buildClosureManifest({ obligationId, changedPaths = [] } = {}) {
  if (!obligationId) throw new TypeError('obligationId is required');
  const slug = String(obligationId).replace(/[^a-z0-9-]+/gi,'-').toLowerCase();
  return Object.freeze({
    lateBound:true,
    generatedAfterFunctionalCandidate:true,
    outputs:Object.freeze([
      `brain/learning/${slug}.json`,
      `docs/changes/${slug}.md`,
      `docs/development-ledger-events/${slug}.md`
    ]),
    projections:Object.freeze(['skills','system-map','release-evidence']),
    sourcePaths:Object.freeze(uniq(changedPaths))
  });
}

function boundExecutionWaves(execution, maxParallelPackages = 4) {
  const max = clamp(Number(maxParallelPackages || 4), 1, 16);
  const waves = [];
  for (const wave of execution.waves ?? []) {
    for (let i=0;i<wave.length;i+=max) waves.push(wave.slice(i,i+max));
  }
  return { ...execution, waves };
}

export function buildAutonomousEngineeringPlan({ obligationId, baseSha, candidateSha, workPackages = [], deliveryConfig, fabricPolicy, policy, scorecard = {}, tuning = {} } = {}) {
  if (!obligationId) throw new TypeError('obligationId is required');
  const enriched = workPackages.map(pkg => {
    const paths = uniq(pkg.paths);
    const route = routeEngineeringAgent({ paths, capabilities:pkg.capabilities ?? ['analyze','verify'], scorecard, policy });
    return { ...pkg, baseSha:pkg.baseSha ?? baseSha, candidateSha:pkg.candidateSha ?? candidateSha, specialist:pkg.specialist ?? route.primaryAgentId, agentRoute:route, riskClass:classifyEngineeringRisk(paths) };
  });
  const rawExecution = buildExecutionPlan({ workPackages:enriched, deliveryConfig, policy:fabricPolicy });
  const execution = boundExecutionWaves(rawExecution, tuning.max_parallel_packages ?? 4);
  const allPaths = uniq(enriched.flatMap(p=>p.paths ?? []));
  return Object.freeze({
    fingerprint:'powerhouse-autonomous-engineering-plan-v3',
    obligationId,
    riskClass:classifyEngineeringRisk(allPaths),
    singleIntegratedCandidate:true,
    candidateWriter:'agent-integration-engineer',
    branchUpdatePolicy:'one-coherent-wave-at-a-time',
    execution,
    closure:buildClosureManifest({ obligationId, changedPaths:allPaths })
  });
}

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function optimizeDailyTuning({ metrics = {}, calibration = {}, current = {} } = {}) {
  const next = { ...current };
  const decisions = [];
  const queueP95 = Number(metrics.queue_wait_seconds_p95 ?? 0);
  const executionP95 = Number(metrics.execution_seconds_p95 ?? 0);
  const cancelled = Number(metrics.cancelled_jobs ?? 0);
  const failed = Number(metrics.failed_jobs ?? 0);
  const skipped = Number(metrics.skipped_jobs ?? 0);
  const jobs = Math.max(1, Number(metrics.sampled_jobs ?? metrics.total_jobs ?? 1));
  const failureRate = failed / jobs;
  const skippedRate = skipped / jobs;
  const fanoutP95 = Number(metrics.workflow_fanout_per_sha_p95 ?? 0);

  const calibrationRecommendations = Array.isArray(calibration?.recommendations) ? calibration.recommendations : [];
  const highCalibrationWarnings = calibrationRecommendations.filter(item => item?.priority === 'high');
  const calibrationVeto = highCalibrationWarnings.length > 0;
  const runnerPressure = queueP95 > 120 || cancelled > 8;
  const orchestrationWaste = fanoutP95 > 10 || skippedRate > 0.45;

  if (runnerPressure || orchestrationWaste) {
    const before=Number(next.max_parallel_packages ?? 4);
    next.max_parallel_packages=clamp(before-1,2,8);
    next.candidate_batch_window_seconds=clamp(Number(next.candidate_batch_window_seconds ?? 20)+(orchestrationWaste?10:5),10,60);
    decisions.push(orchestrationWaste?'reduce-fanout-and-batch-more':'reduce-runner-pressure-and-batch-more');
  } else if (!calibrationVeto && queueP95 < 30 && fanoutP95 <= 6 && failureRate < 0.05 && skippedRate < 0.25) {
    next.max_parallel_packages=clamp(Number(next.max_parallel_packages ?? 4)+1,2,8);
    decisions.push('increase-safe-parallelism');
  }
  if (executionP95 > 600) {
    next.fast_path_target_seconds=clamp(Number(next.fast_path_target_seconds ?? 45)-5,20,90);
    decisions.push('tighten-fast-path-target');
  }
  if (failureRate > 0.15) {
    next.speculative_execution_threshold=clamp(Number(next.speculative_execution_threshold ?? 0.75)+0.05,0.6,0.95);
    decisions.push('raise-speculation-confidence-threshold');
  } else if (!calibrationVeto && failureRate < 0.03 && queueP95 < 60 && fanoutP95 <= 6) {
    next.speculative_execution_threshold=clamp(Number(next.speculative_execution_threshold ?? 0.75)-0.02,0.6,0.95);
    decisions.push('allow-more-safe-speculation');
  }
  const signals=Object.freeze({
    queue_wait_seconds_p95:queueP95,
    execution_seconds_p95:executionP95,
    workflow_fanout_per_sha_p95:fanoutP95,
    failure_rate:Number(failureRate.toFixed(4)),
    skipped_rate:Number(skippedRate.toFixed(4)),
    calibration_mode:String(calibration?.mode || 'NONE'),
    calibration_high_priority_recommendations:Object.freeze(highCalibrationWarnings.map(item => String(item.id || '')).filter(Boolean))
  });
  next.safety={ ...(current.safety ?? {}), required_release_gate:true, security_gate:true, production_readback:true, protected_merge:true, exact_sha_identity:true };
  return Object.freeze({ changed:JSON.stringify(next)!==JSON.stringify(current), decisions:Object.freeze(decisions), signals, tuning:Object.freeze(next) });
}

export async function validateAutonomousEngineeringFabricV3() {
  const policy=JSON.parse(await readFile(path.join(repoRoot,'config/powerhouse-autonomous-engineering-fabric-v3.json'),'utf8'));
  const tuning=JSON.parse(await readFile(path.join(repoRoot,'config/powerhouse-engineering-tuning.json'),'utf8'));
  const errors=[];
  if(policy.fingerprint!=='powerhouse-autonomous-engineering-fabric-v3') errors.push('fingerprint drift');
  if(policy.version!==3) errors.push('version drift');
  if(policy.authority?.creates_parallel_authority!==false) errors.push('parallel authority forbidden');
  if(policy.planning?.integration_agent_is_only_candidate_writer!==true) errors.push('single integration writer required');
  if(policy.testing?.impact_graph_required!==true) errors.push('impact graph required');
  if(policy.testing?.full_release_gate_preserved!==true) errors.push('full release gate required');
  if(policy.closure_compiler?.late_bound!==true) errors.push('closure must be late bound');
  if(policy.daily_optimizer?.enabled!==true) errors.push('daily optimizer required');
  if(policy.daily_optimizer?.auto_merge_only_after_protected_gates!==true) errors.push('protected-gate auto merge required');
  for(const key of ['required_release_gate','security_gate','production_readback','protected_merge','exact_sha_identity']) if(tuning.safety?.[key]!==true) errors.push(`safety drift: ${key}`);
  return { ok:errors.length===0, errors, fingerprint:policy.fingerprint };
}

async function main(){
  const mode=process.argv[2] ?? '--check';
  if(mode==='--check'){
    const result=await validateAutonomousEngineeringFabricV3();
    console.log(JSON.stringify({status:result.ok?'AUTONOMOUS_ENGINEERING_READY':'AUTONOMOUS_ENGINEERING_BLOCKED',...result},null,2));
    if(!result.ok) process.exitCode=1;
    return;
  }
  if(mode==='--optimize'){
    const metricsPath=process.argv[3] ?? 'artifacts/ci-intelligence/latest.json';
    const [metricsRaw,currentRaw]=await Promise.all([
      readFile(path.resolve(repoRoot,metricsPath),'utf8'),
      readFile(path.join(repoRoot,'config/powerhouse-engineering-tuning.json'),'utf8')
    ]);
    const metricsDoc=JSON.parse(metricsRaw);
    const current=JSON.parse(currentRaw);
    const result=optimizeDailyTuning({metrics:{...metricsDoc.metrics,sampled_jobs:metricsDoc.sampled_jobs},calibration:metricsDoc.calibration || {},current});
    const out={...result,observed_at:new Date().toISOString(),source_metrics:metricsDoc.metrics};
    await mkdir(path.join(repoRoot,'artifacts/engineering-optimizer'),{recursive:true});
    await writeFile(path.join(repoRoot,'artifacts/engineering-optimizer/latest.json'),JSON.stringify(out,null,2)+'\n');
    await writeFile(path.join(repoRoot,'artifacts/engineering-optimizer/proposed-tuning.json'),JSON.stringify({...result.tuning,updated_at:new Date().toISOString(),source:'daily-autonomous-optimizer'},null,2)+'\n');
    console.log(JSON.stringify(out,null,2));
    return;
  }
  throw new Error('Usage: --check | --optimize [ci-intelligence-json]');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error);process.exitCode=1;});
