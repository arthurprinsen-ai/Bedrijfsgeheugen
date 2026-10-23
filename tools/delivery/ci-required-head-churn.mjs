// Provider-observed Required-check candidate churn, NOT DORA lead time or causal merge-queue proof.
// Pure, read-only projection from the SAME bounded completed-runs response already read by
// Powerhouse Repository Janitor; no extra API calls, schedulers, gates or branch mutations.
const EXACT_REQUIRED = /^Required test PR #([1-9][0-9]*) ([0-9a-f]{40})$/i;
const MAX_PAGE = 40;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function observeRequiredHeadChurn({workflowRuns, totalCount, now} = {}) {
  const empty = {
    contract: 'powerhouse-required-head-churn-observation-v1',
    status: 'HOLD_PROVIDER_EVIDENCE_UNVERIFIED',
    evidence_scope: 'ONE_COMPLETED_GITHUB_ACTIONS_RUNS_PAGE_NOT_FULL_REPOSITORY',
    sampled_required_runs: 0,
    invalid_required_run_rows: 0,
    pr_count_with_repeated_heads: 0,
    additional_head_versions_lower_bound: 0,
    provider_history_truncated: null,
    provider_total_count: null,
    repeated_prs: [],
    merge_queue_advice: 'NO_POLICY_CHANGE_WITHOUT_ADMIN_AND_EXACT_MERGE_GROUP_CHECKS',
    causation_proven: false,
    deployment_speedup_proven: false,
    automatic_merge_queue_enablement: false,
    mandatory_checks_unchanged: true
  };
  if (!Number.isFinite(now) || !Array.isArray(workflowRuns) ||
      workflowRuns.length > MAX_PAGE ||
      (totalCount !== undefined &&
        (!Number.isSafeInteger(totalCount) || totalCount < workflowRuns.length))) {
    return empty;
  }

  const uniqueIds = new Set();
  const groups = new Map();
  let sampledRequired = 0;
  let invalid = 0;
  for (const run of workflowRuns) {
    const match = typeof run?.name === 'string' ? EXACT_REQUIRED.exec(run.name) : null;
    if (!match) continue;
    // Only the actual completed pull_request Required run is a PR-head observation;
    // merge_group, workflow_dispatch, job-matrix and synthetic names cannot forge it.
    const id = run.id;
    const pr = Number(match[1]);
    const stamp = Date.parse(run.created_at || '');
    const valid = Number.isSafeInteger(id) && id > 0 && !uniqueIds.has(id) &&
      Number.isSafeInteger(pr) && pr > 0 &&
      run.event === 'pull_request' && run.status === 'completed' &&
      Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0 &&
      run.head_sha === match[2].toLowerCase() &&
      Number.isFinite(stamp) && stamp <= now && stamp >= now - MAX_AGE_MS;
    if (!valid) { invalid++; continue; }
    uniqueIds.add(id);
    sampledRequired++;
    const g = groups.get(pr) || { pr_number: pr, heads: new Set(), runs: 0, oldest: stamp, newest: stamp };
    g.heads.add(run.head_sha);
    g.runs++;
    g.oldest = Math.min(g.oldest, stamp);
    g.newest = Math.max(g.newest, stamp);
    groups.set(pr, g);
  }

  const repeated = [...groups.values()]
    .filter(g => g.heads.size >= 2)
    .map(g => ({
      pr_number: g.pr_number,
      distinct_candidate_heads_observed: g.heads.size,
      completed_required_runs_observed: g.runs,
      additional_head_versions_lower_bound: g.heads.size - 1,
      oldest_observed_at: new Date(g.oldest).toISOString(),
      newest_observed_at: new Date(g.newest).toISOString()
    }))
    .sort((a,b) => b.additional_head_versions_lower_bound - a.additional_head_versions_lower_bound ||
                    a.pr_number - b.pr_number)
    .slice(0, 10);
  const additionalHeads = repeated.reduce((n,g) => n + g.additional_head_versions_lower_bound, 0);
  // Two PRs with repeated candidate versions justify an admin-led QUEUE EVALUATION,
  // never a causal assertion that main drift caused the updates or that checks were wasted.
  return {
    ...empty,
    status: invalid ? 'PARTIAL_INVALID_REQUIRED_RUN_EVIDENCE' :
      repeated.length ? 'SAMPLED_REPEATED_CANDIDATE_HEADS_NOT_CAUSAL' :
      'NO_REPEATED_HEADS_IN_BOUNDED_SAMPLE',
    sampled_required_runs: sampledRequired,
    invalid_required_run_rows: invalid,
    pr_count_with_repeated_heads: invalid ? 0 : repeated.length,
    additional_head_versions_lower_bound: invalid ? 0 : additionalHeads,
    provider_history_truncated: Number.isSafeInteger(totalCount) ?
      totalCount > workflowRuns.length : null,
    provider_total_count: Number.isSafeInteger(totalCount) ? totalCount : null,
    repeated_prs: invalid ? [] : repeated,
    merge_queue_advice: !invalid && repeated.length >= 2 && additionalHeads >= 3 ?
      'EVALUATE_GITHUB_NATIVE_MERGE_QUEUE_WITH_ADMIN_AFTER_BASELINE' :
      'NO_POLICY_CHANGE_WITHOUT_ADMIN_AND_EXACT_MERGE_GROUP_CHECKS'
  };
}
