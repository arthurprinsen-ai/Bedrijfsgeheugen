import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyDailyLearning, reconcileDailyLearning, WORKFLOW_FILE } from '../tools/delivery/daily-learning-recovery.mjs';

const now = '2026-10-23T09:20:00Z';
const empty = { total_count: 0, workflow_runs: [] };
const observed = ({ event = 'schedule', conclusion = 'failure', status = 'completed', created_at = '2026-10-23T04:50:00Z', head_branch = 'main', id = 47 } = {}) =>
  ({ id, event, conclusion, status, created_at, head_branch });

test('no recovery before 3h grace after the original 04:47 UTC schedule', () => {
  const result = classifyDailyLearning({ now: '2026-10-23T07:46:59Z', workflowState: 'active', runs: [], totalCount: 0 });
  assert.equal(result.decision, 'WAIT_SCHEDULE_GRACE');
  assert.equal(result.eligible, false);
  const later = classifyDailyLearning({ now: '2026-10-23T07:47:00Z', workflowState: 'active', runs: [], totalCount: 0 });
  assert.equal(later.decision, 'MISSED_SCHEDULE_ELIGIBLE');
});

test('even failed, cancelled, queued, delayed or manually triggered current-day runs prevent duplicate dispatch', () => {
  for (const run of [
    observed({ conclusion: 'failure' }),
    observed({ conclusion: 'cancelled' }),
    observed({ conclusion: null, status: 'queued' }),
    observed({ created_at: '2026-10-23T07:59:00Z' }),
    observed({ event: 'workflow_dispatch' })
  ]) {
    const result = classifyDailyLearning({ now, workflowState: 'active', runs: [run], totalCount: 1 });
    assert.equal(result.decision, 'OBSERVED_TODAY');
    assert.equal(result.eligible, false);
  }
});

test('yesterday or unrelated branch/event cannot forge a current-day execution', () => {
  const result = classifyDailyLearning({ now, workflowState: 'active', runs: [
    observed({ created_at: '2026-10-22T22:00:00Z' }),
    observed({ head_branch: 'feature' }),
    observed({ event: 'pull_request' })
  ], totalCount: 3 });
  assert.equal(result.eligible, true);
});

test('unavailable, disabled or incomplete provider evidence fails closed', () => {
  for (const data of [
    { workflowState: 'disabled_manually', runs: [], totalCount: 0 },
    { workflowState: null, runs: [], totalCount: 0 },
    { workflowState: 'active', runs: null, totalCount: 0 },
    { workflowState: 'active', runs: [], totalCount: 1 },
    { workflowState: 'active', runs: Array.from({ length: 100 }, (_, i) => observed({ id:i })), totalCount:100 }
  ]) {
    assert.equal(classifyDailyLearning({ now, ...data }).eligible, false);
  }
});

test('dry-run never dispatches, regardless of whether the schedule is missing', async () => {
  let calls = 0;
  const x = await reconcileDailyLearning({ now, mode: 'dry-run', getWorkflow: async () => ({ state: 'active' }), listRuns: async () => empty, dispatch: async () => { calls++; return {}; } });
  assert.equal(x.decision, 'DRY_RUN_WOULD_DISPATCH');
  assert.equal(x.dispatch_attempted, false);
  assert.equal(calls, 0);
});

test('a provider run appearing in the mandatory second read blocks recovery', async () => {
  let reads = 0, writes = 0;
  const result = await reconcileDailyLearning({ now, mode: 'apply-safe', getWorkflow: async () => ({ state: 'active' }), listRuns: async () => {
    reads += 1;
    return reads === 1 ? empty : { total_count: 1, workflow_runs: [observed({ event: 'workflow_dispatch' })] };
  }, dispatch: async () => { writes++; return {}; } });
  assert.equal(reads, 2);
  assert.equal(result.decision, 'SECOND_READ_PREVENTED_DISPATCH');
  assert.equal(writes, 0);
});

test('genuinely missing existing daily workflow is dispatched once without claiming outcome', async () => {
  let writes = 0;
  const result = await reconcileDailyLearning({ now, mode: 'apply-safe', getWorkflow: async () => ({ state: 'active' }), listRuns: async () => empty, dispatch: async () => { writes++; return { workflow_run_id: 77 }; } });
  assert.equal(writes, 1);
  assert.equal(result.decision, 'DISPATCH_ACCEPTED_OUTCOME_UNVERIFIED');
  assert.equal(result.run_success_verified, false);
  assert.equal(result.provider_run_id, 77);
});

test('provider read error bubbles out rather than authorizing dispatch', async () => {
  let writes = 0;
  await assert.rejects(reconcileDailyLearning({ now, mode: 'apply-safe', getWorkflow: async () => ({ state: 'active' }), listRuns: async () => { throw new Error('PROVIDER_503'); }, dispatch: async () => { writes++; } }), /PROVIDER_503/);
  assert.equal(writes, 0);
});

test('reuses the Janitor cadence, token authority and existing daily learning workflow', async () => {
  const janitor = await readFile(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url), 'utf8');
  const daily = await readFile(new URL('../.github/workflows/powerhouse-daily-self-evolution.yml', import.meta.url), 'utf8');
  assert.match(janitor, /group: powerhouse-repository-janitor/);
  assert.match(janitor, /node tools\/delivery\/daily-learning-recovery\.mjs --apply-safe/);
  assert.match(janitor, /name: Recover missed daily learning/);
  assert.match(janitor, /actions: write/);
  assert.equal((janitor.match(/schedule:/g) || []).length, 1);
  assert.match(daily, /workflow_dispatch:/);
  assert.match(daily, /cron: '47 4 \* \* \*'/);
  assert.equal(WORKFLOW_FILE, 'powerhouse-daily-self-evolution.yml');
});
