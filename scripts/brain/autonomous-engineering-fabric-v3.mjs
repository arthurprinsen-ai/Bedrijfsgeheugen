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

const TUNABLE_KEYS = Object.freeze(['max_parallel_packages','candidate_batch_window_seconds','fast_path_target_seconds','speculative_execution_threshold']);
const HOUR_MS = 60 * 60 * 1000;

/**
 * Observational feedback, not an unqualified causal claim.
 * An optimizer action can be confirmed or rolled back only after comparable
 * post-change job and Required samples have actually been observed.
 */
export function assessTuningExperiment({trial = null, observedAt = null, postChange = {}} = {}) {
  if (!trial || trial.status !== 'PENDING') return Object.freeze({status:'NO_PENDING_TRIAL'});
  const start = Date.parse(trial.started_at ?? '');
  const now = Date.parse(observedAt ?? '');
  const eligible = Number.isFinite(start) && Number.isFinite(now) && now >= start + 30 * HOUR_MS
    && Number(postChange.sampled_jobs ?? 0) >= 20
    && Number(postChange.required_count ?? 0) >= 5
    && Number(postChange.queue_sample_count ?? 0) >= 10;
  const baselineTotal = Number(trial.baseline?.required_total_seconds_p95);
  const afterTotal = Number(postChange.required_total_seconds_p95);
  const baselineFailure = Number(trial.baseline?.failure_rate);
  const afterFailure = Number(postChange.failed_jobs) / Math.max(1, Number(postChange.sampled_jobs));
  if (!eligible || !Number.isFinite(baselineTotal) || baselineTotal <= 0
    || !Number.isFinite(afterTotal) || afterTotal <= 0
    || !Number.isFinite(baselineFailure) || baselineFailure < 0) {
    return Object.freeze({status:'AWAITING_EVIDENCE',post_change_jobs:Number(postChange.sampled_jobs ?? 0)});
  }
  const totalDelta = afterTotal - baselineTotal;
  const failureDelta = afterFailure - baselineFailure;
  const regressed = totalDelta > Math.max(30, 0.25 * baselineTotal)
    || (failureDelta > 0.05 && Number(postChange.failed_jobs ?? 0) >= 3);
  return Object.freeze({
    status: regressed ? 'REGRESSION_OBSERVED' : 'NONREGRESSION_OBSERVED',
    attribution:'observational_only_uncontrolled_workload',
    delta_required_p95_seconds: Number(totalDelta.toFixed(2)),
    delta_failure_rate: Number(failureDelta.toFixed(4)),
    post_change_jobs:Number(postChange.sampled_jobs),
    post_change_required_runs:Number(postChange.required_count)
  });
}

