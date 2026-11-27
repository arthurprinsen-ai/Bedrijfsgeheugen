import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { reconcileCompletionBackfill, selectOriginalBackfillTrigger, applyOriginalBackfillDuePolicy, checkpointCompletionBackfill } from '../tools/outcome-obligation-completion-supervisor-backfill.mjs';

const productionIdentity = 'deploy:sha-live';
const liveEvidence = [
  { type:'CANDIDATE_TESTS', producer:'BRAIN_DELIVERY' },
  { type:'PROTECTED_DELIVERY', producer:'BG169', productionIdentity },
  { type:'PRODUCTION_IDENTITY', producer:'BG169', productionIdentity },
  { type:'FUNCTIONAL_READBACK', producer:'PRODUCTION_READBACK', productionIdentity },
  { type:'OBLIGATIONS_COMPLETE', producer:'PRODUCTION_READBACK', productionIdentity },
  { type:'CAPABILITY_HANDOFF', producer:'BG167', productionIdentity },
  { type:'LEARNING_WRITEBACK', producer:'BG168_BG166', productionIdentity },
].map(item => ({ ...item, accepted:true, independent:true, taskIdentity:'ob-2', candidateIdentity:'sha-live', ...(item.type==='OBLIGATIONS_COMPLETE'?{exactProduction:true,metadata:{materialSourceRef:'material-readback:ob-2',materialSourceRevision:'source-rev:sha-live'}}:item.type==='CAPABILITY_HANDOFF'?{exactProduction:true,metadata:{sourceRevision:'sha-live',sourceReceiptRef:'original:handoff-readback',consumerAckRef:'original:consumer-processed-ack'}}:item.type==='LEARNING_WRITEBACK'?{exactProduction:true,metadata:{sourceRevision:'sha-live',sourceReceiptRef:'original:learning-readback',learningApplicationRef:'original:verified-learning-application'}}:{}) }));

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

test('active backfill creates one stable canonical resume for each registered obligation', () => {
  const report = reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['ob-1'],
    pullRequests:[{ number:10, headSha:'sha-partial', state:'open', claim:'MERGED' }],
    workflowRuns:[{ id:20, headSha:'sha-partial', name:'BRAIN delivery', conclusion:'failure' }],
    obligations:[{ id:'ob-1', identity:'sha-partial', status:'AWAITING_OUTCOME', materialObligations:[{id:'prod',status:'OPEN'}] }]
  });

  const fingerprint = createHash('sha256').update('canonical-obligation:ob-1').digest('hex').slice(0, 20);
  const sourceDigest = createHash('sha256').update(JSON.stringify(['sha-partial'])).digest('hex');
  assert.equal(report.mode, 'active');
  assert.equal(report.productionMutation, false);
  assert.equal(report.durableResumeEnabled, true);
  assert.deepEqual(report.dispatches, [{
    obligationId:'ob-1',
    identity:'canonical-obligation:ob-1',
    coalesceKey:'completion-backfill|obligation|' + fingerprint,
    triggerFingerprint:'completion-backfill:' + fingerprint,
    nextAction:report.candidates[0].nextAction,
    sourceCandidateCount:1,
    sourceIdentityDigest:sourceDigest
  }]);
});

