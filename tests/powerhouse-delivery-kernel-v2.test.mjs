import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { evaluateAdmission } from '../tools/delivery/delivery-hygiene.mjs';
import { evaluateGitHubQueueRecovery } from '../tools/delivery/one-loop.mjs';

const SHA = 'a'.repeat(40);
const POLICY = {
  wip: { maxExecutable: 5 },
  allowedLanes: ['backend', 'portal', 'website', 'automation', 'security', 'incident', 'dependency', 'docs'],
  allowedCandidateTypes: ['implementation', 'recovery', 'security', 'dependency', 'docs', 'promotion'],
  nonProductLanes: ['dependency', 'docs'],
};

function candidate(number, obligationId, candidateType = 'implementation') {
  return {
    number,
    state: 'open',
    executable: true,
    baseSha: SHA,
    headSha: String(number).padStart(40, 'b').slice(0, 40),
    metadata: { obligationId, deliveryLane: 'backend', candidateType, baseSha: SHA, supersedes: null },
    conflictContracts: [`domain-${number}`],
  };
}

test('parallel development is not capped by integration WIP', () => {
  const openCandidates = Array.from({ length: 12 }, (_, index) => candidate(index + 1, `obligation-${index + 1}`));
  const result = evaluateAdmission({ candidate: candidate(99, 'obligation-new'), openCandidates, policy: POLICY, currentMainSha: SHA });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
});

test('stale GitHub queue becomes recoverable instead of waiting forever', () => {
  const now = Date.parse('2026-09-17T20:00:00Z');
  const result = evaluateGitHubQueueRecovery({ status: 'queued', queuedAt: '2026-09-17T19:55:00Z', staleAfterMs: 120000 }, now);
  assert.equal(result.action, 'RECOVER');
  assert.equal(result.reason, 'GITHUB_ACTIONS_QUEUE_STALE_RECONCILE');
});

test('generic CodeQL PR trigger is Python-scoped to avoid duplicate JavaScript scanning', () => {
  const source = readFileSync('.github/workflows/codeql.yml', 'utf8');
  assert.match(source, /pull_request:\s*\n\s+paths:\s*\n\s+- '\*\*\/\*\.py'/);
});

test('PR workflow budget policy exists as a regression authority', () => {
  assert.equal(existsSync('config/powerhouse-pr-workflow-budget-v1.json'), true);
});
