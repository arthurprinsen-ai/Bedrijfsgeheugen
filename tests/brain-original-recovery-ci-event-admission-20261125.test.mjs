import test from 'node:test';
import assert from 'node:assert/strict';
import {assessRecoveryEvent} from '../tools/delivery/recovery-ci-event-admission.mjs';
const fixture=()=>{
 const repo={id:1303700955},head={sha:'a'.repeat(40),ref:'fix/example',repo},base={ref:'main',repo};
 const assoc={number:27,head,base};
 const run={id:100,workflow_id:347590495,path:'.github/workflows/required-test.yml',run_attempt:1,head_sha:head.sha,head_branch:head.ref,event:'pull_request',status:'completed',conclusion:'success',updated_at:'2026-11-25T13:00:00Z',repository:repo,head_repository:repo,pull_requests:[assoc]};
 const clone=x=>JSON.parse(JSON.stringify(x));
 return {event:{action:'completed',repository:clone(repo),workflow_run:clone(run)},native:clone(run),pr:{number:27,state:'open',draft:false,head,base},now:'2026-11-25T13:03:00Z',seenKeys:[]};
};
const cases=[
["valid Required",()=>{},"READ_ONLY_RECONCILIATION_ELIGIBLE"],
["valid CodeQL",x=>{for(const r of [x.event.workflow_run,x.native]){r.workflow_id=359530627;r.path='.github/workflows/codeql.yml'}},"READ_ONLY_RECONCILIATION_ELIGIBLE"],
["terminal failure",x=>{x.event.workflow_run.conclusion=x.native.conclusion='failure'},"READ_ONLY_RECONCILIATION_ELIGIBLE"],
["foreign repository",x=>{x.event.repository.id=1},"UNTRUSTED_EVENT_CONTEXT"],
["unknown workflow",x=>{x.event.workflow_run.workflow_id=999},"UNRECOGNIZED_WORKFLOW"],
["wrong workflow path",x=>{x.native.path='.github/workflows/untrusted.yml'},"UNRECOGNIZED_WORKFLOW"],
["manual dispatch",x=>{x.event.workflow_run.event='workflow_dispatch'},"UNSUPPORTED_RUN_IDENTITY"],
["merge group",x=>{x.event.workflow_run.event='merge_group'},"UNSUPPORTED_RUN_IDENTITY"],
["fork",x=>{x.native.head_repository.id=1},"UNTRUSTED_NATIVE_RUN"],
["run not complete",x=>{x.native.status='in_progress'},"UNTRUSTED_NATIVE_RUN"],
["attempt mismatch",x=>{x.native.run_attempt=2},"NATIVE_READBACK_MISMATCH"],
["workflow ID mismatch",x=>{x.native.workflow_id=359530627},"NATIVE_READBACK_MISMATCH"],
["stale",x=>{x.now='2026-11-25T13:30:00Z'},"STALE_OR_INVALID_EVENT"],
["future",x=>{x.now='2026-11-25T12:59:00Z'},"STALE_OR_INVALID_EVENT"],
["ambiguous PR",x=>{x.native.pull_requests.push(x.native.pull_requests[0])},"AMBIGUOUS_PR_ASSOCIATION"],
["wrong associated PR",x=>{x.native.pull_requests[0].number=29},"PR_ASSOCIATION_MISMATCH"],
["moved head",x=>{x.pr.head.sha='b'.repeat(40)},"PR_HEAD_NOT_CURRENT_OR_NOT_ELIGIBLE"],
["draft",x=>{x.pr.draft=true},"PR_HEAD_NOT_CURRENT_OR_NOT_ELIGIBLE"],
["closed",x=>{x.pr.state='closed'},"PR_HEAD_NOT_CURRENT_OR_NOT_ELIGIBLE"],
["replay inventory missing",x=>{delete x.seenKeys},"REPLAY_INVENTORY_UNPROVEN"],
["replayed",x=>{x.seenKeys=[assessRecoveryEvent(x).eventKey]},"REPLAY_SUPPRESSED"]
];
for(const [name,mutate,expected] of cases)test(name,()=>{const x=fixture();mutate(x);const r=assessRecoveryEvent(x);assert.equal(r.state,expected);assert.equal(r.mutationAuthority,false);assert.equal(r.dispatchAuthorized,false);});