test('backfill coalesces 1201 historical source identities without dropping any or spawning duplicate agent work', () => {
  const historical = Array.from({ length:1201 }, (_, index) => ({
    id:'material-change-live-verification',
    identity:'historical:' + String(index).padStart(4, '0'),
    status:'PENDING'
  }));
  const params = {
    mode:'active',
    registeredObligationIds:['material-change-live-verification','supabase-performance-evidence-daily'],
    obligations:[...historical, { id:'supabase-performance-evidence-daily', identity:'other', status:'PENDING' }]
  };
  const report = reconcileCompletionBackfill(params);
  assert.equal(report.candidateCount, 1202);
  assert.equal(report.candidates.length, 1202);
  assert.equal(report.dispatches.length, 2);
  const grouped = report.dispatches.find(x => x.obligationId === 'material-change-live-verification');
  assert.equal(grouped.sourceCandidateCount, 1201);
  assert.ok(grouped.sourceIdentityDigest.match(/^[a-f0-9]{64}$/));
  assert.equal(report.candidates.filter(x => x.obligationIds.includes('material-change-live-verification')).length, 1201);
  const reordered = reconcileCompletionBackfill({ ...params, obligations:[...params.obligations].reverse() });
  assert.deepEqual(report.dispatches, reordered.dispatches);
  // Re-running this exact original obligation must have the same durable CAS identity.
  const later = reconcileCompletionBackfill({ ...params, obligations:[...params.obligations, { id:'material-change-live-verification', identity:'later-observation', status:'PENDING' }] });
  const next = later.dispatches.find(x => x.obligationId === 'material-change-live-verification');
  assert.equal(next.coalesceKey, grouped.coalesceKey);
  assert.equal(next.triggerFingerprint, grouped.triggerFingerprint);
  assert.equal(next.sourceCandidateCount, 1202);
  assert.notEqual(next.sourceIdentityDigest, grouped.sourceIdentityDigest);
  assert.equal(later.candidateCount, 1203);
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
  assert.equal(report.dispatches[0].identity, 'canonical-obligation:ob-1');
  assert.equal(report.dispatches[0].sourceCandidateCount, 1);
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

test('any independently proven hard boundary vetoes the entire owner group, not just its own historical source',()=>{
  const original={id:'ob-1',identity:'unblocked-history',status:'PENDING'};
  const blocked={id:'ob-1',identity:'protected-history',status:'BLOCKED_HARD_BOUNDARY',
    hardBoundary:{
      present:true,proven:true,evidence:'provider scope not authorized',
      recovery_packet:{
        blocker:'missing provider authorization',
        root_cause:'authorization not granted',
        evidence_refs:['provider:scope-denied'],
        attempted_repairs:['verified required connector scope'],
        safe_remaining_actions:['read back after legitimate consent'],
        minimum_human_action:'grant provider permission',
        fix_agent_handoff:'agent-reliability',
        boundary_fingerprint:'provider-scope-denied-v1',
        resume_when:{signal:'provider_scope_authorized'}
      }
    }};
  for (const sources of [[original,blocked],[blocked,original]]) {
    const result=reconcileCompletionBackfill({
      mode:'active',
      registeredObligationIds:['ob-1'],
      obligations:sources
    });
    assert.equal(result.candidateCount,2);
    assert.equal(result.candidates.length,2,'no historical source loses audit lineage');
    assert.ok(result.candidates.some(c=>c.identity==='protected-history'&&c.nextAction==='WAIT_EXTERNAL'));
    assert.ok(result.candidates.some(c=>c.identity==='unblocked-history'));
    assert.equal(result.dispatches.length,0,'another source cannot bypass an original provider hard boundary');
  }
});

test('a hard boundary cannot disappear when two observations share the same original identity', () => {
  const pending={ id:'ob-1', identity:'same-source-revision', status:'PENDING' };
  const blocked={ id:'ob-1', identity:'same-source-revision', status:'BLOCKED_HARD_BOUNDARY',
    hardBoundary:{
      present:true, proven:true, evidence:'original provider readback denied this consent',
      recovery_packet:{
        blocker:'external consent required',
        root_cause:'provider has not authorized the original operation',
        evidence_refs:['provider:denied-consent'],
        attempted_repairs:['read current provider permissions'],
        safe_remaining_actions:['read back after legitimate reauthorization'],
        minimum_human_action:'authorize original provider scope',
        fix_agent_handoff:'agent-reliability',
        boundary_fingerprint:'provider-consent-denied-v1',
        resume_when:{ signal:'provider_scope_authorized' }
      }
    }
  };
  for(const observations of [[pending,blocked],[blocked,pending]]) {
    const report=reconcileCompletionBackfill({
      mode:'active',
      registeredObligationIds:['ob-1'],
      obligations:observations,
    });
    assert.equal(report.candidateCount,1,'same source identity must be grouped');
    assert.equal(report.candidates[0].sourceIds.length,2,'both original observations remain in audit');
    assert.equal(report.candidates[0].nextAction,'WAIT_EXTERNAL');
    assert.equal(report.candidates[0].normalizedState,'WAIT_EXTERNAL');
    assert.equal(report.dispatches.length,0,'no new wake may bypass any original proven boundary');
  }
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

test('backfill selects the original trigger: daily work is scheduled, event work is event-only, prewrite is deferred',()=>{
  assert.equal(selectOriginalBackfillTrigger({
    id:'cost-policy-10000-monthly',dueAt:'continuous_with_daily_recalculation'
  }),'scheduled-sweep');
  assert.equal(selectOriginalBackfillTrigger({
    id:'cost-ledger-all-scenarios-daily',dueAt:'daily_after_inventory_refresh'
  }),'event-trigger');
  assert.equal(selectOriginalBackfillTrigger({
    id:'material-change-live-verification',dueAt:'after_each_material_production_change'
  }),'event-trigger');
  assert.equal(selectOriginalBackfillTrigger({
    id:'external-mutation-prewrite-obligation',dueAt:'before_each_material_external_mutation'
  }),null);
});

test('original 3705-source fanout report remains auditable while genuinely non-due prewrite work is deferred',()=>{
  const input=reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['cost-policy-10000-monthly','cost-ledger-all-scenarios-daily','external-mutation-prewrite-obligation'],
    obligations:[
      {id:'cost-policy-10000-monthly',identity:'cost-source',status:'PENDING'},
      {id:'cost-ledger-all-scenarios-daily',identity:'ledger-source',status:'PENDING'},
      {id:'external-mutation-prewrite-obligation',identity:'prewrite-source',status:'PENDING'}
    ]
  });
  assert.equal(input.candidateCount,3);
  const applied=applyOriginalBackfillDuePolicy(input,[
    {id:'cost-policy-10000-monthly',dueAt:'continuous_with_daily_recalculation'},
    {id:'cost-ledger-all-scenarios-daily',dueAt:'daily_after_inventory_refresh'},
    {id:'external-mutation-prewrite-obligation',dueAt:'before_each_material_external_mutation'}
  ]);
  assert.equal(applied.candidateCount,3,'every original source still has its own full audit lineage');
  assert.equal(applied.candidates.length,3);
  assert.deepEqual(applied.dispatches.map(d=>[d.obligationId,d.triggerType]),[
    ['cost-ledger-all-scenarios-daily','event-trigger'],
    ['cost-policy-10000-monthly','scheduled-sweep']
  ]);
  assert.equal(applied.deferredNotDue.length,1);
  assert.equal(applied.deferredNotDue[0].obligationId,'external-mutation-prewrite-obligation');
  assert.equal(applied.deferredNotDue[0].reason,'NO_ORIGINAL_DUE_TRIGGER_FOR_BACKFILL');
  assert.equal(applied.deferredNotDue[0].nextSafeAction,'WAIT_FOR_ORIGINAL_SOURCE_TRIGGER');
  assert.equal(applied.deferredNotDue[0].sourceCandidateCount,1);
  assert.ok(!applied.dispatches.some(d=>d.obligationId==='external-mutation-prewrite-obligation'));
  assert.equal(input.dispatches.length,3,'original raw source reconciliation report is not mutated');
});

test('backfill rejects an unknown registered original obligation instead of silently dropping owner work',()=>{
  const input=reconcileCompletionBackfill({
    mode:'active',registeredObligationIds:['original-owner'],
    obligations:[{id:'original-owner',identity:'origin',status:'PENDING'}]
  });
  assert.throws(()=>applyOriginalBackfillDuePolicy(input,[]),/original registered obligation missing/);
});

test('original backfill persists truthful partial progress before unsafe retry or interrupted run', () => {
  const report = reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['original-obligation'],
    obligations:[{id:'original-obligation',identity:'source-history-1',status:'PENDING'}]
  });
  assert.equal(report.dispatches.length,1);
  const inFlight = checkpointCompletionBackfill(report,[],'IN_PROGRESS','2026-11-15T10:45:00Z');
  assert.equal(inFlight.resumeCheckpoint.state,'IN_PROGRESS');
  assert.equal(inFlight.resumeCheckpoint.sourceCandidates,1);
  assert.equal(inFlight.resumeCheckpoint.expectedDispatches,1);
  assert.equal(inFlight.resumeCheckpoint.completedDispatches,0);
  assert.equal(inFlight.resumeCheckpoint.remainingDispatches,1);
  assert.equal(inFlight.resumeCheckpoint.consumerCompletionProven,false);
  assert.equal(inFlight.resumeCheckpoint.businessOutcomeProven,false);
  assert.equal(inFlight.productionMutation,false);
  assert.throws(()=>checkpointCompletionBackfill(report,[],'COMPLETE'),/incomplete/);
  const completedResume={dispatch:report.dispatches[0],output:'.artifacts/original-resume-001.json',artifact:{kind:'ORIGINAL_IDEMPOTENT_RESUME'}};
  const afterOne=checkpointCompletionBackfill(report,[completedResume],'IN_PROGRESS');
  assert.equal(afterOne.resumeCheckpoint.remainingDispatches,0);
  assert.equal(afterOne.resumeCheckpoint.state,'IN_PROGRESS');
  const done=checkpointCompletionBackfill(report,[completedResume],'COMPLETE');
  assert.equal(done.resumeCheckpoint.state,'COMPLETE');
  assert.equal(done.resumeCheckpoint.consumerCompletionProven,false);
  assert.equal(done.resumeResults.length,1);
  assert.equal(done.dispatches[0].coalesceKey,report.dispatches[0].coalesceKey);
});

