import { mkdir, writeFile, appendFile, readFile, readdir } from 'node:fs/promises';
import { calibrateCi } from '../../tools/delivery/ci-calibration-engine.mjs';

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

const now = Date.now();
const since = now - 7 * 24 * 60 * 60 * 1000;
const runsPayload = await api('/actions/runs?per_page=100');
const mergeGroupPayload = await api('/actions/runs?event=merge_group&per_page=100');
const runs = (runsPayload.workflow_runs || []).filter(run => Date.parse(run.created_at) >= since);
const mergeGroupRuns = (mergeGroupPayload.workflow_runs || []).filter(run => Date.parse(run.created_at) >= since);
const requiredMergeGroupRuns = mergeGroupRuns.filter(run => run.name === 'Required test');
const requiredMergeGroupSuccesses = requiredMergeGroupRuns.filter(run => run.status === 'completed' && run.conclusion === 'success').length;
const requiredMergeGroupFailures = requiredMergeGroupRuns.filter(run => run.status === 'completed' && run.conclusion && run.conclusion !== 'success' && run.conclusion !== 'cancelled' && run.conclusion !== 'skipped').length;
const mergeGroupReady = requiredMergeGroupSuccesses >= 3 && requiredMergeGroupFailures === 0;

const workflowFiles = (await readdir('.github/workflows')).filter(name => /\.ya?ml$/.test(name)).sort();
const directPullRequestWorkflows = [];
for (const name of workflowFiles) {
  const source = await readFile(`.github/workflows/${name}`, 'utf8');
  const match = source.match(/\n  pull_request:\s*\n([\s\S]*?)(?=\n  [A-Za-z0-9_-]+:|\n[A-Za-z][A-Za-z0-9_-]*:|$)/);
  if (!match) continue;
  const block = match[1] || '';
  const closedOnly = /types:\s*\[\s*closed\s*\]/.test(block);
  if (!closedOnly) directPullRequestWorkflows.push(name);
}

const sample = runs.slice(0, 50);
const jobRows = [];

for (const run of sample) {
  const payload = await api(`/actions/runs/${run.id}/jobs?per_page=100`);
  for (const job of payload.jobs || []) {
    const created = Date.parse(run.created_at);
    const started = job.started_at ? Date.parse(job.started_at) : null;
    const completed = job.completed_at ? Date.parse(job.completed_at) : null;
    jobRows.push({
      run_id: run.id,
      workflow: run.name,
      event: run.event,
      conclusion: job.conclusion,
      job: job.name,
      queue_seconds: started ? Math.max(0, Math.round((started - created) / 1000)) : null,
      execution_seconds: started && completed ? Math.max(0, Math.round((completed - started) / 1000)) : null,
    });
  }
}

const numeric = (rows, key) => rows.map(row => row[key]).filter(Number.isFinite);
const avg = values => values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : 0;
const p95 = values => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
};

const queues = numeric(jobRows, 'queue_seconds');
const executions = numeric(jobRows, 'execution_seconds');
const requiredJobs = jobRows.filter(row => row.workflow === 'Required test');
const requiredRuns = runs.filter(run => run.name === 'Required test');
const requiredTotals = requiredRuns
  .map(run => run.status === 'completed' && run.updated_at ? Math.max(0, Math.round((Date.parse(run.updated_at) - Date.parse(run.created_at)) / 1000)) : null)
  .filter(Number.isFinite);
const failed = jobRows.filter(row => row.conclusion === 'failure').length;
const cancelled = jobRows.filter(row => row.conclusion === 'cancelled').length;
const skipped = jobRows.filter(row => row.conclusion === 'skipped').length;
const workflowFanout = new Map();
for (const run of runs) workflowFanout.set(run.head_sha, (workflowFanout.get(run.head_sha) || 0) + 1);
const fanoutValues = [...workflowFanout.values()];
const eventCount = event => runs.filter(run => run.event === event).length;

