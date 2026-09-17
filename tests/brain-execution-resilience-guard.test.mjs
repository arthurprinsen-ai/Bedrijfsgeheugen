import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildRecoveryPlan,
  classifyInterruption,
  computeRetryDelay,
  evaluateResumeSafety,
  isTerminalState,
  nextRunState,
  shouldWatchdogRecover
} from '../brain/guards/execution-resilience.mjs';

const contract = JSON.parse(fs.readFileSync('config/powerhouse-execution-resilience-v1.json', 'utf8'));
const continuity = JSON.parse(fs.readFileSync('brain/policies/powerhouse-agent-continuity-v1.json', 'utf8'));
const preflightSource = fs.readFileSync('scripts/brain/chat-learning-preflight.mjs', 'utf8');
const migrationSource = fs.readFileSync('supabase/migrations/20260917083000_powerhouse_execution_resilience_v1.sql', 'utf8');
const scheduleMigrationSource = fs.readFileSync('supabase/migrations/20260917090000_powerhouse_execution_resilience_watchdog_schedule_v1.sql', 'utf8');

test('canonical resilience contract is active and mandatory for every material agent preflight', () => {
  assert.equal(contract.status, 'ACTIVE');
  assert.equal(contract.fingerprint, 'powerhouse-execution-resilience-v1');
  assert.ok(contract.scope.includes('all_current_and_future_chats'));
  assert.ok(contract.scope.includes('all_current_and_future_agents'));
  assert.ok(preflightSource.includes("'config/powerhouse-execution-resilience-v1.json'"));
});

test('canonical agent continuity contract requires resumable interrupted execution', () => {
  assert.equal(continuity.status, 'ACTIVE');
  assert.equal(continuity.interruption_continuity_rule.required, true);
  assert.equal(continuity.interruption_continuity_rule.canonical_contract, 'config/powerhouse-execution-resilience-v1.json');
  assert.ok(continuity.invariants.includes('INTERRUPTION_IS_NOT_COMPLETION'));
  assert.ok(continuity.invariants.includes('READBACK_BEFORE_MUTATING_REPLAY'));
  assert.ok(continuity.terminal_green_requires.includes('no_unreconciled_interrupted_non_terminal_run'));
});

test('durable runtime reuses canonical Brain operations and reconciliation instead of a parallel execution store', () => {
  assert.ok(migrationSource.includes('returns public.brain_operations'));
  assert.ok(migrationSource.includes('public.brain_schedule_reconciliation'));
  assert.ok(migrationSource.includes("status = 'RESULT_UNKNOWN'"));
  assert.ok(migrationSource.includes("'state', 'RECOVERY_REQUIRED'"));
  assert.ok(migrationSource.includes("'readback_before_replay', true"));
  assert.ok(migrationSource.includes("'execution-resilience:' || p_operation_id::text || ':v' || v_operation.version::text"));
  assert.doesNotMatch(migrationSource, /create\s+table\s+.*execution/i);
});

test('production watchdog wiring is source-controlled, recurring, and recovery-only', () => {
  assert.ok(scheduleMigrationSource.includes("'powerhouse-execution-resilience-watchdog-v1'"));
  assert.ok(scheduleMigrationSource.includes("'* * * * *'"));
  assert.ok(scheduleMigrationSource.includes("'select public.powerhouse_execution_resilience_watchdog_v1();'"));
  assert.ok(scheduleMigrationSource.includes('cron.schedule'));
  assert.doesNotMatch(scheduleMigrationSource, /insert\s+into\s+.*side_effect/i);
  assert.doesNotMatch(scheduleMigrationSource, /http|fetch|publish|send_mail|deploy/i);
});