test('progress checkpoint fails closed on duplicated wakeups, switched owner or partial completion',()=>{
  const report=reconcileCompletionBackfill({
    mode:'active',
    registeredObligationIds:['original-obligation'],
    obligations:[{id:'original-obligation',identity:'source-history-1',status:'PENDING'}]
  });
  const original=report.dispatches[0];
  assert.throws(()=>checkpointCompletionBackfill({...report,dispatches:[original,original]},[]),/one wakeup/);
  assert.throws(()=>checkpointCompletionBackfill(report,[{dispatch:{...original,coalesceKey:'wrong'},output:'x.json'}]),/exact ordered/);
  assert.throws(()=>checkpointCompletionBackfill(report,[{dispatch:original,output:''}]),/exact ordered/);
  assert.throws(()=>checkpointCompletionBackfill(report,[{dispatch:original,output:'a.json'},{dispatch:original,output:'b.json'}]),/more results/);
  assert.throws(()=>checkpointCompletionBackfill(report,[],'LIVE_VERIFIED'),/unsupported/);
});

test('a failed original backfill still attempts to upload its last durable checkpoint',()=>{
  const workflow = fs.readFileSync('.github/workflows/completion-supervisor-backfill-shadow.yml','utf8');
  assert.match(workflow,/name: Upload immutable reconciliation and resume evidence\n\s+if: always\(\)/);
  assert.match(workflow,/if-no-files-found: error/);
  assert.match(workflow,/node tools\/outcome-obligation-completion-supervisor-backfill\.mjs --collect --mode active/);
});