export function optimizeDailyTuning({ metrics = {}, calibration = {}, current = {}, observedAt = null, postChange = {} } = {}) {
  const next = { ...current };
  const decisions = [];
  const experiment = assessTuningExperiment({trial:current.tuning_trial,observedAt,postChange});
  const trialPending = current.tuning_trial?.status === 'PENDING';
  const optimisticTuningBlocked = trialPending || current.source === 'daily-autonomous-optimizer' && current.updated_at && Number.isFinite(Date.parse(observedAt ?? '')) && Date.parse(observedAt) - Date.parse(current.updated_at) < 30 * HOUR_MS;
  const queueP95 = Number(metrics.queue_wait_seconds_p95 ?? 0);
  const executionP95 = Number(metrics.execution_seconds_p95 ?? 0);
  const cancelled = Number(metrics.cancelled_jobs ?? 0);
  const failed = Number(metrics.failed_jobs ?? 0);
  const skipped = Number(metrics.skipped_jobs ?? 0);
  // No autonomous runtime tuning on missing or statistically thin runner evidence.
  // A correctly skipped lane has no execution time: never count it as runner waste.
  const sampledJobs = Number(metrics.sampled_jobs ?? metrics.total_jobs ?? 0);
  const jobs = Math.max(1, sampledJobs);
  const evidenceReady = Number.isInteger(sampledJobs) && sampledJobs >= 20
    && Number(metrics.queue_wait_sample_count ?? sampledJobs) >= 10
    && Number(metrics.execution_sample_count ?? sampledJobs) >= 10
    && Number(metrics.required_queue_sample_count ?? 1) >= 1
    && Number(metrics.required_total_sample_count ?? 1) >= 1
    && ['queue_wait_seconds_p95', 'execution_seconds_p95'].every(key =>
      typeof metrics[key] === 'number' && Number.isFinite(metrics[key]) && metrics[key] >= 0);
  const observedTime = Date.parse(observedAt ?? '');
  const lastChangeTime = Date.parse(current.updated_at ?? '');
  const tuningCooldown = current.source === 'daily-autonomous-optimizer'
    && Number.isFinite(observedTime) && Number.isFinite(lastChangeTime)
    && observedTime >= lastChangeTime && observedTime - lastChangeTime < 30 * 60 * 60 * 1000;
  if (!evidenceReady) decisions.push('insufficient-runner-evidence-no-runtime-tuning');
  if (tuningCooldown) decisions.push('tuning-cooldown-collect-post-change-evidence');
  if (trialPending) decisions.push('tuning-trial-awaits-comparable-post-change-evidence');
  const failureRate = failed / jobs;
  const skippedRate = skipped / jobs;
  const fanoutP95 = Number(metrics.workflow_fanout_per_sha_p95 ?? 0);
  const requiredQueueP95 = Number(metrics.required_queue_wait_seconds_p95 ?? queueP95);
  const requiredTotalP95 = Number(metrics.required_total_seconds_p95 ?? executionP95);
  const directPrWorkflowCount = Number(metrics.direct_pull_request_workflow_count ?? 0);
  const duplicateWorkflowRuns = Number(metrics.duplicate_workflow_runs_7d ?? 0);
  const duplicateOpenObligations = Number(metrics.duplicate_open_obligations ?? 0);
  const retiredPrChurn = Number(metrics.retired_pr_churn_7d ?? 0);

  const calibrationRecommendations = Array.isArray(calibration?.recommendations) ? calibration.recommendations : [];
  const highCalibrationWarnings = calibrationRecommendations.filter(item => item?.priority === 'high');
  const calibrationVeto = highCalibrationWarnings.length > 0;
  const runnerPressure = requiredQueueP95 > 30 || queueP95 > 120 || cancelled > 8;
  const fastGateSloBreach = requiredTotalP95 > 120;
  const orchestrationWaste = fanoutP95 > 5 || duplicateWorkflowRuns > 0 || duplicateOpenObligations > 0;

  const ci = { ...(current.ci ?? {}) };
  const targetDirectPr = 2;
  const priorDirectBudget = Number(ci.direct_pr_workflow_budget ?? Math.max(targetDirectPr, directPrWorkflowCount || targetDirectPr));
  ci.direct_pr_workflow_target = targetDirectPr;
  ci.direct_pr_workflow_budget = directPrWorkflowCount > 0
    ? Math.max(targetDirectPr, Math.min(priorDirectBudget, directPrWorkflowCount))
    : priorDirectBudget;
  ci.max_pr_workflows_per_head = 5;
  ci.required_queue_p95_slo_seconds = 30;
  ci.required_total_p95_slo_seconds = 120;
  ci.agent_external_wait_budget_seconds = 30;
  ci.unchanged_state_no_repoll_seconds = 120;
  ci.architecture_attention_required = directPrWorkflowCount > targetDirectPr || fanoutP95 > 5 || duplicateWorkflowRuns > 0 || duplicateOpenObligations > 0 || retiredPrChurn > 2;
  if (ci.direct_pr_workflow_budget < priorDirectBudget) decisions.push('ratchet-direct-pr-workflow-budget-down');
  if (directPrWorkflowCount > priorDirectBudget) decisions.push('direct-pr-workflow-budget-regression-observed');
  if (fastGateSloBreach) decisions.push('required-fast-gate-slo-breach');

  if (evidenceReady && (runnerPressure || orchestrationWaste || fastGateSloBreach)) {
    const before=Number(next.max_parallel_packages ?? 4);
    next.max_parallel_packages=clamp(before-1,2,8);
    next.candidate_batch_window_seconds=clamp(Number(next.candidate_batch_window_seconds ?? 20)+(orchestrationWaste?10:5),10,60);
    decisions.push(orchestrationWaste?'reduce-fanout-and-batch-more':'reduce-runner-pressure-and-batch-more');
  } else if (evidenceReady && !optimisticTuningBlocked && !calibrationVeto && requiredQueueP95 < 30 && requiredTotalP95 <= 120 && queueP95 < 30 && fanoutP95 <= 5 && failureRate < 0.05) {
    next.max_parallel_packages=clamp(Number(next.max_parallel_packages ?? 4)+1,2,8);
    decisions.push('increase-safe-parallelism');
  }
  if (evidenceReady && executionP95 > 600) {
    next.fast_path_target_seconds=clamp(Number(next.fast_path_target_seconds ?? 45)-5,20,90);
    decisions.push('tighten-fast-path-target');
  }
  if (evidenceReady && failureRate > 0.15) {
    next.speculative_execution_threshold=clamp(Number(next.speculative_execution_threshold ?? 0.75)+0.05,0.6,0.95);
    decisions.push('raise-speculation-confidence-threshold');
  } else if (evidenceReady && !optimisticTuningBlocked && !calibrationVeto && failureRate < 0.03 && requiredQueueP95 < 30 && queueP95 < 60 && fanoutP95 <= 5) {
    next.speculative_execution_threshold=clamp(Number(next.speculative_execution_threshold ?? 0.75)-0.02,0.6,0.95);
    decisions.push('allow-more-safe-speculation');
  }
  const signals=Object.freeze({
    queue_wait_seconds_p95:queueP95,
    execution_seconds_p95:executionP95,
    required_queue_wait_seconds_p95:requiredQueueP95,
    required_total_seconds_p95:requiredTotalP95,
    workflow_fanout_per_sha_p95:fanoutP95,
    direct_pull_request_workflow_count:directPrWorkflowCount,
    direct_pr_workflow_budget:ci.direct_pr_workflow_budget,
    duplicate_workflow_runs_7d:duplicateWorkflowRuns,
    duplicate_open_obligations:duplicateOpenObligations,
    retired_pr_churn_7d:retiredPrChurn,
    failure_rate:Number(failureRate.toFixed(4)),
    skipped_rate:Number(skippedRate.toFixed(4)),
    sampled_jobs:sampledJobs,
    evidence_ready:evidenceReady,
    cooldown_active:tuningCooldown,
    prior_trial_status:experiment.status,
    calibration_mode:String(calibration?.mode || 'NONE'),
    calibration_high_priority_recommendations:Object.freeze(highCalibrationWarnings.map(item => String(item.id || '')).filter(Boolean))
  });
  next.ci=ci;
  next.safety={ ...(current.safety ?? {}), required_release_gate:true, security_gate:true, production_readback:true, protected_merge:true, exact_sha_identity:true, autonomous_gate_weakening_forbidden:true };

  if (experiment.status === 'REGRESSION_OBSERVED' || experiment.status === 'NONREGRESSION_OBSERVED') {
    // Close this trial before considering another tuning wave. One observation
    // is not proof of causality, but strong deterioration is a safe rollback signal.
    if (experiment.status === 'REGRESSION_OBSERVED') {
      for (const key of TUNABLE_KEYS) {
        const prior = current.tuning_trial?.previous_tuning?.[key];
        if (Number.isFinite(prior)) next[key]=prior;
      }
      decisions.push('rollback-observed-ci-tuning-regression');
    } else {
      for (const key of TUNABLE_KEYS) next[key]=current[key];
      decisions.push('confirm-observed-no-regression-not-causal');
    }
    next.tuning_trial={
      ...current.tuning_trial,
      status:experiment.status === 'REGRESSION_OBSERVED' ? 'ROLLED_BACK_OBSERVATIONAL' : 'CLOSED_NONREGRESSION_OBSERVED',
      evaluated_at:observedAt,
      evidence:experiment
    };
  } else if (evidenceReady && Number.isFinite(Date.parse(observedAt ?? ''))
      && TUNABLE_KEYS.some(key => next[key] !== current[key])) {
    next.tuning_trial={
      status:'PENDING',
      started_at:observedAt,
      previous_tuning:Object.fromEntries(TUNABLE_KEYS.map(key=>[key,current[key]])),
      baseline:{
        required_total_seconds_p95:requiredTotalP95,
        failure_rate:Number(failureRate.toFixed(4)),
        sampled_jobs:sampledJobs
      },
      supersedes_started_at:trialPending ? current.tuning_trial.started_at : null,
      decisions:[...decisions],
      attribution:'not_yet_evaluated'
    };
  }
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
  for(const key of ['required_release_gate','security_gate','production_readback','protected_merge','exact_sha_identity','autonomous_gate_weakening_forbidden']) if(tuning.safety?.[key]!==true) errors.push(`safety drift: ${key}`);
  if(Number(tuning.ci?.direct_pr_workflow_target ?? 0)!==2) errors.push('direct PR workflow target must be 2');
  if(Number(tuning.ci?.direct_pr_workflow_budget ?? 0)<2) errors.push('direct PR workflow budget cannot drop below Required + CodeQL');
  if(Number(tuning.ci?.max_pr_workflows_per_head ?? 0)!==5) errors.push('PR workflow head budget must remain 5');
  if(Number(tuning.ci?.required_queue_p95_slo_seconds ?? 0)!==30) errors.push('Required queue p95 SLO must remain 30s');
  if(Number(tuning.ci?.required_total_p95_slo_seconds ?? 0)!==120) errors.push('Required total p95 SLO must remain 120s');
  if(Number(tuning.ci?.agent_external_wait_budget_seconds ?? 0)!==30) errors.push('agent external wait budget must remain 30s');
  if(Number(tuning.ci?.unchanged_state_no_repoll_seconds ?? 0)!==120) errors.push('unchanged-state no-repoll budget must remain 120s');
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
    const result=optimizeDailyTuning({metrics:{...metricsDoc.metrics,sampled_jobs:metricsDoc.sampled_jobs},calibration:metricsDoc.calibration || {},current,observedAt:metricsDoc.observed_at,postChange:metricsDoc.post_change || {}});
    const out={...result,observed_at:new Date().toISOString(),source_metrics:metricsDoc.metrics};
    await mkdir(path.join(repoRoot,'artifacts/engineering-optimizer'),{recursive:true});
    await writeFile(path.join(repoRoot,'artifacts/engineering-optimizer/latest.json'),JSON.stringify(out,null,2)+'\n');
    const proposed = result.changed
      ? {...result.tuning,updated_at:new Date().toISOString(),source:'daily-autonomous-optimizer'}
      : current;
    await writeFile(path.join(repoRoot,'artifacts/engineering-optimizer/proposed-tuning.json'),JSON.stringify(proposed,null,2)+'\n');
    console.log(JSON.stringify(out,null,2));
    return;
  }
  throw new Error('Usage: --check | --optimize [ci-intelligence-json]');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error);process.exitCode=1;});
