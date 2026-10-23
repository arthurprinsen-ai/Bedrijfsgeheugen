import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const WORKFLOW_FILE = 'powerhouse-daily-self-evolution.yml';
export const FINGERPRINT = 'powerhouse-daily-learning-missed-schedule-recovery-v1';
export const SCHEDULE_HOUR_UTC = 4;
export const SCHEDULE_MINUTE_UTC = 47;
export const GRACE_MINUTES = 180;

export function classifyDailyLearning({ now, workflowState, runs, totalCount, graceMinutes = GRACE_MINUTES } = {}) {
  const instant = new Date(now);
  if (!Number.isFinite(instant.getTime())) throw new TypeError('VALID_OBSERVATION_TIME_REQUIRED');
  const day = instant.toISOString().slice(0, 10);
  const due = Date.parse(day + 'T04:47:00.000Z') + graceMinutes * 60000;
  const base = { day, scheduled_at: day + 'T04:47:00.000Z', dispatch_not_before: new Date(due).toISOString(), observed_at: instant.toISOString(), projection_only: true };
  if (workflowState !== 'active') return { ...base, decision: 'HOLD_WORKFLOW_NOT_ACTIVE', eligible: false };
  if (!Array.isArray(runs) || !Number.isInteger(totalCount) || totalCount < 0 || totalCount > runs.length) {
    return { ...base, decision: 'HOLD_PROVIDER_EVIDENCE_INCOMPLETE', eligible: false };
  }
  if (totalCount >= 100) return { ...base, decision: 'HOLD_PROVIDER_PAGINATION_AMBIGUOUS', eligible: false };
  const observed = runs.filter(run =>
    run && run.head_branch === 'main' &&
    ['schedule', 'workflow_dispatch'].includes(run.event) &&
    typeof run.created_at === 'string' && run.created_at.slice(0, 10) === day
  );
  if (observed.length) return {
    ...base, decision: 'OBSERVED_TODAY', eligible: false, run_ids: observed.map(run => run.id),
    run_states: observed.map(run => ({ id: run.id, status: run.status ?? null, conclusion: run.conclusion ?? null }))
  };
  if (instant.getTime() < due) return { ...base, decision: 'WAIT_SCHEDULE_GRACE', eligible: false };
  return { ...base, decision: 'MISSED_SCHEDULE_ELIGIBLE', eligible: true };
}

export async function reconcileDailyLearning({ now = new Date().toISOString(), mode = 'dry-run', getWorkflow, listRuns, dispatch } = {}) {
  if (!['dry-run', 'apply-safe'].includes(mode)) throw new TypeError('UNSUPPORTED_MODE');
  if (![getWorkflow, listRuns, dispatch].every(fn => typeof fn === 'function')) throw new TypeError('PROVIDER_ADAPTER_REQUIRED');
  const workflow = await getWorkflow();
  const first = await listRuns();
  const initial = classifyDailyLearning({ now, workflowState: workflow?.state, runs: first?.workflow_runs, totalCount: first?.total_count });
  if (!initial.eligible || mode === 'dry-run') return {
    fingerprint: FINGERPRINT, mode, initial, decision: mode === 'dry-run' && initial.eligible ? 'DRY_RUN_WOULD_DISPATCH' : initial.decision,
    dispatch_attempted: false, run_success_verified: false
  };
  // Immediately re-read the provider before dispatch; never infer absence from a failed API read.
  const second = await listRuns();
  const current = classifyDailyLearning({ now, workflowState: workflow?.state, runs: second?.workflow_runs, totalCount: second?.total_count });
  if (!current.eligible) return {
    fingerprint: FINGERPRINT, mode, initial, second_check: current, decision: 'SECOND_READ_PREVENTED_DISPATCH',
    dispatch_attempted: false, run_success_verified: false
  };
  const receipt = await dispatch();
  return {
    fingerprint: FINGERPRINT, mode, initial, second_check: current, decision: 'DISPATCH_ACCEPTED_OUTCOME_UNVERIFIED',
    dispatch_attempted: true, run_success_verified: false,
    provider_run_id: Number.isInteger(receipt?.workflow_run_id) ? receipt.workflow_run_id : null
  };
}

function githubApi(endpoint, args = []) {
  const raw = execFileSync('gh', ['api', ...args, endpoint], { encoding: 'utf8', timeout: 20000 });
  return raw.trim() ? JSON.parse(raw) : {};
}

export async function runGithubDailyLearningRecovery({ mode = 'dry-run', now = new Date().toISOString(), env = process.env } = {}) {
  const repo = env.GITHUB_REPOSITORY;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo ?? '')) throw new Error('GITHUB_REPOSITORY_REQUIRED');
  if (env.GITHUB_REF !== 'refs/heads/main') throw new Error('TRUSTED_MAIN_REF_REQUIRED');
  const prefix = 'repos/' + repo + '/actions/workflows/' + WORKFLOW_FILE;
  const day = new Date(now).toISOString().slice(0, 10);
  return reconcileDailyLearning({
    mode, now,
    getWorkflow: async () => githubApi(prefix),
    listRuns: async () => githubApi(prefix + '/runs?branch=main&created=' + day + '&per_page=100'),
    dispatch: async () => githubApi(prefix + '/dispatches', ['-X', 'POST', '-f', 'ref=main'])
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const mode = process.argv.includes('--apply-safe') ? 'apply-safe' : 'dry-run';
  const artifactPath = '.artifacts/daily-learning-recovery.json';
  let report;
  try {
    report = await runGithubDailyLearningRecovery({ mode });
  } catch (error) {
    report = {
      fingerprint: FINGERPRINT, mode, decision: 'PROVIDER_ERROR_HOLD', dispatch_attempted: false,
      run_success_verified: false, error: String(error?.message ?? error)
    };
    process.exitCode = 1;
  }
  mkdirSync('.artifacts', { recursive: true });
  writeFileSync(artifactPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
