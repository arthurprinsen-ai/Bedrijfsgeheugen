import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCompletionBackfill } from '../tools/outcome-obligation-completion-supervisor-backfill.mjs';

const productionIdentity = 'deploy:sha-live';
const liveEvidence = [
  { type:'CANDIDATE_TESTS', producer:'BRAIN_DELIVERY' },
  { type:'PROTECTED_DELIVERY', producer:'BG169', productionIdentity },
  { type:'PRODUCTION_IDENTITY', producer:'BG169', productionIdentity },
  { type:'FUNCTIONAL_READBACK', producer:'PRODUCTION_READBACK', productionIdentity },
  { type:'OBLIGATIONS_COMPLETE', producer:'OUTCOME_OBLIGATION_RUNTIME', productionIdentity },
  { type:'CAPABILITY_HANDOFF', producer:'BG167', productionIdentity },
  { type:'LEARNING_WRITEBACK', producer:'BG168_BG166', productionIdentity },
].map(item => ({ ...item, accepted:true, independent:true, taskIdentity:'ob-2', candidateIdentity:'sha-live' }));

test('shadow backfill reopens partial PR and failed workflow candidates without dispatching', () => {
  const report = reconcileCompletionBackfill({
    pullRequests:[
      { number:10, headSha:'sha-partial', state:'open', claim:'MERGED' },
      { number:11, headSha:'sha-live', state:'closed', claim:'DEPLOYED_UNVERIFIED', productionIdentity, evidence:liveEvidence, materialObligations:[{id:'prod',status:'VERIFIED'}] }
    ],
    workflowRuns:[
      { id:20, headSha:'sha-partial', name:'BRAIN delivery', conclusion:'failure' },
      { id:21, headSha:'sha-live', name:'production readback', conclusion:'success' }
    ],
    obligations:[
      { id:'ob-1', identity:'sha-partial', status:'AWAITING_OUTCOME', materialObligations:[{id:'prod',status:'OPEN'}] },
      { id:'ob-2', obligationId:'ob-2', identity:'sha-live', candidateIdentity:'sha-live', productionIdentity, status:'COMPLETED', materialObligations:[{id:'prod',status:'VERIFIED'}], evidence:liveEvidence }
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

test('active backfill does not recursively resume rows created by completion backfill itself', () => {
  const report = reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['ob-1'],
    obligations:[
      { id:'ob-1', identity:'original-work', status:'PENDING', triggerFingerprint:'workflow-run:Unified Brain Delivery:123' },
      { id:'ob-1', identity:'resume-work', status:'PENDING', triggerFingerprint:'completion-backfill:completion-supervisor|abc' }
    ]
  });

  assert.equal(report.dispatches.length, 1);
  assert.equal(report.dispatches[0].identity, 'original-work');
  assert.ok(report.candidates.some(item => item.identity === 'original-work'));
  assert.ok(!report.candidates.some(item => item.identity === 'resume-work'));
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
        recovery_packet:{
          blocker:'missing permission',
          root_cause:'external account permission',
          evidence_refs:['evidence:permission-denied'],
          attempted_repairs:['verified current token scope'],
          safe_remaining_actions:['retry after permission grant'],
          minimum_human_action:'grant required permission',
          fix_agent_handoff:'agent-reliability',
          boundary_fingerprint:'permission:v1',
          resume_when:{ signal:'permission_available' }
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
