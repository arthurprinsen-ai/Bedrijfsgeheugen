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
  assert.equal(report.dispatches.length,1);
  assert.equal(report.dispatches[0].obligationId,'ob-1');
  assert.equal(report.dispatches[0].identity,'sha-partial');
  assert.match(report.dispatches[0].coalesceKey,/^completion-backfill\|canonical-obligation\|/);
  assert.match(report.dispatches[0].triggerFingerprint,/^completion-backfill:canonical-obligation:/);
  assert.equal(report.dispatches[0].sourceCandidateCount,1);
  assert.match(report.dispatches[0].sourceIdentityDigest,/^[a-f0-9]{20}$/);
  assert.equal(report.dispatches[0].nextAction,report.candidates[0].nextAction);
  assert.deepEqual(report.dispatches[0].sourceActions,[report.candidates[0].nextAction]);
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

test('4,000 source identities for six canonical obligations cause six wakeups, not 4,000 AgentWork writes',()=>{
  const source=Array.from({length:4000},(_,i)=>({
    id:`ob-${i%6+1}`,
    identity:`immutable-original-${String(i).padStart(6,'0')}`,
    status:'PENDING',
    triggerFingerprint:`source-original:${i}`
  }));
  const report=reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['ob-1','ob-2','ob-3','ob-4','ob-5','ob-6'],
    obligations:source,
  });
  assert.equal(report.candidateCount,4000,'every original source identity remains in the audit report');
  assert.equal(report.candidates.length,4000);
  assert.equal(report.dispatches.length,6,'exactly one durable wakeup per original registered owner obligation');
  assert.equal(report.dispatches.reduce((n,d)=>n+d.sourceCandidateCount,0),4000);
  assert.equal(new Set(report.dispatches.map(d=>d.coalesceKey)).size,6);
  assert.equal(new Set(report.dispatches.map(d=>d.triggerFingerprint)).size,6);
  assert.ok(report.dispatches.every(d=>['RECOVER','READBACK','PROMOTE','WRITEBACK','CONTINUE'].includes(d.nextAction)));
  assert.ok(report.dispatches.every(d=>Array.isArray(d.sourceActions)&&d.sourceActions.length>=1));
  assert.ok(report.dispatches.every(d=>/^[a-f0-9]{20}$/.test(d.sourceIdentityDigest)));
});

test('replaying a historic snapshot or adding more source IDs cannot create another wakeup lineage',()=>{
  const original=[{id:'ob-1',identity:'event-a',status:'PENDING'},
    {id:'ob-1',identity:'event-b',status:'PENDING'},
    {id:'ob-2',identity:'event-c',status:'RECOVERING'}];
  const options={mode:'active',registeredObligationIds:['ob-1','ob-2']};
  const first=reconcileCompletionBackfill({...options,obligations:original});
  const repeated=reconcileCompletionBackfill({...options,obligations:[...original].reverse()});
  const expanded=reconcileCompletionBackfill({...options,obligations:[
    ...original,{id:'ob-1',identity:'event-newer',status:'PENDING'}
  ]});
  assert.deepEqual(first.dispatches,repeated.dispatches);
  assert.equal(first.dispatches.length,2);
  assert.deepEqual(
    first.dispatches.map(d=>[d.obligationId,d.coalesceKey,d.triggerFingerprint]),
    expanded.dispatches.map(d=>[d.obligationId,d.coalesceKey,d.triggerFingerprint]),
    'new original evidence extends the same owner lineage, not a second owner dispatch'
  );
  assert.equal(expanded.candidateCount,4);
  assert.equal(expanded.dispatches[0].sourceCandidateCount,3);
  assert.notEqual(expanded.dispatches[0].sourceIdentityDigest,first.dispatches[0].sourceIdentityDigest,
    'source audit fingerprint changes while immutable wakeup idempotency stays stable');
});

test('a single proven hard boundary prevents source fanout for that owner without hiding its provenance',()=>{
  const r=reconcileCompletionBackfill({
    mode:'active',registeredObligationIds:['ob-1'],
    obligations:[
      {id:'ob-1',identity:'normal-source',status:'PENDING'},
      {id:'ob-1',identity:'blocked-source',status:'BLOCKED_HARD_BOUNDARY',hardBoundary:{
        present:true,proven:true,evidence:'external provider consent absent',
        recovery_packet:{
          blocker:'provider permission missing',root_cause:'no consent',evidence_refs:['ref:permission'],
          attempted_repairs:['checked authorized scopes'],safe_remaining_actions:['retry when user grants consent'],
          minimum_human_action:'authorize required scope',fix_agent_handoff:'agent-reliability',
          boundary_fingerprint:'provider-permission-v1',resume_when:{signal:'permission_available'}
        }
      }}
    ]
  });
  assert.equal(r.candidateCount,2);
  assert.equal(r.dispatches.length,0,'original blocked owner remains open; never bypass consent via another source');
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
