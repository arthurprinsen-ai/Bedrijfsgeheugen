import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateSuccessorCreation, evaluatePullRequestSuccessorGuard } from '../scripts/brain/moving-main-successor-guard.mjs';

test('main movement without overlap forbids creating a successor', () => {
  assert.deepEqual(evaluateSuccessorCreation({
    priorCandidateOpen: true,
    driftDecision: { action:'KEEP_TESTED_FEATURE', reason:'non-overlapping-main-drift', overlap:[], contractOverlap:[] },
  }), {
    allowed: false,
    action: 'REUSE_EXISTING_CANDIDATE',
    reason: 'successor-forbidden-without-sync-required',
  });
});

test('real overlap permits synchronization but does not require a new successor', () => {
  assert.deepEqual(evaluateSuccessorCreation({
    priorCandidateOpen: true,
    driftDecision: { action:'SYNC_REQUIRED', reason:'changed-path-overlap', overlap:['.github/workflows/required-test.yml'], contractOverlap:[] },
  }), {
    allowed: false,
    action: 'SYNC_EXISTING_CANDIDATE',
    reason: 'sync-existing-candidate-first',
  });
});

test('successor is allowed only when sync is required and existing candidate cannot be safely synchronized', () => {
  assert.deepEqual(evaluateSuccessorCreation({
    priorCandidateOpen: true,
    existingCandidateSynchronizable: false,
    driftDecision: { action:'SYNC_REQUIRED', reason:'declared-contract-overlap', overlap:[], contractOverlap:['delivery-control-plane'] },
  }), {
    allowed: true,
    action: 'CREATE_SUCCESSOR',
    reason: 'sync-required-existing-candidate-unsynchronizable',
  });
});

test('PR successor wording is fail-closed without machine handoff evidence', () => {
  assert.deepEqual(evaluatePullRequestSuccessorGuard({
    title:'Clean successor on current main',
    body:'Main moved again so this was rebuilt from current main.'
  }), {
    ok:false,
    state:'SUCCESSOR_BLOCKED',
    action:'REUSE_OR_SYNC_EXISTING_CANDIDATE',
    reason:'missing-sync-required-evidence'
  });
});

test('PR successor is allowed only with sync, overlap and unsynchronizable evidence', () => {
  assert.deepEqual(evaluatePullRequestSuccessorGuard({
    title:'Clean successor to #1087',
    body:'Handoff-Decision: SYNC_REQUIRED\nHandoff-Evidence: changed-path-overlap\nExisting-Candidate-Synchronizable: false'
  }), {
    ok:true,
    state:'SUCCESSOR_ALLOWED',
    action:'CREATE_SUCCESSOR'
  });
});

test('Required avoids a workflow-level queue lock while expensive lanes stay PR-scoped and exact-head', async () => {
  const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  const header = workflow.slice(0, workflow.indexOf('\njobs:'));
  assert.doesNotMatch(header, /^concurrency:/m);
  for (const lane of ['netlify','supabase','backend','portal','automation','website']) {
    const groupLine = workflow.split(/\r?\n/).find((line) => line.trim().startsWith(`group: required-${lane}-`)) ?? '';
    assert.match(groupLine, /needs\.preflight\.outputs\.pr_number/);
    assert.doesNotMatch(groupLine, /pull_request\.head\.sha/);
  }
  assert.match(workflow, /PR_HEAD_SHA|candidate_sha|change_head_sha/);
  assert.match(workflow, /REQUIRED_STALE_HEAD_YIELD/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
});
