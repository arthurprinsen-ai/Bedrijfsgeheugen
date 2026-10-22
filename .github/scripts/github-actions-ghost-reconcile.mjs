// Existing Repository Janitor's bounded GitHub Actions provider-ghost recovery.
// Canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessQueuePressure } from '../../tools/delivery/predictive-controller.mjs';

export const GHOST_FINGERPRINT = 'github-actions:stale-queued-zero-jobs:cancel-409:20261007';
export const GHOST_INCIDENT = 4655;
const DAY = 24 * 60 * 60 * 1000;
const MAX_REPAIR_PER_SWEEP = 8;

export function classifyGhost(run, { jobsTotal, mainSha, openHeadShas = [], now = Date.now() } = {}) {
  if (!run || run.status !== 'queued' || run.conclusion != null) return { eligible: false, reason: 'NOT_QUEUED' };
  if (!Number.isInteger(jobsTotal) || jobsTotal !== 0) return { eligible: false, reason: 'JOBS_EXIST_OR_UNKNOWN' };
  const created = Date.parse(run.created_at || '');
  const updated = Date.parse(run.updated_at || '');
  if (!Number.isFinite(created) || !Number.isFinite(updated) || Math.abs(updated - created) > 60_000)
    return { eligible: false, reason: 'STATE_NOT_STABLE' };
  if (now - created < DAY) return { eligible: false, reason: 'MIN_24H_AGE_NOT_MET' };
  if (!run.head_sha || !run.head_branch || !mainSha) return { eligible: false, reason: 'IDENTITY_MISSING' };
  if (run.head_sha === mainSha) return { eligible: false, reason: 'CURRENT_MAIN_PROTECTED' };
  if (openHeadShas.includes(run.head_sha)) return { eligible: false, reason: 'OPEN_PR_HEAD_PROTECTED' };
  return { eligible: true, reason: 'STALE_ZERO_JOB_NON_AUTHORITATIVE_HEAD' };
}

