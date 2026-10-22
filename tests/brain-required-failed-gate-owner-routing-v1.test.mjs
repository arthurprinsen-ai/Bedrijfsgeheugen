import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { latestGateRun, gateDecision, existingOwner, ownerSignalMarker, ownerSignalComment, boundedGateRequest, GATE_REQUEST_TIMEOUT_MS, eligibleMissingGateDispatch, MAX_MISSING_GATE_DISPATCHES_PER_TICK } from '../tools/delivery/failed-gate-owner-routing.mjs';

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
  assert.match(workflow, /actions: write/);
  assert.match(source, /MAX_OWNER_SIGNALS_PER_TICK = 2/);
  assert.match(source, /hasOwnerSignal\(pr.number, marker\)/);
  assert.match(source, /'SAME_OWNER_REPAIR_REQUIRED'/);
  assert.match(source, /gateDecision\(required\) !== 'MISSING'/);
  assert.match(source, /required-test\.yml\/dispatches/);
  assert.doesNotMatch(source, /\/actions\/runs\/[^'\"\\s]*\/cancel|skipLayoutShift|disableCls|allowCls/i);
});


test('bounded watchdog GitHub reads retry only transient GET failures and never hang', async () => {
  const calls = [];
  const delays = [];
  const responses = [{status:503}, {status:502}, {status:200}];
  const output = await boundedGateRequest(
    async (_url, options) => {
      calls.push(options);
      return responses.shift();
    }, '/actions/runs', {headers:{Accept:'application/json'}}, {
      sleep: async ms => {delays.push(ms);},
      timeout: ms => {
        assert.equal(ms, 12_000);
        return AbortSignal.timeout(ms);
      }
    }
  );
  assert.equal(output.status, 200);
  assert.equal(calls.length, 3);
  assert.deepEqual(delays, [250,750]);
  assert.equal(GATE_REQUEST_TIMEOUT_MS, 12_000);
  assert.equal(calls[0].signal instanceof AbortSignal, true);
});

test('bounded watchdog GET transport failures stop after two retries; permanent denial never retries', async () => {
  let attempts = 0;
  await assert.rejects(() => boundedGateRequest(async () => {
    attempts++;
    throw new Error('provider timeout');
  }, '/actions/runs', {}, {sleep:async()=>{}}), /provider timeout/);
  assert.equal(attempts, 3);
  attempts = 0;
  const denied = await boundedGateRequest(async () => {
    attempts++;
    return {status:403};
  }, '/actions/runs', {}, {sleep:async()=>{}});
  assert.equal(denied.status, 403);
  assert.equal(attempts, 1);
});

test('uncertain POST comments or dispatches must never retry without marker readback', async () => {
  let calls = 0;
  await assert.rejects(() => boundedGateRequest(async () => {
    calls++;
    throw new Error('ambiguous POST completion');
  }, '/issues/123/comments', {method:'POST',body:'{}'}, {sleep:async()=>{}}), /ambiguous POST completion/);
  assert.equal(calls, 1);
  calls = 0;
  const overload = await boundedGateRequest(async () => {
    calls++;
    return {status:503};
  }, '/actions/workflows/required-test.yml/dispatches', {method:'POST'}, {sleep:async()=>{}});
  assert.equal(overload.status, 503);
  assert.equal(calls, 1);
  const source = readFileSync('.github/scripts/required-gate-watchdog.mjs','utf8');
  assert.match(source, /boundedGateRequest\(fetch/);
  assert.match(source, /hasOwnerSignal\(pr.number, marker\)/);
});

test('historical 19-dispatch watchdog fanout is now bounded and never revives retired writers', () => {
  const active = {title:'fix(ci): same-owner recovery',body:'Writer-Lease-State: CANDIDATE_ACTIVE'};
  const retired = {title:'RETIRED — superseded by current-main repair',body:''};
  const released = {title:'fix(ci): old closure',body:'Writer-Lease-State: RELEASED'};
  const proven = {title:'fix(ci): done',body:'Terminal-State: LIVE_BEWEZEN'};
  assert.equal(MAX_MISSING_GATE_DISPATCHES_PER_TICK, 2);
  assert.equal(eligibleMissingGateDispatch(active, 0), true);
  assert.equal(eligibleMissingGateDispatch(active, 1), true);
  assert.equal(eligibleMissingGateDispatch(active, 2), false);
  assert.equal(eligibleMissingGateDispatch(retired, 0), false);
  assert.equal(eligibleMissingGateDispatch(released, 0), false);
  assert.equal(eligibleMissingGateDispatch(proven, 0), false);
  const script = readFileSync('.github/scripts/required-gate-watchdog.mjs','utf8');
  assert.match(script, /if \(!eligibleMissingGateDispatch\(pr, dispatched\)\) continue/);
  assert.match(script, /MAX_OWNER_SIGNALS_PER_TICK = 2/);
  assert.match(script, /REQUIRED_GATE_WATCHDOG_DONE/);
});
