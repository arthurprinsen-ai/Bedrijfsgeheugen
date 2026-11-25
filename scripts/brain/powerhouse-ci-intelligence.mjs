import { mkdir, writeFile, appendFile, readFile, readdir } from 'node:fs/promises';
import { calibrateCi, isRequiredCiRun, selectCiRunsForMeasurement, describeCiObservationCoverage } from '../../tools/delivery/ci-calibration-engine.mjs';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repo || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function api(path) {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}: ${await response.text()}`);
  return response.json();
}

async function recentRuns({ maxPages = 3, perPage = 100, since }) {
  const rows = [];
  let pagesFetched = 0;
  let oldestFetchedAt = null;
  let windowComplete = false;
  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await api(`/actions/runs?per_page=${perPage}&page=${page}`);
    const batch = payload.workflow_runs || [];
    pagesFetched += 1;
    if (!batch.length) { windowComplete = true; break; }
    rows.push(...batch.filter(run => Date.parse(run.created_at) >= since));
    oldestFetchedAt = batch.at(-1)?.created_at ?? null;
    const oldest = Date.parse(oldestFetchedAt ?? '');
    if (batch.length < perPage || (Number.isFinite(oldest) && oldest < since)) {
      windowComplete = true;
      break;
    }
  }
  return { rows, pagesFetched, oldestFetchedAt, windowComplete };
}

async function fetchJobRows(runs, concurrency = 8) {
  const rows = [];
  for (let offset = 0; offset < runs.length; offset += concurrency) {
    const batch = runs.slice(offset, offset + concurrency);
    const payloads = await Promise.all(batch.map(run => api(`/actions/runs/${run.id}/jobs?per_page=100`)));
    for (let index = 0; index < batch.length; index += 1) {
      const run = batch[index];
      for (const job of payloads[index].jobs || []) {
        const created = Date.parse(run.created_at);
        const started = job.started_at ? Date.parse(job.started_at) : null;
        const completed = job.completed_at ? Date.parse(job.completed_at) : null;
        rows.push({
          run_id: run.id,
          run_created_at:run.created_at,
          head_sha: run.head_sha,
          workflow: run.name,
          event: run.event,
          conclusion: job.conclusion,
          job: job.name,
          queue_seconds: started ? Math.max(0, Math.round((started - created) / 1000)) : null,
          execution_seconds: started && completed ? Math.max(0, Math.round((completed - started) / 1000)) : null,
        });
      }
    }
  }
  return rows;
}

function eventBlock(source, eventName) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(line => new RegExp(`^  ${eventName}:\\s*`).test(line));
  if (start < 0) return null;
  const block = [lines[start]];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^  [A-Za-z0-9_-]+:\s*/.test(line)) break;
    if (/^[A-Za-z][A-Za-z0-9_-]*:\s*/.test(line)) break;
    block.push(line);
  }
  return block.join('\n');
}

async function directPullRequestWorkflows() {
  const names = (await readdir('.github/workflows')).filter(name => /\.ya?ml$/.test(name)).sort();
  const direct = [];
  for (const name of names) {
    const source = await readFile(`.github/workflows/${name}`, 'utf8');
    const block = eventBlock(source, 'pull_request');
    if (!block) continue;
    const closedOnly = /types:\s*\[\s*closed\s*\]/.test(block);
    if (!closedOnly) direct.push(name);
  }
  return direct;
}

const numeric = (rows, key) => rows.map(row => row[key]).filter(Number.isFinite);
const avg = values => values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : 0;
const p95 = values => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a,b)=>a-b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[Math.min(sorted.length - 1, index)];
};

const now = Date.now();
const since = now - 7 * 24 * 60 * 60 * 1000;
const collected = await recentRuns({ since });
const runs = collected.rows;
const sample = selectCiRunsForMeasurement(runs, { maxRuns: 60, reservedRequired: 12 });
const observationCoverage = describeCiObservationCoverage({
  requestedSince: new Date(since).toISOString(),
  observedAt: new Date(now).toISOString(),
  oldestFetchedAt: collected.oldestFetchedAt,
  complete: collected.windowComplete,
  pagesFetched: collected.pagesFetched,
  fetchedRuns: runs.length,
  sampledRuns: sample.length,
});
const jobRows = await fetchJobRows(sample);

const queues = numeric(jobRows, 'queue_seconds');
const executions = numeric(jobRows, 'execution_seconds');
const failed = jobRows.filter(row => row.conclusion === 'failure').length;
const cancelled = jobRows.filter(row => row.conclusion === 'cancelled').length;
const skipped = jobRows.filter(row => row.conclusion === 'skipped').length;

const workflowFanout = new Map();
for (const run of runs) workflowFanout.set(run.head_sha, (workflowFanout.get(run.head_sha) || 0) + 1);
const fanoutValues = [...workflowFanout.values()];

const duplicateRunGroups = new Map();
for (const run of runs) {
  const key = `${run.head_sha}:${run.event}:${run.name}`;
  duplicateRunGroups.set(key, (duplicateRunGroups.get(key) || 0) + 1);
}
const duplicateWorkflowRuns = [...duplicateRunGroups.values()].reduce((total,count)=>total+Math.max(0,count-1),0);

const requiredRuns = runs.filter(isRequiredCiRun);
const requiredQueueSeconds = requiredRuns.map(run => {
  const starts = jobRows.filter(row => row.run_id === run.id && Number.isFinite(row.queue_seconds)).map(row => row.queue_seconds);
  return starts.length ? Math.min(...starts) : null;
}).filter(Number.isFinite);
const requiredTotals = requiredRuns
  .map(run => run.status === 'completed' && run.conclusion === 'success' && run.updated_at
    ? Math.max(0, Math.round((Date.parse(run.updated_at) - Date.parse(run.created_at)) / 1000))
    : null)
  .filter(Number.isFinite);

const directPrWorkflows = await directPullRequestWorkflows();
const [openPrs, closedPrs] = await Promise.all([
  api('/pulls?state=open&sort=updated&direction=desc&per_page=100'),
  api('/pulls?state=closed&sort=updated&direction=desc&per_page=100'),
]);
const obligationCounts = new Map();
for (const pr of openPrs || []) {
  const id = String(pr.body || '').match(/^Obligation-ID:\s*(.+)$/m)?.[1]?.trim();
  if (id) obligationCounts.set(id, (obligationCounts.get(id) || 0) + 1);
}
const duplicateOpenObligations = [...obligationCounts.values()].reduce((total,count)=>total+Math.max(0,count-1),0);
const retiredPrChurn = (closedPrs || []).filter(pr =>
  Date.parse(pr.updated_at || 0) >= since &&
  !pr.merged_at &&
  (/^RETIRED\b/i.test(String(pr.title || '')) || /Retirement-State:\s*RETIRED_DO_NOT_MERGE/i.test(String(pr.body || '')))
).length;

const activeNonterminalRuns = runs.filter(run => ['queued','pending','in_progress','waiting','requested'].includes(run.status)).length;
const skippedWorkflowRuns = runs.filter(run => run.status === 'completed' && run.conclusion === 'skipped').length;
const cancelledWorkflowRuns = runs.filter(run => run.status === 'completed' && run.conclusion === 'cancelled').length;

const baseReport = {
  version: 'powerhouse-ci-intelligence-v2',
  observed_at: new Date().toISOString(),
  window_days: 7,
  sampled_runs: sample.length,
  sampled_jobs: jobRows.length,
  observation_coverage: observationCoverage,
  metrics: {
    queue_wait_sample_count: queues.length,
    execution_sample_count: executions.length,
    required_queue_sample_count: requiredQueueSeconds.length,
    observed_required_run_count: requiredRuns.length,
    measured_required_run_count: sample.filter(isRequiredCiRun).length,
    observation_seven_day_complete: observationCoverage.seven_day_coverage_complete,
    required_total_sample_count: requiredTotals.length,
    queue_wait_seconds_avg: avg(queues),
    queue_wait_seconds_p95: p95(queues),
    execution_seconds_avg: avg(executions),
    execution_seconds_p95: p95(executions),
    required_queue_wait_seconds_p95: p95(requiredQueueSeconds),
    required_total_seconds_p95: p95(requiredTotals),
    required_failures_7d: requiredRuns.filter(run => run.conclusion === 'failure').length,
    required_cancelled_7d: requiredRuns.filter(run => run.conclusion === 'cancelled').length,
    failed_jobs: failed,
    cancelled_jobs: cancelled,
    skipped_jobs: skipped,
    // Skip is a routing decision, not a billed runner execution.
    known_cancelled_runner_seconds: jobRows.filter(row => row.conclusion === 'cancelled').reduce((sum, row) => sum + (row.execution_seconds ?? 0), 0),
    known_skipped_runner_seconds: 0,
    skipped_workflow_runs_7d: skippedWorkflowRuns,
    cancelled_workflow_runs_7d: cancelledWorkflowRuns,
    duplicate_workflow_runs_7d: duplicateWorkflowRuns,
    active_nonterminal_runs: activeNonterminalRuns,
    workflow_fanout_per_sha_avg: avg(fanoutValues),
    workflow_fanout_per_sha_p95: p95(fanoutValues),
    direct_pull_request_workflow_count: directPrWorkflows.length,
    duplicate_open_obligations: duplicateOpenObligations,
    retired_pr_churn_7d: retiredPrChurn,
  },
  slo: {
    required_queue_wait_seconds_p95: 30,
    required_total_seconds_p95: 120,
    max_pr_workflows_per_head: 5,
    direct_pull_request_workflow_target: 2,
    agent_external_wait_budget_seconds: 30,
    unchanged_state_no_repoll_seconds: 120,
  },
  architecture: {
    direct_pull_request_workflows: directPrWorkflows,
    open_obligation_counts: Object.fromEntries([...obligationCounts.entries()].sort()),
  },
  optimization_policy: {
    bounded_seven_day_fields_are_lower_bounds_if_incomplete: true,
    required_run_name_accepts_pr_run_name: true,
    stale_same_pr_runs_cancelled: true,
    required_gate_is_canonical: true,
    direct_pr_workflow_budget_is_monotonic: true,
    lane_scoped_execution: true,
    deterministic_dependency_cache: true,
    website_netlify_preview_reuse: true,
    local_browser_build_is_fallback_only: true,
    duplicate_preflight_domain_checks_removed: true,
    safety_gates_may_not_be_auto_weakened: true,
  },
  jobs: jobRows,
};

// Existing tuning config is the experiment authority; never invent a separate store.
const tuningState=JSON.parse(await readFile('config/powerhouse-engineering-tuning.json','utf8'));
const trialStart=tuningState.tuning_trial?.status==='PENDING'
  ? Date.parse(tuningState.tuning_trial.started_at ?? '') : NaN;
const trialJobs=Number.isFinite(trialStart)
  ? jobRows.filter(row=>Date.parse(row.run_created_at ?? '')>=trialStart) : [];
const trialRequired=Number.isFinite(trialStart)
  ? requiredRuns.filter(run=>Date.parse(run.created_at)>=trialStart && run.status==='completed' && run.conclusion==='success') : [];
const trialRequiredFailures=Number.isFinite(trialStart)
  ? requiredRuns.filter(run=>Date.parse(run.created_at)>=trialStart && run.status==='completed' && run.conclusion==='failure').length : 0;
const trialRequiredTotals=trialRequired.map(run=>
  Number.isFinite(Date.parse(run.updated_at ?? ''))
    ? Math.max(0,Math.round((Date.parse(run.updated_at)-Date.parse(run.created_at))/1000))
    : null).filter(Number.isFinite);
baseReport.post_change={
  started_at:Number.isFinite(trialStart)?new Date(trialStart).toISOString():null,
  sampled_jobs:trialJobs.length,
  queue_sample_count:trialJobs.filter(row=>Number.isFinite(row.queue_seconds)).length,
  required_count:trialRequiredTotals.length,
  required_failures:trialRequiredFailures,
  required_total_seconds_p95:trialRequiredTotals.length?p95(trialRequiredTotals):null,
  failed_jobs:trialJobs.filter(row=>row.conclusion==='failure').length,
  source:'github_observed_jobs_for_current_tuning_trial',
  attribution:'observational_only'
};

const calibrationPolicy = JSON.parse(await readFile('config/powerhouse-ci-calibration-v1.json','utf8'));
const calibration = calibrateCi({ report: baseReport, policy: calibrationPolicy });
const report = { ...baseReport, calibration };

await mkdir('artifacts/ci-intelligence', { recursive: true });
await writeFile('artifacts/ci-intelligence/latest.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.metrics, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const m = report.metrics;
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `## Powerhouse CI Intelligence v2\n\n- Observation coverage: **${report.observation_coverage.interpretation}** (${report.observation_coverage.actual_observed_window_hours ?? 'unknown'}h observed; ${report.observation_coverage.sampled_runs} runs sampled)\n- Required runs observed / measured: **${m.observed_required_run_count} / ${m.measured_required_run_count}**\n- Required queue p95 / total p95: **${m.required_queue_wait_seconds_p95}s / ${m.required_total_seconds_p95}s**\n- Queue avg / p95: **${m.queue_wait_seconds_avg}s / ${m.queue_wait_seconds_p95}s**\n- Execution avg / p95: **${m.execution_seconds_avg}s / ${m.execution_seconds_p95}s**\n- Fan-out per SHA avg / p95: **${m.workflow_fanout_per_sha_avg} / ${m.workflow_fanout_per_sha_p95}**\n- Direct PR workflows / target: **${m.direct_pull_request_workflow_count} / 2**\n- Duplicate workflow runs / open obligations: **${m.duplicate_workflow_runs_7d} / ${m.duplicate_open_obligations}**\n- Retired PR churn (7d): **${m.retired_pr_churn_7d}**\n- Failed / cancelled / skipped jobs: **${m.failed_jobs} / ${m.cancelled_jobs} / ${m.skipped_jobs}**\n- Calibration recommendations: **${report.calibration.recommendations.length}** (mode: ${report.calibration.mode})\n`);
}
