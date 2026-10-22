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

// A 401/403 on precisely the PR owner-comment endpoint is an authority denial,
// not proof of delivery. Other API errors still fail closed immediately.
export function isOwnerCommentPermissionDenied(error, prNumber) {
  return Number.isInteger(prNumber) &&
    [401, 403].includes(error?.status) &&
    error?.path === `/issues/${prNumber}/comments`;
}
