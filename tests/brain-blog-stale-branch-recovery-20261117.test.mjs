import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eligibleStaleBlogPrs,branchRecoveryDecision,recoverOneStaleBlogBranch,canonicalBlogApprovalState} from '../tools/content-growth/reconcile-stale-blog-branch.mjs';
const repo='arthurprinsen-ai/Bedrijfsgeheugen';
const pr=(number,date,extras={})=>({
 number,state:'open',base:{ref:'main'},
 head:{ref:'automation/powerhouse-blog-'+date,sha:'a'.repeat(40),repo:{full_name:repo}},
 mergeable_state:'behind',...extras
});
test('only recent prior-day original GitHub branches are eligible; oldest first for fairness',()=>{
 const other=pr(4,'2026-11-16',{head:{ref:'other-blog',sha:'a'.repeat(40),repo:{full_name:repo}}});
 const foreign=pr(5,'2026-11-16',{head:{ref:'automation/powerhouse-blog-2026-11-16',sha:'a'.repeat(40),repo:{full_name:'other/repo'}}});
 const draft=pr(7,'2026-11-16',{draft:true});
 const candidates=eligibleStaleBlogPrs([pr(1,'2026-11-15'),pr(2,'2026-11-16'),pr(3,'2026-11-17'),other,foreign,draft,pr(6,'2026-11-01')],'2026-11-17',repo);
 assert.deepEqual(candidates.map(x=>x.number),[1,2]);
});
test('only exact same original PR behind main qualifies for native update',()=>{
 const item=pr(7,'2026-11-16');
 assert.equal(branchRecoveryDecision(item,item.head.ref,repo),'REQUEST_GITHUB_NATIVE_UPDATE');
 assert.equal(branchRecoveryDecision({...item,mergeable_state:'dirty'},item.head.ref,repo),'CONFLICT_OWNER_REVIEW');
 assert.equal(branchRecoveryDecision({...item,mergeable_state:'clean'},item.head.ref,repo),'PROTECTED_GATES_OWN_NEXT_STEP');
 assert.equal(branchRecoveryDecision({...item,mergeable_state:'blocked'},item.head.ref,repo),'PROTECTED_GATES_OWN_NEXT_STEP');
 assert.equal(branchRecoveryDecision(item,'automation/powerhouse-blog-2026-11-15',repo),'REJECT_IDENTITY_MISMATCH');
});
test('one provider-native compare-and-swap branch update per run, no bypass or publish',()=>{
 const item=pr(17,'2026-11-16'),writes=[];
 const result=recoverOneStaleBlogBranch({
  repo,today:'2026-11-17',
  fetchPage:path=>path.includes('/pulls/17')?item:path.includes('page=1')?[item]:[],
  verifyDue:date=>date==='2026-11-16',
  updateBranch:args=>writes.push(args)
 });
 assert.equal(result.action,'UPDATE_REQUESTED');
 assert.equal(writes.length,1);
 assert.deepEqual(writes[0],[
  'api','-X','PUT','repos/'+repo+'/pulls/17/update-branch',
  '-f','expected_head_sha='+'a'.repeat(40)
 ]);
});
test('head drift cannot trigger a blind update',()=>{
 const original=pr(17,'2026-11-16'),moved=pr(17,'2026-11-16'),writes=[];
 moved.head.sha='b'.repeat(40);
 const result=recoverOneStaleBlogBranch({
  repo,today:'2026-11-17',
  fetchPage:path=>path.includes('/pulls/17')?moved:path.includes('page=1')?[original]:[],
  verifyDue:date=>date==='2026-11-16',
  updateBranch:args=>writes.push(args)
 });
 assert.equal(result.action,'NO_SAFE_UPDATE');
 assert.equal(writes.length,0);
});
test('same original hourly publisher and immutable public-proof stage remain',()=>{
 const yml=readFileSync(new URL('../.github/workflows/powerhouse-daily-blog.yml',import.meta.url),'utf8');
 assert.match(yml,/cron: '11 \* \* \* \*'/);
 assert.match(yml,/Reconcile merged daily blog only after production HTTP and immutable release proof/);
 assert.match(yml,/reconcile-stale-blog-branch\.mjs/);
 assert.doesNotMatch(yml,/continue-on-error: true/);
});

test('canonical source must be exactly APPROVED and not already published',()=>{
 const approved={status:'APPROVED',approved_at:'2026-11-16T09:00:00Z',published_at:null,live_proven_at:null,external_id:null};
 assert.equal(canonicalBlogApprovalState(approved),true);
 for(const variation of [{status:'GENERATED'},{approved_at:null},{published_at:'2026-11-16T10:00:00Z'},{live_proven_at:'2026-11-16T10:00:00Z'},{external_id:'external-provider-id'}]){
  assert.equal(canonicalBlogApprovalState({...approved,...variation}),false);
 }
});
test('unapproved and already live originals never update GitHub branches',()=>{
 const item=pr(18,'2026-11-16');
 const writes=[];
 const result=recoverOneStaleBlogBranch({
  repo,today:'2026-11-17',
  fetchPage:path=>path.includes('/pulls/18')?item:path.includes('page=1')?[item]:[],
  verifyDue:date=>false,
  updateBranch:args=>writes.push(args)
 });
 assert.equal(result.action,'NO_SAFE_UPDATE');
 assert.equal(writes.length,0);
});