test('database surface is fail-closed to public clients', () => {
  assert.ok(migrationSource.includes('revoke execute on function public.powerhouse_execution_heartbeat_v1'));
  assert.ok(migrationSource.includes('revoke execute on function public.powerhouse_mark_execution_interrupted_v1'));
  assert.ok(migrationSource.includes('revoke execute on function public.powerhouse_execution_resilience_watchdog_v1'));
  assert.ok(migrationSource.includes('from public, anon, authenticated'));
  assert.ok(migrationSource.includes('grant execute on function public.powerhouse_execution_resilience_watchdog_v1'));
  assert.ok(migrationSource.includes('to service_role'));
});

test('classifies visible ChatGPT interruption modes as recoverable classes', () => {
  assert.equal(classifyInterruption('De netwerkverbinding is verbroken'), 'NETWORK_DISCONNECT');
  assert.equal(classifyInterruption('Streaming onderbroken'), 'STREAM_INTERRUPTED');
  assert.equal(classifyInterruption('Redeneren mislukt'), 'REASONING_ABORTED');
  assert.equal(classifyInterruption('Gestopt met nadenken'), 'REASONING_ABORTED');
});

test('an interruption never becomes a successful terminal state by itself', () => {
  assert.equal(nextRunState({ state: 'RUNNING', interrupted: true }), 'RECOVERY_REQUIRED');
  assert.equal(nextRunState({ state: 'RUNNING', verifiedOutcome: true }), 'COMPLETED');
  assert.equal(isTerminalState('RECOVERY_REQUIRED'), false);
  assert.deepEqual(new Set(contract.terminal_states), new Set(['COMPLETED', 'BLOCKED_HARD_BOUNDARY']));
});

test('backoff is bounded and supports jitter', () => {
  const policy = contract.retry_policy;
  assert.equal(computeRetryDelay(1, policy, () => 0.5), 1000);
  assert.equal(computeRetryDelay(8, policy, () => 0.5), 60000);
});

test('mutation replay requires readback or idempotency protection', () => {
  assert.deepEqual(
    evaluateResumeSafety({ sideEffectState: 'EFFECT_APPLIED', idempotencyKey: 'abc' }),
    { action: 'READBACK_REQUIRED', reason: 'EFFECT_APPLIED_BUT_UNVERIFIED' }
  );
  assert.deepEqual(
    evaluateResumeSafety({ sideEffectState: 'NOT_STARTED' }),
    { action: 'BLOCK_MUTATION', reason: 'NO_IDEMPOTENCY_OR_DEDUPE_PROOF' }
  );
  assert.equal(
    evaluateResumeSafety({ sideEffectState: 'NOT_STARTED', idempotencyKey: 'abc' }).action,
    'RESUME_SAFE'
  );
});

test('watchdog recovers stale or heartbeat-less non-terminal runs only', () => {
  const now = Date.parse('2026-09-17T10:16:00+02:00');
  assert.equal(shouldWatchdogRecover({ state: 'RUNNING', lastHeartbeatAt: null, now }), true);
  assert.equal(shouldWatchdogRecover({ state: 'RUNNING', lastHeartbeatAt: now - 121000, now }), true);
  assert.equal(shouldWatchdogRecover({ state: 'COMPLETED', lastHeartbeatAt: null, now }), false);
});

test('recovery resumes from last verified checkpoint and respects retry limits', () => {
  const plan = buildRecoveryPlan({
    state: 'RUNNING',
    interrupted: true,
    interruption: 'Streaming onderbroken',
    attempt: 1,
    identical_retry_count: 1,
    side_effect_state: 'NOT_STARTED',
    idempotency_key: 'run:42:step:publish',
    last_verified_checkpoint: 'step-3'
  }, contract);
  assert.equal(plan.action, 'RESUME_FROM_CHECKPOINT');
  assert.equal(plan.checkpoint, 'step-3');
  assert.equal(plan.interruption_type, 'STREAM_INTERRUPTED');

  const exhausted = buildRecoveryPlan({
    state: 'RECOVERY_REQUIRED',
    attempt: 2,
    identical_retry_count: 2,
    side_effect_state: 'NOT_STARTED',
    idempotency_key: 'x'
  }, contract);
  assert.equal(exhausted.action, 'CHANGE_HYPOTHESIS');
});
