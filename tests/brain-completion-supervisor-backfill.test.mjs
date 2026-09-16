import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCompletionBackfill } from '../tools/outcome-obligation-completion-supervisor-backfill.mjs';

const liveEvidence = {
  trusted:true,
  identityBound:true,
  candidateIdentity:'sha-live',
  productionIdentity:'deploy:sha-live',
  readbackIdentity:'readback:sha-live',
  functionalReadback:true,
  learningWriteback:true,
  capabilityHandoff:true
};

test('shadow backfill reopens partial PR and failed workflow candidates without dispatching', () => {
  const report = reconcileCompletionBackfill({
    pullRequests:[
      { number:10, headSha:'sha-partial', state:'open', claim:'MERGED' },
      { number:11, headSha:'sha-live', state:'closed', claim:'DEPLOYED_UNVERIFIED', completionEvidence:liveEvidence, materialObligations:[{id:'prod',status:'VERIFIED'}] }
    ],
    workflowRuns:[
      { id:20, headSha:'sha-partial', name:'BRAIN delivery', conclusion:'failure' },
      { id:21, headSha:'sha-live', name:'production readback', conclusion:'success' }
    ],
    obligations:[
      { id:'ob-1', identity:'sha-partial', status:'AWAITING_OUTCOME', materialObligations:[{id:'prod',status:'OPEN'}] },
      { id:'ob-2', identity:'sha-live', status:'COMPLETED', materialObligations:[{id:'prod',status:'VERIFIED'}], completionEvidence:liveEvidence }
    ]
  });

  assert.equal(report.mode, 'shadow');
  assert.equal(report.productionMutation, false);
  assert.ok(report.candidates.some(item => item.identity === 'sha-partial'));
  assert.ok(report.skippedLiveVerified.some(item => item.identity === 'sha-live'));
  assert.equal(report.dispatches.length, 0);
});

test('active backfill creates idempotent resumes only for existing canonical obligations', () => {
  const report = reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['ob-1'],
    pullRequests:[{ number:10, headSha:'sha-partial', state:'open', claim:'MERGED' }],
    workflowRuns:[{ id:20, headSha:'sha-partial', name:'BRAIN delivery', conclusion:'failure' }],
    obligations:[{ id:'ob-1', identity:'sha-partial', status:'AWAITING_OUTCOME', materialObligations:[{id:'prod',status:'OPEN'}] }]
  });

  assert.equal(report.mode, 'active');
  assert.equal(report.productionMutation, false);
  assert.equal(report.durableResumeEnabled, true);
  assert.deepEqual(report.dispatches, [{
    obligationId:'ob-1',
    identity:'sha-partial',
    coalesceKey:report.candidates[0].lineageKey,
    triggerFingerprint:`completion-backfill:${report.candidates[0].idempotencyKey}`,
    nextAction:report.candidates[0].nextAction
  }]);
});

test('active backfill does not invent obligations or resume a hard external boundary', () => {
  const report = reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['known-obligation'],
    pullRequests:[{ number:12, headSha:'unbound-sha', state:'open', claim:'PREVIEW_READY' }],
    obligations:[{
      id:'known-obligation',
      identity:'blocked-sha',
      status:'BLOCKED_HARD_BOUNDARY',
      materialObligations:[{id:'prod',status:'OPEN'}],
      hardBoundary:{
        present:true,
        proven:true,
        evidence:'external permission is missing',
        recoveryPacket:{
          blocker:'missing permission',
          rootCause:'external account permission',
          evidenceRefs:['evidence:permission-denied'],
          attemptedFixes:['verified current token scope'],
          safeRemainingActions:['retry after permission grant'],
          minimumHumanAction:'grant required permission',
          fixAgentHandoff:'agent-reliability',
          boundaryFingerprint:'permission:v1',
          resumeWhen:'permission becomes available'
        }
      }
    }]
  });

  assert.equal(report.dispatches.length, 0);
  assert.ok(report.candidates.some(item => item.identity === 'unbound-sha'));
  assert.ok(report.candidates.some(item => item.identity === 'blocked-sha' && item.nextAction === 'WAIT_EXTERNAL'));
});

test('backfill deduplicates multiple partial signals into one identity lineage', () => {
  const report = reconcileCompletionBackfill({
    pullRequests:[{ number:12, headSha:'same-sha', state:'open', claim:'PREVIEW_READY' }],
    workflowRuns:[{ id:22, headSha:'same-sha', name:'readback', conclusion:'cancelled' }],
    obligations:[{ id:'ob-3', identity:'same-sha', status:'RECOVERING', materialObligations:[{id:'prod',status:'OPEN'}] }]
  });
  const matches = report.candidates.filter(item => item.identity === 'same-sha');
  assert.equal(matches.length, 1);
  assert.deepEqual(new Set(matches[0].sourceKinds), new Set(['pull_request','workflow_run','obligation']));
});

test('successful workflow alone never upgrades an identity to LIVE_VERIFIED', () => {
  const report = reconcileCompletionBackfill({
    workflowRuns:[{ id:30, headSha:'sha-only-green-workflow', name:'readback', conclusion:'success' }]
  });
  assert.equal(report.skippedLiveVerified.length, 0);
  assert.ok(report.candidates.some(item => item.identity === 'sha-only-green-workflow'));
});
