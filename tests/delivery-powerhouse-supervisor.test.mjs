import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessQueuePressure,partitionVerifiedProviderGhostQueue,classifyRecovery,criticalWorkflowCoverage,latestCriticalWorkflowRuns,planConcurrentAgentWork,classifyDeliveryImpact} from '../tools/delivery/predictive-controller.mjs';

test('zero-run head becomes recoverable after first-signal SLO',()=>{
  const r=classifyRecovery({workflowRuns:[],headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:02:00Z')});
  assert.equal(r.state,'ZERO_RUN_RECOVERY');
});

test('open-PR recovery is complete when Required is active even if BRAIN is absent',()=>{
  const runs=[{name:'Required test',status:'in_progress',updated_at:'2026-09-18T08:01:50Z'}];
  assert.deepEqual(criticalWorkflowCoverage(runs).missing,[]);
  assert.equal(criticalWorkflowCoverage(runs).complete,true);
  assert.equal(classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:02:00Z')}).state,'HEALTHY_PROGRESS');
});


test('completed green Required on a behind-main head becomes same-lineage main-drift recovery',()=>{
  const runs=[{name:'Required test',status:'completed',conclusion:'success',updated_at:'2026-10-06T15:40:00Z'}];
  const r=classifyRecovery({mergeable:true,behindBy:1,workflowRuns:runs,headUpdatedAt:'2026-10-06T15:39:00Z',now:Date.parse('2026-10-06T15:40:10Z')});
  assert.equal(r.state,'MAIN_DRIFT_RECOVERY');
  assert.equal(r.action,'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN');
  assert.equal(r.behindBy,1);
});

test('cancelled Required on a behind-main head is main-drift recovery, not a failed-gate dead end',()=>{
  const runs=[{name:'Required test',status:'completed',conclusion:'cancelled',updated_at:'2026-10-06T16:00:00Z'}];
  const r=classifyRecovery({mergeable:true,behindBy:2,workflowRuns:runs,headUpdatedAt:'2026-10-06T15:59:00Z',now:Date.parse('2026-10-06T16:00:10Z')});
  assert.equal(r.state,'MAIN_DRIFT_RECOVERY');
  assert.equal(r.action,'KEEP_SAME_LINEAGE_AND_REFRESH_FROM_MAIN');
  assert.equal(r.behindBy,2);
  assert.equal(r.recoveryCause,'CANCELLED_REQUIRED_ON_STALE_MAIN');
});

test('real Required failure stays fail-closed even when main has moved',()=>{
  const runs=[{name:'Required test',status:'completed',conclusion:'failure',updated_at:'2026-10-06T16:00:00Z'}];
  const r=classifyRecovery({mergeable:true,behindBy:2,workflowRuns:runs,headUpdatedAt:'2026-10-06T15:59:00Z',now:Date.parse('2026-10-06T16:00:10Z')});
  assert.equal(r.state,'FAILED_GATE_RECOVERY');
  assert.match(r.action,/READ_FIRST_CURRENT_FAILURE/);
});

test('behind-main never refreshes while canonical Required is still active',()=>{
  const runs=[{name:'Required test',status:'in_progress',updated_at:'2026-10-06T15:40:00Z'}];
  const r=classifyRecovery({mergeable:true,behindBy:1,workflowRuns:runs,headUpdatedAt:'2026-10-06T15:39:00Z',now:Date.parse('2026-10-06T15:40:10Z')});
  assert.equal(r.state,'HEALTHY_PROGRESS');
});

test('stale queued exact-head work is recoverable from run progress timestamps',()=>{
  const runs=[
    {id:11,name:'Required test',status:'queued',updated_at:'2026-09-18T08:00:00Z'},
    {id:12,name:'BRAIN delivery PR #1 abc',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'STALE_QUEUE_RECOVERY');
  assert.deepEqual(r.staleRunIds,[11]);
});

test('healthy current-head in-progress work is never killed merely because the PR head is old',()=>{
  const runs=[
    {id:21,name:'Required test',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'},
    {id:22,name:'BRAIN delivery PR #1 abc',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T06:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'HEALTHY_PROGRESS');
});

test('long-running current-head work is observed, not automatically cancelled',()=>{
  const runs=[
    {id:31,name:'Required test',status:'in_progress',updated_at:'2026-09-18T07:30:00Z'},
    {id:32,name:'BRAIN delivery PR #1 abc',status:'completed',conclusion:'success',updated_at:'2026-09-18T07:35:00Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'LONG_RUNNING_OBSERVE');
  assert.match(r.action,/DO_NOT_CANCEL/);
});

test('failed gate is not auto-hidden or bypassed',()=>{
  const runs=[{name:'Required test',status:'completed',conclusion:'failure'},{name:'BRAIN delivery PR #1 abc',status:'completed',conclusion:'success'}];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:00:10Z')});
  assert.equal(r.state,'FAILED_GATE_RECOVERY');
  assert.match(r.action,/READ_FIRST_CURRENT_FAILURE/);
});

test('supervisor recovers Required without auto-dispatching duplicate BRAIN work',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/workflow run required-test\.yml/);
  assert.doesNotMatch(yaml,/workflow run unified-brain-delivery\.yml/);
  assert.match(yaml,/STALE_QUEUE_RECOVERY/);
  assert.match(yaml,/staleRunIds/);
  assert.match(yaml,/LONG_RUNNING_OBSERVE/);
  assert.doesNotMatch(yaml,/select\(\.status=="in_progress"/);
  assert.doesNotMatch(yaml,/gh pr merge|merge_pull_request|--admin/);
  assert.doesNotMatch(yaml,/lane-turbo|skip.*gate/i);
});


test('supervisor is bounded and cannot amplify an Actions queue storm',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.doesNotMatch(yaml,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(yaml,/workflow_dispatch:/);
  assert.match(yaml,/schedule:\s*\n\s*- cron: '2-57\/5 \* \* \* \*'/);
  assert.match(yaml,/ACTIVE_RUN_CIRCUIT_BREAKER: '12'/);
  assert.match(yaml,/ACTIONS_QUEUE_CIRCUIT_OPEN/);
  assert.match(yaml,/RECOVERY_PR_BUDGET: '1'/);
  assert.match(yaml,/RECOVERY_PR_BUDGET_EXHAUSTED/);
  assert.match(yaml,/active_for_pr/);
  assert.match(yaml,/duplicate dispatch suppressed/);
  assert.match(yaml,/pulls\?state=open|workflow run required-test\.yml/i);
  assert.doesNotMatch(yaml,/workflow run unified-brain-delivery\.yml/);
});


test('same-lineage moving-main recovery requires terminal lease, zero overlap and never merges the PR itself',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/contents:\s*write/);
  assert.ok(yaml.includes('MERGE_CONFLICT_RECOVERY|MAIN_DRIFT_RECOVERY'));
  assert.ok(yaml.includes('pull-requests: write'));
  assert.match(yaml,/behind_by/);
  assert.match(yaml,/merge_base/);
  assert.match(yaml,/path_overlap/);
  assert.match(yaml,/comm -12/);
  assert.match(yaml,/lease_state/);
  assert.match(yaml,/lease_owner/);
  assert.match(yaml,/lease_head/);
  assert.match(yaml,/lease_obligation/);
  assert.match(yaml,/\[ "\$lease_state" != "TERMINAL_DELIVERY" \]/);
  assert.match(yaml,/\[ "\$lease_head" != "\$head" \]/);
  assert.doesNotMatch(yaml,/Writer-Lease-Owner: powerhouse-terminal-delivery/);
  assert.match(yaml,/head_repo/);
  // Regression oracle now requires GitHub's native expected-head CAS, never unguarded merge.
  assert.match(yaml,/--method PUT "repos\/\$repo\/pulls\/\$number\/update-branch"/);
  assert.match(yaml,/expected_head_sha="\$head"/);
  assert.doesNotMatch(yaml,/--method POST "repos\/\$repo\/merges"/);
  assert.match(yaml,/main_proof/);
  assert.match(yaml,/head_proof/);
  assert.match(yaml,/Writer-Lease-Head/);
  assert.match(yaml,/Writer-Lease-Main-Epoch/);
  assert.match(yaml,/Base-SHA/);
  assert.match(yaml,/--method PATCH "repos\/\$repo\/pulls\/\$number"/);
  assert.doesNotMatch(yaml,/gh pr merge|merge_pull_request|--admin/);
});


test('newest critical attempt supersedes older cancelled history on the same exact head',()=>{
  const runs=[
    {id:40,name:'Required test',status:'completed',conclusion:'cancelled',updated_at:'2026-09-18T08:00:00Z'},
    {id:41,name:'Required test',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'},
    {id:42,name:'BRAIN delivery PR #2063 abc',status:'completed',conclusion:'cancelled',updated_at:'2026-09-18T08:00:10Z'},
    {id:43,name:'BRAIN delivery PR #2063 abc',status:'in_progress',updated_at:'2026-09-18T08:04:31Z'}
  ];
  const latest=latestCriticalWorkflowRuns(runs);
  assert.equal(latest.required.id,41);
  assert.equal(latest.brain.id,43);
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'HEALTHY_PROGRESS');
});

test('non-critical stale BRAIN queue does not trigger Required redispatch',()=>{
  const runs=[
    {id:51,name:'Required test',status:'completed',conclusion:'success',updated_at:'2026-09-18T08:04:00Z'},
    {id:52,name:'BRAIN delivery PR #2063 abc',status:'queued',updated_at:'2026-09-18T07:00:00Z'},
    {id:53,name:'Some expensive optional workflow',status:'queued',updated_at:'2026-09-18T07:00:00Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'HEALTHY_PROGRESS');
});


test('supervisor resumes recent merged obligations without terminal truth and deduplicates active closure runs',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/Recover merged obligations missing terminal closure/);
  assert.match(yaml,/pulls\?state=closed&base=main/);
  assert.match(yaml,/7 days ago/);
  assert.match(yaml,/Candidate-Type: \(implementation\|recovery\|security\|dependency\|docs\|promotion\)/);
  assert.match(yaml,/Terminal-State: LIVE_BEWEZEN/);
  assert.match(yaml,/display_title==\$title/);
  assert.match(yaml,/terminal closure already active; duplicate recovery dispatch suppressed/);
  assert.match(yaml,/workflow run obligation-terminal-closure\.yml --ref main -f pr_number=/);
});

test('supervisor force-cancels unresponsive obsolete runs and avoids jq broken-pipe budget exits',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/actions\/runs\/\$run_id\/force-cancel/);
  assert.match(yaml,/--method DELETE "repos\/\$repo\/actions\/runs\/\$run_id"/);
  assert.match(yaml,/done < <\(jq -c '\.\[\]' \/tmp\/open-prs\.json\)/);
  assert.doesNotMatch(yaml,/jq -c '\.\[\]' \/tmp\/open-prs\.json \| while read -r pr/);
});


test('total Actions pressure opens circuit before development queue becomes a storm',()=>{
  const current=assessQueuePressure({queued:11,inProgress:19});
  assert.equal(current.active,30);
  assert.equal(current.state,'CIRCUIT_OPEN');
  assert.equal(current.allowOptionalDispatch,false);
  const projected=assessQueuePressure({queued:4,inProgress:5,projectedNewRuns:4});
  assert.equal(projected.state,'PROJECTED_OVERLOAD');
});

test('supervisor deduplicates exact-head Required runs and never references an undefined BRAIN dispatcher',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  const required=fs.readFileSync('.github/workflows/required-test.yml','utf8');
  assert.match(required,/run-name: "Required test PR #/);
  assert.match(required,/inputs\.head_sha/);
  assert.match(yaml,/\.head_sha==\$head and \.event=="pull_request"/);
  assert.match(yaml,/contains\("PR #".*\$pr.*\$head\)/);
  assert.match(yaml,/exact-head Required test already active/);
  assert.doesNotMatch(yaml,/dispatch_brain/);
  assert.match(yaml,/if dispatch_required; then did_recover=1; fi/);
  assert.match(yaml,/if \[ "\$did_recover" -eq 1 \]/);
});

test('merged production truth is retried with bounded cooldown and no invented green state',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/7 days ago/);
  assert.match(yaml,/prior_count.*-ge 3/);
  assert.match(yaml,/now_epoch - last_epoch.*-lt 5400/);
  assert.match(yaml,/deterministic failure requires targeted repair/);
  assert.match(yaml,/terminal closure already active/);
  assert.doesNotMatch(yaml,/Terminal-State: LIVE_BEWEZEN.*echo.*LIVE_BEWEZEN/);
  assert.match(yaml,/workflow run obligation-terminal-closure\.yml --ref main -f pr_number=/);
});


test('four exact GitHub provider ghosts do not consume a real CI slot, but remain raw and incident-red',()=>{
  const now=Date.parse('2026-10-22T16:00:00Z');
  const runs=[...Array.from({length:4},(_,i)=>({
    id:37642383514+i,status:'queued',conclusion:null,head_branch:'old-pr',
    head_sha:'obsolete-'+i,created_at:'2026-10-07T15:09:03Z',updated_at:'2026-10-07T15:09:03Z'
  })),{id:999,name:'Required test',status:'queued',conclusion:null,head_branch:'current-pr',
    head_sha:'current-sha',created_at:'2026-10-22T15:59:00Z',updated_at:'2026-10-22T15:59:00Z'}];
  const proofs=runs.slice(0,4).map(run=>({
    incident:4655,runId:run.id,providerBoundary:'GITHUB_CANONICAL_PROVIDER_BLOCKED',
    jobsTotalCount:0,runStatus:'queued',runHeadSha:run.head_sha,
    runCreatedAt:run.created_at,runUpdatedAt:run.updated_at,
    readbackAt:'2026-10-22T15:59:20Z'
  }));
  const evidence={queuedRuns:runs,runProofs:proofs,currentMainSha:'main-sha',
    openPrHeadShas:['current-sha'],snapshotComplete:true,rawTotalCount:5,now};
  const split=partitionVerifiedProviderGhostQueue(evidence);
  assert.equal(split.rawQueued,5);
  assert.equal(split.verifiedProviderGhostQueued,4);
  assert.equal(split.actionableQueued,1);
  assert.equal(split.providerIncidentStillOpen,true);
  const pressure=assessQueuePressure({queued:5,queueEvidence:evidence});
  assert.equal(pressure.counts.queued,1);
  assert.equal(pressure.counts.rawQueued,5);
  assert.equal(pressure.counts.verifiedProviderGhostQueued,4);
  assert.equal(pressure.providerGhostIncidentOpen,true);
  assert.equal(pressure.state,'HEALTHY');
  assert.equal(assessQueuePressure({queued:5,queueEvidence:{...evidence,runProofs:[]}}).state,'PRESSURE_HIGH');
  assert.equal(assessQueuePressure({queued:6,queueEvidence:evidence}).counts.queued,6);
});

test('ghost discount fails closed for altered, job-bearing, current-head, stale-proof or partial snapshots',()=>{
  const now=Date.parse('2026-10-22T16:00:00Z');
  const run={id:1,status:'queued',conclusion:null,head_branch:'old',head_sha:'old-sha',
    created_at:'2026-10-07T15:09:03Z',updated_at:'2026-10-07T15:09:03Z'};
  const proof={incident:4655,runId:1,providerBoundary:'GITHUB_CANONICAL_PROVIDER_BLOCKED',
    jobsTotalCount:0,runStatus:'queued',runHeadSha:'old-sha',runCreatedAt:run.created_at,
    runUpdatedAt:run.updated_at,readbackAt:'2026-10-22T15:59:20Z'};
  const base={queuedRuns:[run],runProofs:[proof],snapshotComplete:true,rawTotalCount:1,
    currentMainSha:'main',openPrHeadShas:[],now};
  const checked=x=>partitionVerifiedProviderGhostQueue(x).verifiedProviderGhostQueued;
  assert.equal(checked(base),1);
  assert.equal(checked({...base,runProofs:[]}),0);
  assert.equal(checked({...base,runProofs:[{...proof,providerBoundary:'UNVERIFIED'}]}),0);
  assert.equal(checked({...base,runProofs:[{...proof,jobsTotalCount:1}]}),0);
  assert.equal(checked({...base,runProofs:[{...proof,readbackAt:'2026-10-21T15:59:20Z'}]}),0);
  assert.equal(checked({...base,currentMainSha:'old-sha'}),0);
  assert.equal(checked({...base,openPrHeadShas:['old-sha']}),0);
  assert.equal(checked({...base,queuedRuns:[{...run,status:'in_progress'}]}),0);
  assert.equal(checked({...base,queuedRuns:[{...run,updated_at:'2026-10-08T15:09:03Z'}]}),0);
  assert.equal(checked({...base,snapshotComplete:false}),0);
  assert.equal(checked({...base,rawTotalCount:3}),0);
});

test('existing hourly Janitor exports both raw and actionable queue under canonical incident',()=>{
  const js=fs.readFileSync('.github/scripts/github-actions-ghost-reconcile.mjs','utf8');
  assert.match(js,/assessQueuePressure/);
  assert.match(js,/verifiedProviderGhostQueued/);
  assert.match(js,/collectionMissingKnownProviderIds/);
  assert.match(js,/providerIncidentStillOpen: reports\.length > 0/);
  assert.match(js,/GHOST_RUN_PROVIDER_BLOCKED/);
});


test('duplicate provider ID cannot be discounted twice and blocks optional fan-out',()=>{
  const now=Date.parse('2026-10-22T16:00:00Z');
  const row={id:37642383514,name:'Portal V2 Live Preview',status:'queued',conclusion:null,
    head_branch:'old',head_sha:'old-sha',created_at:'2026-10-07T15:09:03Z',
    updated_at:'2026-10-07T15:09:03Z'};
  const proof={incident:4655,runId:row.id,providerBoundary:'GITHUB_CANONICAL_PROVIDER_BLOCKED',
    jobsTotalCount:0,runStatus:'queued',runHeadSha:row.head_sha,
    runCreatedAt:row.created_at,runUpdatedAt:row.updated_at,
    readbackAt:'2026-10-22T15:59:30Z'};
  const queueEvidence={queuedRuns:[row,row],runProofs:[proof],currentMainSha:'main',
    snapshotComplete:true,rawTotalCount:2,providerIncidentOpen:true,
    knownUnresolvedQueuedIds:[row.id],now};
  const p=assessQueuePressure({queued:2,queueEvidence});
  assert.equal(p.state,'PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT');
  assert.equal(p.allowOptionalDispatch,false);
  assert.equal(p.counts.queued,2);
  assert.equal(p.counts.verifiedProviderGhostQueued,0);
  assert.equal(p.providerGhostIncidentOpen,true);
  assert.equal(partitionVerifiedProviderGhostQueue({...queueEvidence,queuedRuns:[row],rawTotalCount:1,
    runProofs:[proof,proof]}).verifiedProviderGhostQueued,0);
});

test('response total mismatch and omitted exact-ID ghosts block falsely healthy pressure',()=>{
  const now=Date.parse('2026-10-22T16:00:00Z');
  const row={id:37642383514,name:'Required test',status:'queued',conclusion:null,
    head_branch:'old',head_sha:'old',created_at:'2026-10-07T15:09:03Z',
    updated_at:'2026-10-07T15:09:03Z'};
  const proof={incident:4655,runId:row.id,providerBoundary:'GITHUB_CANONICAL_PROVIDER_BLOCKED',
    jobsTotalCount:0,runStatus:'queued',runHeadSha:'old',runCreatedAt:row.created_at,
    runUpdatedAt:row.updated_at,readbackAt:'2026-10-22T15:59:30Z'};
  const common={runProofs:[proof],currentMainSha:'main',snapshotComplete:true,
    knownUnresolvedQueuedIds:[row.id],providerIncidentOpen:true,now};
  const mismatch=assessQueuePressure({queued:6,queueEvidence:{
    ...common,queuedRuns:[row],rawTotalCount:6
  }});
  assert.equal(mismatch.state,'PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT');
  assert.equal(mismatch.counts.queued,6);
  assert.equal(mismatch.allowOptionalDispatch,false);
  const missing=assessQueuePressure({queued:0,queueEvidence:{
    ...common,queuedRuns:[],rawTotalCount:0
  }});
  assert.equal(missing.state,'PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT');
  assert.equal(missing.allowOptionalDispatch,false);
  assert.equal(missing.providerGhostIncidentOpen,true);
  const good=assessQueuePressure({queued:1,queueEvidence:{
    ...common,queuedRuns:[row],rawTotalCount:1
  }});
  assert.equal(good.state,'HEALTHY');
  assert.equal(good.counts.verifiedProviderGhostQueued,1);
  assert.equal(good.providerGhostIncidentOpen,true);
  const plan=planConcurrentAgentWork({obligationId:'o',currentHead:'a',
    currentMain:'b',queue:{queued:0,queueEvidence:{
      ...common,queuedRuns:[],rawTotalCount:0
    }}});
  assert.equal(plan.canMutateCandidate,false);
});

test('cross-lane early preflight: CMS implies website, without skipping protected checks',()=>{
  const r=classifyDeliveryImpact(['cms/story.md']);
  assert.deepEqual(r.lanes,['website','cms']);
  assert.deepEqual(r.crossLaneContracts,['cms-to-website']);
  assert.equal(r.maySkipProtectedChecks,false);
  assert.deepEqual(r.mandatoryProtectedChecks,['hygiene / admission','test','CodeQL javascript-typescript']);
});
test('cross-lane early preflight: shared Brain contracts propagate to consumers',()=>{
  const r=classifyDeliveryImpact(['brain/contracts/identity.json','brain/contracts/identity.json']);
  assert.deepEqual(r.lanes,['portal','one-brain','powerhouse','heartbeat']);
  assert.deepEqual(r.crossLaneContracts,['brain-contract-to-consumers']);
});
test('cross-lane early preflight: Supabase migration propagates, website can stay narrow',()=>{
  assert.deepEqual(classifyDeliveryImpact(['supabase/migrations/20261023_identity.sql']).lanes,
    ['backend-supabase','portal','one-brain','heartbeat']);
  assert.deepEqual(classifyDeliveryImpact(['src/home.tsx']).lanes,['website']);
});
test('cross-lane early preflight: unknown paths and traversal force broad coverage',()=>{
  for(const paths of [[],['package.json'],['../secret'],['/absolute']]){
    const r=classifyDeliveryImpact(paths);
    assert.equal(r.preflightMode,'FULL_CROSS_LANE_PREFLIGHT');
    assert.deepEqual(r.lanes,['website','backend-supabase','portal','cms','one-brain','powerhouse','heartbeat']);
    assert.equal(r.maySkipProtectedChecks,false);
  }
});
test('cross-lane impact remains available for queue-held agent work',()=>{
  assert.deepEqual(planConcurrentAgentWork({changedPaths:['src/home.tsx']}).deliveryImpact.lanes,['website']);
  const held=planConcurrentAgentWork({changedPaths:['cms/story.md'],queue:{queued:20}});
  assert.equal(held.state,'BATCH_BEFORE_MUTATION');
  assert.deepEqual(held.deliveryImpact.lanes,['website','cms']);
});


test('native drift sync uses expected-head CAS and bounded attempts',()=>{
 const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.match(y,/MAX_MAIN_DRIFT_REFRESHES: '2'/);
 assert.match(y,/expected_head_sha="\$head"/);
 assert.doesNotMatch(y,/--method POST "repos\/\$repo\/merges"/);
 assert.match(y,/MAIN_DRIFT_UPDATE_UNVERIFIED/);
 assert.match(y,/MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED/);
});

test('accepted asynchronous native drift updates reconcile by immutable ancestry',()=>{
 const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.match(y,/MAIN_DRIFT_SYNC_RECONCILED/);
 assert.match(y,/MAIN_DRIFT_SYNC_TIMED_OUT/);
 assert.match(y,/MAIN_DRIFT_SYNC_RACE/);
 assert.match(y,/compare\/\$old_head\.\.\.\$head/);
 assert.match(y,/new exact-head Required and CodeQL still mandatory/);
});

test('supervisor schedule keeps one off-hour five-minute owner and strict CAS',()=>{
 const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.equal((yaml.match(/^\s+- cron:/gm)||[]).length,1);
 assert.match(yaml,/2-57\/5 \* \* \* \*/);
 assert.doesNotMatch(yaml,/cron:\s*'\*\/5 \* \* \* \*'/);
 assert.equal((yaml.match(/^name: Powerhouse Delivery Recovery Supervisor$/gm)||[]).length,1);
 assert.match(yaml,/cancel-in-progress: false/);
 assert.match(yaml,/expected_head_sha="\$head"/);
});
