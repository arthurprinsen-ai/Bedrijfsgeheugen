// Pure, fail-closed policy shared by the existing Required Gate Watchdog.
const RUNNING = new Set(['queued', 'in_progress', 'pending', 'requested', 'waiting']);
const FAILED = new Set(['failure', 'timed_out', 'startup_failure', 'action_required']);

export function latestGateRun(runs, gate, headSha) {
  const nameMatches = run => gate === 'required'
    ? (String(run.name || '').startsWith('Required test') || String(run.path || '').endsWith('/required-test.yml'))
    : (String(run.name || '') === 'Powerhouse CodeQL' || String(run.path || '').endsWith('/codeql.yml'));
  return (Array.isArray(runs) ? runs : [])
    .filter(run => nameMatches(run) && run.head_sha === headSha)
    .sort((a, b) =>
      Date.parse(b.created_at || '') - Date.parse(a.created_at || '') ||
      Number(b.run_attempt || 0) - Number(a.run_attempt || 0) ||
      Number(b.id || 0) - Number(a.id || 0))[0] || null;
}

export function gateDecision(run) {
  if (!run) return 'MISSING';
  if (RUNNING.has(run.status)) return 'ACTIVE_DO_NOT_RETRY';
  if (run.status === 'completed' && run.conclusion === 'success') return 'PROVEN_GATE_SUCCESS';
  if (run.status === 'completed' && FAILED.has(run.conclusion)) return 'SAME_OWNER_REPAIR_REQUIRED';
  // Cancelled or skipped is not a successful gate and never proves the source is safe.
  return 'INCOMPLETE_NO_SUCCESS';
}

export function existingOwner(body) {
  const text = String(body || '');
  return text.match(/^Writer-Lease-Owner:\s*(.+)$/m)?.[1]?.trim() ||
    text.match(/^Obligation-ID:\s*(.+)$/m)?.[1]?.trim() || 'CURRENT_PR_OWNER';
}

export function ownerSignalMarker(gate, headSha) {
  if (!['required', 'codeql'].includes(gate) || !/^[a-f0-9]{40}$/.test(headSha)) throw new Error('INVALID_GATE_IDENTITY');
  return `<!-- BG_FAILED_GATE_SAME_OWNER_RECOVERY:${gate}:${headSha} -->`;
}

export function ownerSignalComment({gate, headSha, run, owner, job}) {
  const marker = ownerSignalMarker(gate, headSha);
  const jobLine = job?.id
    ? `Failed job: [${String(job.name || 'job')}](https://github.com/${String(run.repository?.full_name || '')}/actions/runs/${run.id}/job/${job.id})`
    : 'No failing job was returned; inspect workflow startup / provider control plane.';
  return `${marker}
### Automatic same-owner recovery handoff — ${gate === 'required' ? 'Required test' : 'Powerhouse CodeQL'}
Status: **RECOVERY REQUIRED**, not green. This is an existing PR/owner obligation, not a new writer or incident.
- Exact PR head: \`${headSha}\`
- Latest failing run: ${run.html_url || 'https://github.com/' + String(run.repository?.full_name || '') + '/actions/runs/' + run.id} (${run.conclusion})
- ${jobLine}
- Canonical owner: \`${owner}\`
- Required action: inspect the FIRST actual failing assertion in the linked immutable logs, compare canonical main/runtime, implement the smallest source fix on the existing authorized owner branch, add a positive + negative regression, rerun exact-head Required and CodeQL, and verify merge and production readback.
- Never loop a failed source test, retry an un-retryable no-job startup, suppress CLS > 0.100, skip routes/security checks, create a second writer/scheduler, or declare automatic repair proven by this handoff.

The existing watchdog leaves this obligation open until independent gate and delivery proof exists.`;
}

 
// Bounded read-only transport recovery. An uncertain GitHub POST must NEVER be
// replayed automatically: the next watchdog tick reconciles the durable marker.
export const GATE_REQUEST_TIMEOUT_MS = 12_000;
const GATE_GET_RETRY_DELAYS_MS = [250, 750];
const GATE_RETRYABLE_READ_STATUSES = new Set([429, 500, 502, 503, 504]);

export async function boundedGateRequest(fetchImpl, url, init = {}, {
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  timeout = ms => AbortSignal.timeout(ms)
} = {}) {
  const method = String(init.method || 'GET').toUpperCase();
  for (let attempt = 0; attempt <= GATE_GET_RETRY_DELAYS_MS.length; attempt++) {
    let response;
    try {
      response = await fetchImpl(url, {
        ...init,
        signal: timeout(GATE_REQUEST_TIMEOUT_MS)
      });
    } catch (error) {
      if (method !== 'GET' || attempt === GATE_GET_RETRY_DELAYS_MS.length) throw error;
      await sleep(GATE_GET_RETRY_DELAYS_MS[attempt]);
      continue;
    }
    if (method === 'GET'
      && GATE_RETRYABLE_READ_STATUSES.has(response.status)
      && attempt < GATE_GET_RETRY_DELAYS_MS.length) {
      await sleep(GATE_GET_RETRY_DELAYS_MS[attempt]);
      continue;
    }
    return response;
  }
  throw new Error('GATE_READ_RETRY_EXHAUSTED');
}

// Fail-closed queue pressure bound: no bulk fanout of missing Required checks.
// Keep scanning existing owners even when the per-tick dispatch budget is reached.
export const MAX_MISSING_GATE_DISPATCHES_PER_TICK = 2;

export function eligibleMissingGateDispatch(pr, alreadyDispatched = 0) {
  if (alreadyDispatched >= MAX_MISSING_GATE_DISPATCHES_PER_TICK) return false;
  if (/^(RETIRED|SUPERSEDED)\b/i.test(String(pr?.title || '').trim())) return false;
  if (/^Writer-Lease-State:\s*(RELEASED|TERMINAL|RETIRED|CLOSED)\b/im.test(String(pr?.body || ''))) return false;
  if (/^Terminal-State:\s*(LIVE_BEWEZEN|LIVE_PROVEN|ROLLED_BACK_GREEN)\b/im.test(String(pr?.body || ''))) return false;
  return true;
}
