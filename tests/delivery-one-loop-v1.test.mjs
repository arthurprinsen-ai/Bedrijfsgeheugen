import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { classifyTerminalState, evaluateExecutionLease, evaluateFinishingPressure, evaluateGitHubQueueRecovery, reconcileExecution } from '../tools/delivery/one-loop.mjs';
import { normalizeGitHubDeliveryTelemetry } from '../tools/delivery/github-learning.mjs';
import { classifyCandidate, evaluateAdmission } from '../tools/delivery/delivery-hygiene.mjs';

const evidence = { exactHeadVerified: true, protectedMergeVerified: true, runtimeReadbackVerified: true, learningWritebackVerified: true };
const baseSha = 'a'.repeat(40);
const policy = JSON.parse(readFileSync(new URL('../config/powerhouse-delivery-hygiene-v1.json', import.meta.url), 'utf8'));
const workflowBudget = JSON.parse(readFileSync(new URL('../config/powerhouse-pr-workflow-budget-v1.json', import.meta.url), 'utf8'));
const workflow = (name) => readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');

function candidate(number, obligationId, candidateType, lane = 'automation') {
  return classifyCandidate({
    number,
    state: 'open',
    body: `Obligation-ID: ${obligationId}\nDelivery-Lane: ${lane}\nCandidate-Type: ${candidateType}\nBase-SHA: ${baseSha}\nSupersedes: none`,
    baseSha,
    headSha: String(number).padStart(40, 'b').slice(0, 40),
  }, policy);
}

test('delivery lane treats stranded states as recoverable and evidence-backed fulfillment as terminal', () => {
  for (const state of ['COMMITTED','PR_OPEN','CI_QUEUED','TIMEOUT','CHAT_STOPPED','WORKER_LOST','LEASE_EXPIRED']) {
    const result = classifyTerminalState(state, evidence);
    assert.equal(result.valid, false, state);
    assert.equal(result.recoveryRequired, true, state);
  }
  assert.equal(classifyTerminalState('FULFILLED', evidence).valid, true);
  assert.equal(evaluateExecutionLease({ state: 'EXECUTING', leaseExpiresAt: '2026-09-17T17:59:00Z' }, Date.parse('2026-09-17T18:00:00Z')), 'RECOVER');
});

test('GitHub Actions queue is never a terminal external blocker and never causes retry amplification', () => {
  const blocked = classifyTerminalState('BLOCKED_EXTERNAL', {
    externalBlockerVerified: true,
    blockerClass: 'GITHUB_ACTIONS_QUEUE',
    recoveryPath: 'Keep the same exact-head obligation active until runner capacity returns.',
  });
  assert.equal(blocked.valid, false);
  assert.equal(blocked.recoveryRequired, true);

  const queued = evaluateGitHubQueueRecovery({
    status: 'queued',
    headSha: 'sha-a',
    currentHeadSha: 'sha-a',
    runAttempt: 1,
  });
  assert.deepEqual(queued, {
    state: 'WAITING_CAPACITY',
    action: 'WAIT',
    retry: false,
    reason: 'GITHUB_ACTIONS_QUEUE_NON_TERMINAL',
  });

  const failed = evaluateGitHubQueueRecovery({
    status: 'completed',
    conclusion: 'failure',
    headSha: 'sha-a',
    currentHeadSha: 'sha-a',
    runAttempt: 1,
  });
  assert.equal(failed.action, 'RECOVER');
  assert.equal(failed.retry, true);
});

test('stale GitHub queue reconciles before any retry', () => {
  const now = Date.parse('2026-09-17T20:00:00Z');
  const queued = evaluateGitHubQueueRecovery({
    status: 'queued',
    queuedAt: '2026-09-17T19:55:00Z',
    staleAfterMs: 120000,
  }, now);
  assert.deepEqual(queued, {
    state: 'RECONCILING',
    action: 'RECOVER',
    retry: false,
    reason: 'GITHUB_ACTIONS_QUEUE_STALE_RECONCILE',
  });
});

test('PR governance fan-out is admitted once through Required before duplicate contract suites consume runners', () => {
  for (const name of [
    'brain-foundation-verify.yml',
    'shared-agent-memory-tests.yml',
    'bg168-materiality-promotion-tests.yml',
    'learning-contract-delivery-classifier-tests.yml',
    'engineering-intelligence-trust.yml',
  ]) {
    assert.doesNotMatch(workflow(name), /^\s*pull_request\s*:/m, name);
  }

  const required = workflow('required-test.yml');
  const automation = workflow('lane-automation.yml');
  assert.match(required, /powerhouse-delivery-hygiene\.yml/);
  assert.match(required, /brain-learning-contract-delivery-classification\.test\.mjs/);
  assert.match(required, /engineering-trust-contract\.test\.mjs/);
  assert.match(required, /make-agent-learning-promotion-contract\.test\.mjs/);
  assert.match(automation, /scripts\/brain\/test-all\.mjs/);
  assert.match(automation, /development-doc-contract\.test\.mjs/);
});