export function evidenceIds(issueText, comments = []) {
  const text = [issueText, ...comments.map(c => c.body || '')].join('\n');
  const ids = new Set();
  const completed = new Set();
  const blocked = new Set();
  for (const match of text.matchAll(/GHOST_RUN_(?:ATTEMPT|PROVIDER_BLOCKED|PENDING):(\d+)/g)) ids.add(Number(match[1]));
  for (const match of text.matchAll(/GHOST_RUN_RESOLVED:(\d+)/g)) completed.add(Number(match[1]));
  for (const match of text.matchAll(/GHOST_RUN_PROVIDER_BLOCKED:(\d+)/g)) blocked.add(Number(match[1]));
  return { ids, completed, blocked };
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!repo || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');
  const headers = { authorization: 'Bearer ' + token, accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  async function api(path, method = 'GET', body) {
    const response = await fetch('https://api.github.com/repos/' + repo + path, {
      method,
      headers: { ...headers, ...(body ? { 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text.slice(0, 200) }; }
    return { status: response.status, ok: response.ok, data };
  }
  async function required(path) {
    const response = await api(path);
    if (!response.ok) throw new Error('GITHUB_READ_FAILED:' + path + ':' + response.status);
    return response.data;
  }
  async function paginate(path, extract, maxPages = 20) {
    const all = [];
    for (let page = 1; page <= maxPages; page++) {
      const data = await required(path + (path.includes('?') ? '&' : '?') + 'per_page=100&page=' + page);
      const rows = extract(data);
      if (!Array.isArray(rows)) throw new Error('GITHUB_PAGINATION_UNEXPECTED:' + path);
      all.push(...rows);
      if (rows.length < 100) return all;
    }
    throw new Error('GITHUB_PAGINATION_LIMIT:' + path);
  }
  const issue = await required('/issues/' + GHOST_INCIDENT);
  const comments = await paginate('/issues/' + GHOST_INCIDENT + '/comments', data => data);
  const known = evidenceIds(issue.body || '', comments);
  const queued = await paginate('/actions/runs?status=queued', data => data.workflow_runs);
  const openPRs = await paginate('/pulls?state=open', data => data);
  const mainRef = await required('/git/ref/heads/main');
  const mainSha = mainRef.object?.sha;
  const activeHeads = openPRs.map(pr => pr.head?.sha).filter(Boolean);
  const reports = [];
  const runProofs = [];
  const newAttempts = [];
  let repairCount = 0;
  for (const item of queued) {
    // Avoid probing any fresh run or old but clearly active candidate.
    const quick = classifyGhost(item, { jobsTotal: 0, mainSha, openHeadShas: activeHeads });
    if (!quick.eligible) continue;
    const run = await required('/actions/runs/' + item.id);
    const jobs = await required('/actions/runs/' + item.id + '/jobs?per_page=1');
    const classified = classifyGhost(run, { jobsTotal: jobs.total_count, mainSha, openHeadShas: activeHeads });
    if (!classified.eligible) continue;
    const record = { run_id: run.id, status: run.status, check_suite_id: run.check_suite_id, head_sha: run.head_sha, reason: classified.reason };
    reports.push(record);
    if (known.blocked.has(run.id)) runProofs.push({
      incident: GHOST_INCIDENT, runId: run.id,
      providerBoundary: 'GITHUB_CANCEL_FORCE_409_DELETE_403',
      jobsTotalCount: jobs.total_count, runStatus: run.status,
      runHeadSha: run.head_sha, runCreatedAt: run.created_at,
      runUpdatedAt: run.updated_at, readbackAt: new Date().toISOString()
    });
    if (known.ids.has(run.id)) continue; // Provider boundary is durable. No endless identical 409/403 loops.
    if (repairCount >= MAX_REPAIR_PER_SWEEP) continue;
    repairCount++;
    // Read-before-write and exact run/job revalidation. Never change security checks or dispatch replacement CI.
    const verify = await required('/actions/runs/' + run.id);
    const verifyJobs = await required('/actions/runs/' + run.id + '/jobs?per_page=1');
    if (!classifyGhost(verify, { jobsTotal: verifyJobs.total_count, mainSha, openHeadShas: activeHeads }).eligible) continue;
    const operations = [];
    let accepted = false;
    for (const suffix of ['/cancel', '/force-cancel']) {
      const response = await api('/actions/runs/' + run.id + suffix, 'POST');
      operations.push({ operation: suffix.slice(1), http_status: response.status });
      if (response.ok) { accepted = true; break; }
      if (response.status !== 409) break; // Unexpected denial: fail closed, don't escalate destructively.
    }
    if (!accepted && operations.length === 2 && operations.every(o => o.http_status === 409)) {
      const confirm = await required('/actions/runs/' + run.id);
      const confirmJobs = await required('/actions/runs/' + run.id + '/jobs?per_page=1');
      if (classifyGhost(confirm, { jobsTotal: confirmJobs.total_count, mainSha, openHeadShas: activeHeads }).eligible) {
        const deleted = await api('/actions/runs/' + run.id, 'DELETE');
        operations.push({ operation: 'delete', http_status: deleted.status });
        accepted = deleted.ok;
      }
    }
    const readback = await api('/actions/runs/' + run.id);
    const resolved = readback.status === 404 || (readback.ok && readback.data.status === 'completed');
    const block = !resolved && !accepted;
    record.operations = operations;
    record.readback = readback.status === 404 ? 'NOT_FOUND' : (readback.data?.status || 'UNKNOWN');
    record.outcome = resolved ? 'VERIFIED_TERMINAL' : block ? 'PROVIDER_BOUNDARY' : 'RECOVERY_PENDING_READBACK';
    const marker = block ? 'GHOST_RUN_PROVIDER_BLOCKED:' : 'GHOST_RUN_PENDING:';
    newAttempts.push({ id: run.id, marker, record });
  }
  // Poll previously attempted runs even when the queued collection omits them (provider API inconsistency).
  const resolvedNew = [];
  for (const id of known.ids) {
    if (known.completed.has(id)) continue;
    const response = await api('/actions/runs/' + id);
    if (response.status === 404 || (response.ok && response.data?.status === 'completed')) {
      resolvedNew.push(id);
    } else if (!response.ok) {
      throw new Error('GITHUB_READBACK_UNAVAILABLE_FOR_ATTEMPT:' + id + ':' + response.status);
    }
  }
  // One comment per change, fingerprinted; existing incident is the only remediation owner.
  if (newAttempts.length || resolvedNew.length) {
    const body = [
      '## Autonomous provider-ghost reconciliation (' + new Date().toISOString() + ')',
      'Fingerprint: ' + GHOST_FINGERPRINT,
      'Authority: existing Repository Janitor; exact-provider readback only. No branch protection or CI bypass.',
      ...newAttempts.map(x => '\n- ' + x.marker + x.id + '\n  Evidence: ' + JSON.stringify(x.record)),
      ...resolvedNew.map(id => '\n- GHOST_RUN_RESOLVED:' + id + ' (404 or verified terminal GitHub API readback)'),
      '\nUnresolved provider-owned 409/403 records remain OPEN for GitHub Support; no new scheduler or duplicate incident.',
    ].join('\n');
    const posted = await api('/issues/' + GHOST_INCIDENT + '/comments', 'POST', { body });
    if (!posted.ok) throw new Error('GHOST_EVIDENCE_WRITE_FAILED:' + posted.status);
  }
  // A reopened event belongs to the same issue; never create a parallel support owner.
  if (issue.state === 'closed' && reports.length) {
    const reopened = await api('/issues/' + GHOST_INCIDENT, 'PATCH', { state: 'open' });
    if (!reopened.ok) throw new Error('GHOST_INCIDENT_REOPEN_FAILED:' + reopened.status);
  }
  const pressure = assessQueuePressure({
    queued: queued.length,
    queueEvidence: { queuedRuns: queued, runProofs, currentMainSha: mainSha,
      openPrHeadShas: activeHeads, snapshotComplete: true,
      rawTotalCount: queued.length }
  });
  // Exact-ID provider anomalies stay visible if the collection omits them.
  const collectionMissingKnownProviderIds = [...known.blocked].filter(id =>
    !known.completed.has(id) && !queued.some(run => run.id === id) && !resolvedNew.includes(id));
  const evidence = { fingerprint: GHOST_FINGERPRINT, issue: GHOST_INCIDENT, observed_at: new Date().toISOString(),
    queued_count: queued.length, rawQueued: pressure.counts.rawQueued,
    actionableQueued: pressure.counts.queued,
    verifiedProviderGhostQueued: pressure.counts.verifiedProviderGhostQueued,
    providerIncidentStillOpen: known.blocked.size > resolvedNew.length,
    collectionMissingKnownProviderIds,
    ghosts: reports, attempts: newAttempts.length,
    provider_blocks: newAttempts.filter(x => x.marker.includes('BLOCKED')).length, newly_resolved: resolvedNew };
  await mkdir('.artifacts', { recursive: true });
  await writeFile('.artifacts/github-actions-ghost-reconcile.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error('GHOST_RECONCILE_FAILED:' + String(error?.message || error)); process.exitCode = 1; });
}
