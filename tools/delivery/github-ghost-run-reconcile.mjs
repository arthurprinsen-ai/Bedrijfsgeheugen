import process from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const INCIDENT = 4655;
const FINGERPRINT = 'github-actions:stale-queued-zero-jobs:cancel-409:20261007';
const HOURS_SIX = 6 * 60 * 60 * 1000;
// These IDs were already individually confirmed 409/409/403 in incident #4655.
// Never repeat irreversible attempts simply because an hourly sweep restarted.
const HISTORICAL_PROVIDER_DENIED = new Set([37642383514, 37642383517, 37642336315, 37642334843]);

export function classifyGhostRun(run, totalJobs, { now, mainSha, openHeads }) {
  if (run?.status !== 'queued' || run?.conclusion != null) return 'NOT_QUEUED';
  if (!run.created_at || !run.updated_at || run.created_at !== run.updated_at) return 'PROGRESS_OR_UNKNOWN';
  const age = now - Date.parse(run.created_at);
  if (!Number.isFinite(age) || age < HOURS_SIX) return 'TOO_NEW';
  if (!run.head_sha || run.head_sha === mainSha) return 'CURRENT_MAIN_OR_UNKNOWN';
  if (openHeads.has(run.head_sha)) return 'CURRENT_PR_HEAD';
  if (!Number.isInteger(totalJobs) || totalJobs !== 0) return 'HAS_JOBS_OR_UNKNOWN';
  return 'OBSOLETE_ZERO_JOB';
}

export function ghostMarkers(comments) {
  const markers = new Map();
  for (const comment of comments) {
    const found = [...String(comment.body || '').matchAll(/GH_GHOST_RUN:([0-9]+):([A-Z_]+):([^\s]+)/g)];
    for (const match of found) markers.set(Number(match[1]), { state: match[2], updatedAt: match[3] });
  }
  return markers;
}

