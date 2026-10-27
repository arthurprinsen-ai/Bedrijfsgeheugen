import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { latestGateRun, gateDecision, existingOwner, ownerSignalMarker, ownerSignalComment, retryableGitHubReadError } from '../../tools/delivery/failed-gate-owner-routing.mjs';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const now = Date.now();
const MIN_AGE_MS = 90_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;
const MAX_OWNER_SIGNALS_PER_TICK = 2;
const MAX_READ_ATTEMPTS = 2;
const READ_TIMEOUT_MS = 8_000;
const MAX_FAILED_PRS_PER_TICK = 3;
if (!repo || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

async function api(path, init = {}) {
  const method = String(init.method || 'GET').toUpperCase();
  // Read-only transient requests can be retried. POSTs have ambiguous effects
  // if their response is lost and must be reconciled next scheduled tick.
  const maxAttempts = method === 'GET' ? MAX_READ_ATTEMPTS : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
        ...init, signal: AbortSignal.timeout(READ_TIMEOUT_MS),
        headers: { ...headers, ...(init.headers || {}) }
      });
      if (!response.ok) {
        const error = new Error(`GitHub API ${response.status} ${path}: ${await response.text()}`);
        error.status = response.status;
        throw error;
      }
      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      if (attempt === maxAttempts || !retryableGitHubReadError({ method, status: error.status, name: error.name }))
        throw error;
      console.warn(`WATCHDOG_TRANSIENT_GET_RETRY:${path}:${attempt}:${error.status || error.name}`);
      await sleep(250 * attempt);
    }
  }
  throw new Error('WATCHDOG_READ_ATTEMPTS_EXHAUSTED');
}

async function hasOwnerSignal(prNumber, marker) {
  // A full, bounded readback is mandatory: never repeat the signal just because an
  // old PR has more than the default 30 comments.
  for (let page = 1; page <= 5; page++) {
    const comments = await api(`/issues/${prNumber}/comments?per_page=100&page=${page}`);
    if (comments.some(comment => String(comment.body || '').includes(marker))) return true;
    if (comments.length < 100) return false;
  }
  throw new Error(`RECOVERY_COMMENT_HISTORY_UNBOUNDED:#${prNumber}`);
}

async function emitExistingOwnerSignal(pr, gate, run) {
  const marker = ownerSignalMarker(gate, pr.head.sha);
  if (await hasOwnerSignal(pr.number, marker)) return false;
  const jobs = await api(`/actions/runs/${run.id}/jobs?per_page=100`);
  const failedJob = (jobs.jobs || []).find(job => ['failure', 'timed_out'].includes(job.conclusion)) || null;
  const body = ownerSignalComment({
    gate, headSha: pr.head.sha, run: { ...run, repository: { full_name: repo } },
    owner: existingOwner(pr.body), job: failedJob
  });
  // The existing PR is the durable, canonical repair request. Do not create
  // a second incident, branch, scheduler or queue for an identical root cause.
  await api(`/issues/${pr.number}/comments`, {
    method: 'POST', body: JSON.stringify({ body }),
    headers: { 'content-type': 'application/json' }
  });
  console.log(`FAILED_GATE_OWNER_RECOVERY_SIGNAL:#${pr.number}:${gate}:${pr.head.sha}:${run.id}`);
  return true;
}

let dispatched = 0;
let ownerSignals = 0;
let ownerSignalAttempts = 0;
const ownerSignalFailures = [];
let failedPrs = 0;
for (let page = 1; page <= 5; page++) {
  const pulls = await api(`/pulls?state=open&base=main&per_page=100&page=${page}`);
  for (const pr of pulls) {
    try {
    const age = now - Date.parse(pr.updated_at || pr.created_at);
    if (!Number.isFinite(age) || age < MIN_AGE_MS || age > MAX_AGE_MS) continue;
    const head = pr.head?.sha;
    if (!/^[a-f0-9]{40}$/.test(head || '')) continue;
    const response = await api(`/actions/runs?head_sha=${head}&per_page=100`);
    const runs = response.workflow_runs || [];
    const required = latestGateRun(runs, 'required', head);
    const codeql = latestGateRun(runs, 'codeql', head);
    for (const [gate, run] of [['required', required], ['codeql', codeql]]) {
      if (ownerSignalAttempts >= MAX_OWNER_SIGNALS_PER_TICK) break;
      if (gateDecision(run) !== 'SAME_OWNER_REPAIR_REQUIRED') continue;
      ownerSignalAttempts++;
      try {
        if (await emitExistingOwnerSignal(pr, gate, run)) ownerSignals++;
      } catch (error) {
        // A denied handoff cannot interrupt missing-Required dispatch for
        // this same PR, nor become green after other PRs succeed.
        const safeReason = String(error?.message || error).replace(/\s+/g, ' ').slice(0, 350);
        const failure = `OWNER_HANDOFF_NOT_DELIVERED:#${pr.number}:${gate}:${head}:${run.id}:${safeReason}`;
        ownerSignalFailures.push(failure);
        console.error(`::error::${failure}`);
      }
    }

    // Preserve the existing one-flight missing-Required recovery; never
    // automatically redispatch a failing source test or cancel a healthy job.
    if (gateDecision(required) !== 'MISSING') continue;
    const inputs = {
      pr_number: String(pr.number),
      base_sha: String(pr.base?.sha || ''),
      head_sha: String(head),
      candidate_branch: String(pr.head?.ref || ''),
      pr_body: pr.body || '',
      pr_labels_json: JSON.stringify((pr.labels || []).map(label => label?.name).filter(Boolean))
    };
    await api('/actions/workflows/required-test.yml/dispatches', {
      method: 'POST',
      body: JSON.stringify({ ref: pr.head.ref, inputs }),
      headers: { 'content-type': 'application/json' }
    });
    console.log(`REQUIRED_GATE_WATCHDOG_DISPATCHED:#${pr.number}:${head}`);
    dispatched++;
    } catch (error) {
      failedPrs++;
      console.error(`REQUIRED_GATE_WATCHDOG_PR_FAILURE:#${pr.number}:${String(error.message || error)}`);
      if (failedPrs >= MAX_FAILED_PRS_PER_TICK) break;
    }
  }
  if (failedPrs >= MAX_FAILED_PRS_PER_TICK) {
    console.error('REQUIRED_GATE_WATCHDOG_ERROR_BUDGET_EXHAUSTED');
    break;
  }
  if (pulls.length < 100) break;
}
console.log(`REQUIRED_GATE_WATCHDOG_DONE:${dispatched}:OWNER_RECOVERY_SIGNALS:${ownerSignals}:OWNER_HANDOFF_FAILURES:${ownerSignalFailures.length}:PR_FAILURES:${failedPrs}`);
// Even with partial progress, incomplete provider observations are never green.
if (failedPrs > 0 || ownerSignalFailures.length > 0) process.exitCode = 1;
