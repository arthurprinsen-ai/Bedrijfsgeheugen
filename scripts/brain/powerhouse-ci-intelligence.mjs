import { mkdir, writeFile, appendFile } from 'node:fs/promises';

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
const runs = (runsPayload.workflow_runs || []).filter(run => Date.parse(run.created_at) >= since);

const sample = runs.slice(0, 30);
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
const failed = jobRows.filter(row => row.conclusion === 'failure').length;
const cancelled = jobRows.filter(row => row.conclusion === 'cancelled').length;
const skipped = jobRows.filter(row => row.conclusion === 'skipped').length;
const workflowFanout = new Map();
for (const run of runs) workflowFanout.set(run.head_sha, (workflowFanout.get(run.head_sha) || 0) + 1);
const fanoutValues = [...workflowFanout.values()];

const report = {
  version: 'powerhouse-ci-intelligence-v1',
  observed_at: new Date().toISOString(),
  window_days: 7,
  sampled_runs: sample.length,
  sampled_jobs: jobRows.length,
  metrics: {
    queue_wait_seconds_avg: avg(queues),
    queue_wait_seconds_p95: p95(queues),
    execution_seconds_avg: avg(executions),
    execution_seconds_p95: p95(executions),
    failed_jobs: failed,
    cancelled_jobs: cancelled,
    skipped_jobs: skipped,
    workflow_fanout_per_sha_avg: avg(fanoutValues),
    workflow_fanout_per_sha_p95: p95(fanoutValues),
  },
  optimization_policy: {
    stale_same_pr_runs_cancelled: true,
    required_gate_is_canonical: true,
    lane_scoped_execution: true,
    deterministic_dependency_cache: true,
    website_netlify_preview_reuse: true,
    local_browser_build_is_fallback_only: true,
    duplicate_preflight_domain_checks_removed: true,
  },
  jobs: jobRows,
};

await mkdir('artifacts/ci-intelligence', { recursive: true });
await writeFile('artifacts/ci-intelligence/latest.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.metrics, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const m = report.metrics;
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `## Powerhouse CI Intelligence\n\n- Queue avg / p95: **${m.queue_wait_seconds_avg}s / ${m.queue_wait_seconds_p95}s**\n- Execution avg / p95: **${m.execution_seconds_avg}s / ${m.execution_seconds_p95}s**\n- Fan-out per SHA avg / p95: **${m.workflow_fanout_per_sha_avg} / ${m.workflow_fanout_per_sha_p95}**\n- Failed / cancelled / skipped jobs: **${m.failed_jobs} / ${m.cancelled_jobs} / ${m.skipped_jobs}**\n`);
}