async function run() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error('Missing GitHub repository or authorized workflow token');
  const base = 'https://api.github.com/repos/' + repo;
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  async function raw(path, init = {}) {
    return fetch(base + path, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  }
  async function api(path, init = {}) {
    const res = await raw(path, init);
    if (!res.ok) throw new Error('GitHub ' + res.status + ' while reading/writing ' + path);
    if (res.status === 204 || res.status === 202) return null;
    return res.json();
  }
  async function pages(path, key) {
    const rows = [];
    for (let page = 1; page <= 20; page++) {
      const separator = path.includes('?') ? '&' : '?';
      const result = await api(path + separator + 'per_page=100&page=' + page);
      const batch = key ? result[key] : result;
      if (!Array.isArray(batch)) throw new Error('Invalid paginated GitHub response: ' + path);
      rows.push(...batch);
      if (batch.length < 100) return rows;
    }
    throw new Error('GitHub pagination exceeded 20 pages; fail closed');
  }
  const issue = await api('/issues/' + INCIDENT);
  if (issue.state !== 'open' || !String(issue.body).includes(FINGERPRINT)) {
    throw new Error('Canonical GitHub ghost-run incident missing or closed without reconciled provider proof');
  }
  const [comments, queued, openPrs, main] = await Promise.all([
    pages('/issues/' + INCIDENT + '/comments', null),
    pages('/actions/runs?status=queued', 'workflow_runs'),
    pages('/pulls?state=open', null),
    api('/branches/main')
  ]);
  const markers = ghostMarkers(comments);
  const openHeads = new Set(openPrs.map(pr => pr.head?.sha).filter(Boolean));
  const mainSha = main.commit?.sha;
  if (!mainSha) throw new Error('Cannot verify current main SHA; fail closed');
  const queuedIds = new Set(queued.map(r => Number(r.id)));
  const updates = [];
  const suppressed = new Set();
  const now = Date.now();
  for (const summary of queued) {
    if (summary.status !== 'queued' || now - Date.parse(summary.created_at) < HOURS_SIX) continue;
    const item = await api('/actions/runs/' + Number(summary.id));
    const jobs = await api('/actions/runs/' + item.id + '/jobs?per_page=1');
    if (classifyGhostRun(item, jobs.total_count, { now, mainSha, openHeads }) !== 'OBSOLETE_ZERO_JOB') continue;
    const prior = markers.get(item.id);
    if (prior && prior.updatedAt === item.updated_at && ['PROVIDER_BOUNDARY', 'RECOVERY_REQUESTED'].includes(prior.state)) {
      suppressed.add(item.id);
      continue;
    }
    let state = 'PROVIDER_BOUNDARY';
    let evidence = 'Historical 409 cancel / 409 force-cancel / 403 delete; provider reconciliation required';
    if (!HISTORICAL_PROVIDER_DENIED.has(item.id)) {
      // Recheck the immutable identity before the first external mutation.
      const fresh = await api('/actions/runs/' + item.id);
      const recheckJobs = await api('/actions/runs/' + item.id + '/jobs?per_page=1');
      if (classifyGhostRun(fresh, recheckJobs.total_count, { now: Date.now(), mainSha, openHeads }) !== 'OBSOLETE_ZERO_JOB') continue;
      const cancel = await raw('/actions/runs/' + item.id + '/cancel', { method: 'POST' });
      let forceStatus = null;
      let deleteStatus = null;
      if (cancel.ok) state = 'RECOVERY_REQUESTED';
      else {
        const force = await raw('/actions/runs/' + item.id + '/force-cancel', { method: 'POST' });
        forceStatus = force.status;
        if (force.ok) state = 'RECOVERY_REQUESTED';
        else if (cancel.status === 409 && force.status === 409) {
          // Delete only a confirmed stale zero-job obsolete candidate; never current CI.
          const last = await api('/actions/runs/' + item.id);
          const lastJobs = await api('/actions/runs/' + item.id + '/jobs?per_page=1');
          if (classifyGhostRun(last, lastJobs.total_count, { now: Date.now(), mainSha, openHeads }) === 'OBSOLETE_ZERO_JOB') {
            const del = await raw('/actions/runs/' + item.id, { method: 'DELETE' });
            deleteStatus = del.status;
            if (del.ok) state = 'DELETE_REQUESTED';
          }
        }
      }
      evidence = 'cancel HTTP ' + cancel.status + '; force HTTP ' + (forceStatus ?? 'not-needed') + '; DELETE HTTP ' + (deleteStatus ?? 'not-attempted');
    }
    if (state === 'PROVIDER_BOUNDARY' || state === 'RECOVERY_REQUESTED') suppressed.add(item.id);
    updates.push({ id: item.id, state, updatedAt: item.updated_at, checkSuiteId: item.check_suite_id, evidence });
  }
  // Provider repair is not inferred from queue length: verify every previously blocked run by ID.
  for (const [id, marker] of markers) {
    if (!['PROVIDER_BOUNDARY', 'RECOVERY_REQUESTED', 'DELETE_REQUESTED'].includes(marker.state) || queuedIds.has(id)) continue;
    const result = await raw('/actions/runs/' + id);
    if (result.status === 404) {
      updates.push({ id, state: 'RECONCILED', updatedAt: 'deleted', evidence: 'Exact GitHub run GET returned 404' });
    } else if (result.ok) {
      const item = await result.json();
      if (item.status === 'completed') updates.push({ id, state: 'RECONCILED', updatedAt: item.updated_at, evidence: 'Exact provider run is terminal: ' + String(item.conclusion) });
    }
  }
  await mkdir(resolve('.artifacts'), { recursive: true });
  await writeFile('.artifacts/ghost-blocked-ids.txt', [...suppressed].join('\n') + '\n');
  await writeFile('.artifacts/github-ghost-run-reconciliation.json', JSON.stringify({
    fingerprint: FINGERPRINT, incident: INCIDENT, observed_at: new Date().toISOString(),
    queued_count: queued.length, suppressed_ids: [...suppressed], updates
  }, null, 2) + '\n');
  if (updates.length) {
    const body = '### Autonomous zero-job GitHub provider reconciliation\n' +
      'Fingerprint: ' + FINGERPRINT + '\n' +
      'Canonical owner: existing Repository Janitor; no replacement scheduler. GitHub Support is required when provider rejects its own cancellation/deletion API.\n\n' +
      updates.map(row =>
        '- GH_GHOST_RUN:' + row.id + ':' + row.state + ':' + row.updatedAt +
        ' — https://github.com/' + repo + '/actions/runs/' + row.id +
        '; check_suite=' + (row.checkSuiteId ?? 'unknown') + '; ' + row.evidence
      ).join('\n') +
      '\n\nRequired/CodeQL current-head checks are never modified. RECONCILED requires exact run GET verification; do not claim whole-system green.';
    await api('/issues/' + INCIDENT + '/comments', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body })
    });
  }
  console.log(JSON.stringify({ incident: INCIDENT, checked: queued.length, suppressed: [...suppressed], changed: updates.length }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch(error => { console.error(String(error)); process.exitCode = 1; });
}
