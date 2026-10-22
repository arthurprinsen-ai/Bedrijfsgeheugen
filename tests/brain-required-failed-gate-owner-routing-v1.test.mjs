import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { latestGateRun, gateDecision, existingOwner, ownerSignalMarker, ownerSignalComment } from '../tools/delivery/failed-gate-owner-routing.mjs';

const sha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);
const run = (id, name, status, conclusion, at, head_sha = sha) =>
  ({ id, name, status, conclusion, head_sha, created_at: at, run_attempt: 1, html_url: `https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/${id}` });

test('current immutable head chooses only latest authoritative Required run', () => {
  const runs = [
    run(10, 'Required test', 'completed', 'failure', '2026-10-22T10:00:00Z'),
    run(11, 'Required test', 'completed', 'success', '2026-10-22T10:10:00Z'),
    run(12, 'Required test', 'completed', 'failure', '2026-10-22T10:20:00Z', otherSha),
    run(13, 'Powerhouse CodeQL', 'completed', 'failure', '2026-10-22T10:30:00Z')
  ];
  assert.equal(latestGateRun(runs, 'required', sha)?.id, 11);
  assert.equal(gateDecision(latestGateRun(runs, 'required', sha)), 'PROVEN_GATE_SUCCESS');
  assert.equal(latestGateRun(runs, 'codeql', sha)?.id, 13);
  assert.equal(gateDecision(latestGateRun(runs, 'codeql', sha)), 'SAME_OWNER_REPAIR_REQUIRED');
});

test('real failures request source recovery; queued and healthy runs are never blindly retried', () => {
  assert.equal(gateDecision(null), 'MISSING');
  for (const status of ['queued', 'pending', 'in_progress', 'waiting', 'requested'])
    assert.equal(gateDecision({ status }), 'ACTIVE_DO_NOT_RETRY');
  for (const conclusion of ['failure', 'timed_out', 'action_required', 'startup_failure'])
    assert.equal(gateDecision({ status: 'completed', conclusion }), 'SAME_OWNER_REPAIR_REQUIRED');
  for (const conclusion of ['skipped', 'cancelled', 'neutral'])
    assert.equal(gateDecision({ status: 'completed', conclusion }), 'INCOMPLETE_NO_SUCCESS');
});

test('same failure on same exact head is deduplicated without creating a second writer', () => {
  const marker = ownerSignalMarker('required', sha);
  assert.equal(marker, ownerSignalMarker('required', sha));
  assert.notEqual(marker, ownerSignalMarker('codeql', sha));
  assert.notEqual(marker, ownerSignalMarker('required', otherSha));
  assert.throws(() => ownerSignalMarker('required', 'main'), /INVALID_GATE_IDENTITY/);
  assert.equal(existingOwner('Writer-Lease-Owner: existing-agent\nObligation-ID: original'), 'existing-agent');
  assert.equal(existingOwner('Obligation-ID: original'), 'original');
});

test('handoff preserves immutable failure evidence, source repair, and unchanged website threshold', () => {
  const body = ownerSignalComment({
    gate: 'required', headSha: sha, owner: 'existing-agent',
    run: { ...run(39800626684, 'Required test', 'completed', 'failure', '2026-10-22T15:00:00Z'), repository: { full_name: 'arthurprinsen-ai/Bedrijfsgeheugen' } },
    job: { id: 119901773175, name: 'website / browser' }
  });
  assert.match(body, /BG_FAILED_GATE_SAME_OWNER_RECOVERY/);
  assert.match(body, /\/job\/119901773175/);
  assert.match(body, /existing-agent/);
  assert.match(body, /smallest source fix/);
  assert.match(body, /CLS > 0\.100/);
  assert.doesNotMatch(body, /\]\(\n/);
  assert.match(ownerSignalComment({ gate: 'codeql', headSha: sha, owner: 'old-owner', run: { id: 1, conclusion: 'startup_failure' } }), /No failing job/);
});

test('existing five minute scheduler and critical gates remain enabled and source remediation is not disguised as green', () => {
  const workflow = readFileSync('.github/workflows/required-gate-watchdog.yml', 'utf8');
  const source = readFileSync('.github/scripts/required-gate-watchdog.mjs', 'utf8');
  assert.match(workflow, /cron: '\*\/5 \* \* \* \*'/);
  assert.match(workflow, /issues: write/);
  // GitHub PR timeline comment POST can require both write scopes in practice.
  // Regression: live run 39811993147 returned 403 with Issues:write + PRs:read.
  assert.match(workflow, /pull-requests: write/);
  assert.doesNotMatch(workflow, /pull-requests: read/);
  assert.match(workflow, /actions: write/);
  assert.match(source, /MAX_OWNER_SIGNALS_PER_TICK = 2/);
  assert.match(source, /hasOwnerSignal\(pr.number, marker\)/);
  assert.match(source, /'SAME_OWNER_REPAIR_REQUIRED'/);
  assert.match(source, /gateDecision\(required\) !== 'MISSING'/);
  assert.match(source, /required-test\.yml\/dispatches/);
  assert.doesNotMatch(source, /\/actions\/runs\/[^'\"\\s]*\/cancel|skipLayoutShift|disableCls|allowCls/i);
});

test('GitHub comment permission denial isolates unrelated Required dispatch without false green', () => {
  assert.equal(isOwnerCommentPermissionDenied({ status: 403, path: '/issues/4656/comments' }, 4656), true);
  assert.equal(isOwnerCommentPermissionDenied({ status: 401, path: '/issues/4656/comments' }, 4656), true);
  assert.equal(isOwnerCommentPermissionDenied({ status: 403, path: '/issues/4656/comments' }, 4657), false);
  assert.equal(isOwnerCommentPermissionDenied({ status: 500, path: '/issues/4656/comments' }, 4656), false);
  assert.equal(isOwnerCommentPermissionDenied({ status: 403, path: '/actions/runs/1' }, 4656), false);
  const workflow = readFileSync('.github/workflows/required-gate-watchdog.yml', 'utf8');
  const source = readFileSync('.github/scripts/required-gate-watchdog.mjs', 'utf8');
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /issues: write/);
  assert.match(source, /attemptedOwnerSignals >= MAX_OWNER_SIGNALS_PER_TICK/);
  assert.match(source, /isOwnerCommentPermissionDenied\(error, pr.number\)/);
  assert.match(source, /FAILED_GATE_OWNER_COMMENT_AUTHZ_DENIED/);
  assert.match(source, /FAILED_GATE_OWNER_HANDOFF_INCOMPLETE/);
  assert.match(source, /process.exitCode = 1/);
  assert.match(source, /REQUIRED_GATE_WATCHDOG_DISPATCHED/);
});
