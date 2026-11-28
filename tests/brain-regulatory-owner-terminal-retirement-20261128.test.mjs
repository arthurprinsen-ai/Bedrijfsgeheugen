import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planRegulatoryOwnerRetirement} from '../tools/delivery/regulatory-owner-terminal-retirement.mjs';
const obligation='regulatory-source-watch-45996045356',repo='owner/repo',head='a'.repeat(40),blob='b'.repeat(40),merge='c'.repeat(40),candidate='d'.repeat(40),main='e'.repeat(40);
const prBase={ref:'main',repo:{full_name:repo}};
const predecessor={number:6201,state:'open',merged:false,head:{sha:head,ref:'writer/regulatory-source-watch/45996045356',repo:{full_name:repo}},base:prBase,changed_files:1,body:['Obligation-ID: '+obligation,'Regulatory-Candidate-Type: source-observation','Writer-Lease-State: TERMINAL_DELIVERY','Writer-Lease-Head: '+head,'Writer-Lease-Obligation: '+obligation,'Writer-Lease-NonOwner-Action: DEFER','Writer-Lease-Owner: '+obligation,'Writer-Lease-Scope: data/regulatory-source-state.json','Writer-Lease-Release: MERGED_AND_PRODUCTION_READBACK_AND_LEARNING_WRITEBACK'].join('\n')};
const successor={number:6213,state:'closed',merged:true,merge_commit_sha:merge,head:{sha:candidate,repo:{full_name:repo}},base:prBase,body:['Obligation-ID: '+obligation,'Supersedes: 6201','Writer-Lease-State: RELEASED','Terminal-State: LIVE_BEWEZEN','Terminal-Main-SHA: '+merge,'Terminal-Production-Readback: descendant:'+merge+':deploy:6b09a6b09b728cd18580d33c','Terminal-Skill-Projection-Run: 46038507380'].join('\n')};
const run={id:456,path:'.github/workflows/obligation-terminal-closure.yml',event:'workflow_dispatch',head_branch:'main',head_sha:main,repository:{full_name:repo},display_title:'Obligation Terminal Closure PR #6213',status:'completed',conclusion:'success'};
const job={run_id:456,name:'close-obligation',conclusion:'success',steps:['Persist canonical Brain terminal evidence before terminal claim','Persist terminal evidence and release writer lease','Publish immutable terminal evidence'].map(name=>({name,conclusion:'success'}))};
const evidence={contract:'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1',terminal_state:'LIVE_BEWEZEN',obligation_id:obligation,candidate_head_sha:candidate,main_merge_sha:merge,skill_projection_required:true,skill_projection_run_id:46038507380,writer_lease_state:'RELEASED',outcome_evidence:true,verified:true,production_readback_mode:'descendant_live',production_observed_sha:merge,production_deploy_id:'6b09a6b09b728cd18580d33c'};
const fixture={predecessor,successor,files:[{filename:'data/regulatory-source-state.json',status:'modified',sha:blob}],originalBlob:blob,successorBlob:blob,currentBlob:blob,expectedHead:head,headRecheck:head,repo,run,job,evidence,mainSha:main,protectedRunAncestry:true,protectedMergeAncestry:true};
test('exact successor proof allows original owner retirement, not a merge',()=>{
 const x=planRegulatoryOwnerRetirement(fixture);
 assert.match(x.body,/Writer-Lease-State: RELEASED_SUPERSEDED/);
 assert.match(x.body,/Terminal-State: SUPERSEDED_BY_LIVE_BEWEZEN_SUCCESSOR/);
 assert.equal(x.receipt.writer_lease_released,false);
});
test('deny incomplete, stale, cross-repo, wrong owner, nonterminal, or unverified receipts',()=>{
 for(const x of [{expectedHead:main},{currentBlob:main},{protectedRunAncestry:false},{protectedMergeAncestry:false},{files:[]},{repo:'other/repo'},
  {predecessor:{...predecessor,body:predecessor.body.replace('Writer-Lease-Owner: '+obligation,'Writer-Lease-Owner: wrong')}},
  {run:{...run,conclusion:'failure'}},{run:{...run,display_title:'Obligation Terminal Closure PR #999'}},{job:{...job,steps:job.steps.slice(1)}},
  {evidence:{...evidence,verified:false}},{evidence:{...evidence,skill_projection_run_id:1}},{evidence:{...evidence,production_deploy_id:'mismatch000000'}},
  {successor:{...successor,body:successor.body.replace('LIVE_BEWEZEN','PENDING')}}])assert.throws(()=>planRegulatoryOwnerRetirement({...fixture,...x}),/UNPROVEN/);
});
test('existing source owner has mutually exclusive observation and retirement; no main mutation',()=>{
 const w=readFileSync('.github/workflows/regulatory-source-watch.yml','utf8');
 assert.match(w,/group: regulatory-source-watch/);
 assert.match(w,/inputs\.retire_predecessor == ''/);
 assert.match(w,/retire-terminal-predecessor:/);
 assert.match(w,/regulatory-owner-terminal-retirement\.mjs/);
 const s=readFileSync('tools/delivery/regulatory-owner-terminal-retirement.mjs','utf8');
 assert.match(s,/gh\('--method','PATCH'.*'state=closed'/);
 assert.match(s,/closed\.merged!==false/);
 assert.doesNotMatch(s,/git\('push'/);
});