test('delivery admission avoids N+1 file reads for ordinary open PRs', () => {
  const hygiene = workflow('powerhouse-delivery-hygiene.yml');
  assert.match(hygiene, /metadata\.candidateType === 'promotion'/);
  assert.match(hygiene, /pulls\/\$\{item\.number\}\/files\?per_page=100/);
  assert.doesNotMatch(hygiene, /if \(validateDeliveryMetadata\(metadata, policy\)\.ok\) \{\s*const files = await gh/);
});

test('CodeQL keeps Python and Powerhouse JavaScript coverage without analyzing JavaScript twice on each PR', () => {
  const generic = workflow('codeql.yml');
  const powerhouse = workflow('powerhouse-codeql.yml');
  assert.match(generic, /language:\s*\[python\]/);
  assert.match(generic, /'\*\*\/\*\.py'/);
  assert.doesNotMatch(generic, /javascript-typescript/);
  assert.match(powerhouse, /languages:\s*javascript-typescript/);
  assert.match(powerhouse, /queries:\s*security-extended/);
});

test('delivery lane preserves finish-before-start and single-candidate recovery', () => {
  assert.equal(evaluateFinishingPressure({ maxExecutable: 5, admittedExecutable: 5, finishing: 2, candidate: { type: 'implementation', lane: 'portal' } }).decision, 'WAITING_CAPACITY');
  assert.equal(reconcileExecution({ state: 'WORKER_LOST', activeCandidates: ['a','b'], candidateSha: 'a' }).action, 'REVIEW_REQUIRED');
  assert.equal(policy.wip.finishBeforeStart, true);
  assert.ok(policy.deliveryControlPlanePaths.includes('config/powerhouse-one-loop-v1.json'));
});

test('parallel development is not capped by integration WIP', () => {
  const subject = candidate(99, 'parallel-new', 'implementation', 'backend');
  const open = Array.from({ length: 12 }, (_, index) => candidate(index + 1, `parallel-${index + 1}`, 'implementation', 'backend'));
  const result = evaluateAdmission({ candidate: subject, openCandidates: open, policy, currentMainSha: baseSha });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
});

test('canonical delivery hygiene holds new implementation while promotion or recovery is finishing', () => {
  const implementation = candidate(20, 'new-feature', 'implementation');
  const promotion = candidate(10, 'release-existing', 'promotion');
  const blocked = evaluateAdmission({ candidate: implementation, openCandidates: [promotion], policy, currentMainSha: baseSha });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.state, 'WAITING_CAPACITY');
  assert.deepEqual(blocked.blockers, [10]);

  const recovery = candidate(30, 'incident-fix', 'recovery', 'incident');
  const priority = evaluateAdmission({ candidate: recovery, openCandidates: [promotion], policy, currentMainSha: baseSha });
  assert.equal(priority.ok, true);
});

test('workflow budget codifies one orchestrator and uncapped development', () => {
  assert.equal(workflowBudget.canonicalRequiredOrchestrator, '.github/workflows/required-test.yml');
  assert.equal(workflowBudget.developmentConcurrency.cappedByIntegrationWip, false);
  assert.equal(workflowBudget.queue.staleAction, 'RECONCILE');
  assert.equal(workflowBudget.queue.blindRetry, false);
  assert.ok(workflowBudget.invariants.includes('no-broad-duplicate-heavy-pr-fanout'));
});

test('GitHub failures generate stable reusable delivery fingerprints', () => {
  const make = (obligationId, number, headSha) => normalizeGitHubDeliveryTelemetry({
    obligationId,
    pr: { number, createdAt: '2026-09-17T18:00:00Z', headSha, baseSha: 'base', mergeable: false },
    workflows: [{ name: 'Required test', queuedAt: '2026-09-17T18:00:00Z', startedAt: '2026-09-17T18:01:00Z', completedAt: '2026-09-17T18:02:00Z', conclusion: 'failure', attempt: 1 }],
    mainMovements: 1,
    mergeConflicts: 1,
  });
  assert.equal(make('a',1,'a').failureFingerprint, make('b',2,'b').failureFingerprint);
});