const metrics = {
  queue_wait_seconds_avg: avg(queues),
  queue_wait_seconds_p95: p95(queues),
  execution_seconds_avg: avg(executions),
  execution_seconds_p95: p95(executions),
  required_queue_wait_seconds_p95: p95(numeric(requiredJobs, 'queue_seconds')),
  required_total_seconds_p95: p95(requiredTotals),
  failed_jobs: failed,
  cancelled_jobs: cancelled,
  skipped_jobs: skipped,
  workflow_fanout_per_sha_avg: avg(fanoutValues),
  workflow_fanout_per_sha_p95: p95(fanoutValues),
  pull_request_runs_7d: eventCount('pull_request'),
  merge_group_runs_7d: mergeGroupRuns.length,
  merge_group_required_successes_7d: requiredMergeGroupSuccesses,
  merge_group_required_failures_7d: requiredMergeGroupFailures,
  merge_group_ready: mergeGroupReady,
  active_nonterminal_runs: runs.filter(run => ['queued','pending','in_progress','waiting','requested'].includes(run.status)).length,
  direct_pull_request_workflow_count: directPullRequestWorkflows.length,
};

const engineeringTuning = JSON.parse(await readFile('config/powerhouse-engineering-tuning.json','utf8'));
const directPrWorkflowBudget = Number(engineeringTuning.ci?.direct_pr_workflow_budget ?? 100);

const baseReport = {
  version: 'powerhouse-ci-intelligence-v2',
  observed_at: new Date().toISOString(),
  window_days: 7,
  sampled_runs: sample.length,
  sampled_jobs: jobRows.length,
  metrics,
  slo: {
    max_workflows_per_pr_head: 5,
    required_queue_p95_seconds: 30,
    required_total_p95_seconds: 120,
    external_wait_budget_seconds: 30,
    fanout_target_met: metrics.workflow_fanout_per_sha_p95 <= 5,
    required_queue_target_met: metrics.required_queue_wait_seconds_p95 <= 30,
    required_total_target_met: metrics.required_total_seconds_p95 <= 120,
    merge_group_observed: metrics.merge_group_runs_7d > 0,
    merge_group_ready: metrics.merge_group_ready === true,
    direct_pull_request_workflow_budget: directPrWorkflowBudget,
    direct_pull_request_workflow_target_met: metrics.direct_pull_request_workflow_count <= directPrWorkflowBudget,
  },
  optimization_policy: {
    stale_same_pr_runs_cancelled: true,
    required_gate_is_canonical: true,
    lane_scoped_execution: true,
    deterministic_dependency_cache: true,
    website_netlify_preview_reuse: true,
    local_browser_build_is_fallback_only: true,
    duplicate_preflight_domain_checks_removed: true,
    background_learning_off_pr_fastlane: true,
    fast_pr_requires_merge_group_evidence: true,
  },
  direct_pull_request_workflows: directPullRequestWorkflows,
  jobs: jobRows,
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
    `## Powerhouse CI Intelligence v2\n\n- Queue avg / p95: **${m.queue_wait_seconds_avg}s / ${m.queue_wait_seconds_p95}s**\n- Required queue p95: **${m.required_queue_wait_seconds_p95}s**\n- Required total p95: **${m.required_total_seconds_p95}s**\n- Fan-out per SHA avg / p95: **${m.workflow_fanout_per_sha_avg} / ${m.workflow_fanout_per_sha_p95}**\n- Pull-request / merge-group runs (7d): **${m.pull_request_runs_7d} / ${m.merge_group_runs_7d}**\n- Merge-group Required success / failure / ready: **${m.merge_group_required_successes_7d} / ${m.merge_group_required_failures_7d} / ${m.merge_group_ready}**\n- Direct PR workflows / budget: **${m.direct_pull_request_workflow_count} / ${directPrWorkflowBudget}**\n- Failed / cancelled / skipped jobs: **${m.failed_jobs} / ${m.cancelled_jobs} / ${m.skipped_jobs}**\n- Calibration recommendations: **${report.calibration.recommendations.length}** (mode: ${report.calibration.mode})\n`);
}
