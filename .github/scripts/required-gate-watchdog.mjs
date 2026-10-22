import process from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { latestGateRun, gateDecision, existingOwner, ownerSignalMarker, ownerSignalComment, classifyOwnerSignalWriteError } from '../../tools/delivery/failed-gate-owner-routing.mjs';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const now = Date.now();
const MIN_AGE_MS = 90_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;
const MAX_OWNER_SIGNALS_PER_TICK = 2;
if (!repo || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

async function api(path, init = {}) {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...init, headers: { ...headers, ...(init.headers || {}) }
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} ${path}: ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
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
let commentAuthorityDenied = false;
const deniedHandoffs = [];
for (let page = 1; page <= 5; page++) {
  const pulls = await api(`/pulls?state=open&base=main&per_page=100&page=${page}`);
  for (const pr of pulls) {
    const age = now - Date.parse(pr.updated_at || pr.created_at);
    if (!Number.isFinite(age) || age < MIN_AGE_MS || age > MAX_AGE_MS) continue;
    const head = pr.head?.sha;
    if (!/^[a-f0-9]{40}$/.test(head || '')) continue;
    const response = await api(`/actions/runs?head_sha=${head}&per_page=100`);
    const runs = response.workflow_runs || [];
    const required = latestGateRun(runs, 'required', head);
    const codeql = latestGateRun(runs, 'codeql', head);
    for (const [gate, run] of [['required', required], ['codeql', codeql]]) {
      if (ownerSignals >= MAX_OWNER_SIGNALS_PER_TICK) break;
      if (gateDecision(run) !== 'SAME_OWNER_REPAIR_REQUIRED') continue;
      if (commentAuthorityDenied) {
        deniedHandoffs.push({ pr_number: pr.number, head_sha: head, gate, run_id: run.id, reason: 'PROVIDER_COMMENT_AUTHORITY_DENIED_EARLIER_THIS_TICK' });
        continue;
      }
      try {
        if (await emitExistingOwnerSignal(pr, gate, run)) ownerSignals++;
      } catch (error) {
        // Preserve all independent missing-Required dispatches even if GitHub denies PR comments.
        // Never report a successful owner notification, and never repeat the denied write this tick.
        if (classifyOwnerSignalWriteError(error) !== 'PROVIDER_COMMENT_AUTHORITY_DENIED') throw error;
        commentAuthorityDenied = true;
        deniedHandoffs.push({ pr_number: pr.number, head_sha: head, gate, run_id: run.id, reason: 'GITHUB_API_403_RESOURCE_NOT_ACCESSIBLE_BY_INTEGRATION' });
        console.error('::error::FAILED_GATE_OWNER_SIGNAL_PROVIDER_DENIED:#' + pr.number + ':' + gate + ':' + head + ':' + run.id);
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
  }
  if (pulls.length < 100) break;
}
console.log(`REQUIRED_GATE_WATCHDOG_DONE:${dispatched}:OWNER_RECOVERY_SIGNALS:${ownerSignals}:DENIED:${deniedHandoffs.length}`);
if (deniedHandoffs.length) {
  await mkdir('.artifacts', { recursive: true });
  await writeFile('.artifacts/required-gate-owner-handoff.json',
    JSON.stringify({ observed_at: new Date().toISOString(), repository: repo,
      fingerprint: 'github|required-gate-owner-handoff|provider-comment-403|20261022-v1',
      state: 'PROVIDER_AUTHORITY_DENIED_NOT_DELIVERED',
      independent_dispatches: dispatched, successful_owner_signals: ownerSignals,
      denied_handoffs: deniedHandoffs }, null, 2) + '\n');
  console.error('::error::OWNER_HANDOFF_UNDELIVERED:' + deniedHandoffs.length +
    ':SEE_ARTIFACT:required-gate-owner-handoff');
  process.exitCode = 1;
}
