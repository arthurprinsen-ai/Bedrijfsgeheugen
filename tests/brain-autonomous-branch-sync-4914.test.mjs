import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcile} from '../tools/delivery/branch-reconciler.mjs';
const workflow=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
const oldHead='a'.repeat(40),newHead='b'.repeat(40),main='c'.repeat(40);
const pr=(changes={})=>({number:1,state:'open',draft:false,head:{sha:oldHead,repo:{full_name:'fixture/repo'}},base:{sha:main},labels:[{name:'autonomous-sync'}],...changes});
async function simulate(listed,{latest=listed[0],fresh=pr({head:{sha:newHead,repo:{full_name:'fixture/repo'}}}),error=null}={}){
  let gets=0,compares=0;const requests=[];
  const github={paginate:async()=>listed,rest:{pulls:{list(){},get:async()=>({data:gets++===0?latest:fresh})},repos:{compareCommits:async()=>({data:{ahead_by:compares++===0?1:0}})}},request:async(route,body)=>{requests.push({route,body});if(error)throw error;}};
  const report=await reconcile({github,owner:'fixture',repo:'repo',maxPolls:2,logger:{warn(){}}});
  return {report,requests};
}
test('existing hourly jobs serialize branch reconciliation before cleanup and System Map writes',()=>{
  assert.match(workflow,/cron: '17 \* \* \* \*'/);
  assert.match(workflow,/group: powerhouse-repository-janitor/);
  assert.match(workflow,/cancel-in-progress: false/);
  const janitor=workflow.split('  janitor:\n')[1].split('  branch_reconciler:\n')[0];
  const reconciler=workflow.split('  branch_reconciler:\n')[1];
  assert.match(janitor,/^    needs: branch_reconciler$/m);
  assert.ok(janitor.includes('if: $'+'{{ always() && !cancelled() }}'));
  assert.doesNotMatch(reconciler,/^    needs:/m);
  for(const job of [janitor,reconciler]){assert.match(job,/timeout-minutes: 15/);assert.match(job,/cache-mode: none/);}
  assert.equal((workflow.match(/tools\/delivery\/branch-reconciler\.mjs/g)||[]).length,1);
  assert.doesNotMatch(workflow,/Reconcile opted-in branches via native GitHub update-branch|git push .*--force/);
  const condition=janitor.split('Rebuild System Map only for synchronized opted-in recovery PR\n')[1].match(/^        if: (.+)$/m)?.[1];
  assert.ok(condition);
  const permits=new Function('needs','github','return '+condition);
  for(const event of ['schedule','workflow_dispatch'])for(const mode of ['apply-safe','dry-run','provider-ghost-only'])for(const result of ['success','failure','skipped','cancelled']){
    assert.equal(permits({branch_reconciler:{result}},{event_name:event,event:{inputs:{mode}}}),result==='success'&&(event==='schedule'||mode==='apply-safe'));
  }
});
test('canonical branch sync uses exact expected head and independent readback',async()=>{
  const {report,requests}=await simulate([pr()]);
  assert.equal(requests.length,1);
  assert.equal(requests[0].route,'PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch');
  assert.equal(requests[0].body.expected_head_sha,oldHead);
  assert.deepEqual(report.updated,[{pr:1,oldHead,newHead,base:main}]);
  assert.deepEqual(report.pending,[]);
});
test('drafts, forks and unenrolled or withdrawn owner enrollment cannot mutate branches',async()=>{
  for(const candidate of [pr({draft:true}),pr({head:{sha:oldHead,repo:{full_name:'other/repo'}}}),pr({labels:[]})]){
    const result=await simulate([candidate]);assert.equal(result.requests.length,0);assert.deepEqual(result.report.skipped,[1]);
  }
  const withdrawn=await simulate([pr()],{latest:pr({labels:[]})});
  assert.equal(withdrawn.requests.length,0);assert.deepEqual(withdrawn.report.skipped,[1]);
});
test('accepted update is pending until new head proves current main containment',async()=>{
  const pending=await simulate([pr()],{fresh:pr()});
  assert.equal(pending.report.updated.length,0);
  assert.deepEqual(pending.report.pending,[{pr:1,reason:'UPDATE_ACCEPTED_NOT_VERIFIED'}]);
  const conflict=await simulate([pr()],{error:Object.assign(new Error('stale expected head'),{status:422})});
  assert.equal(conflict.report.updated.length,0);assert.equal(conflict.report.blocked[0].reason,'STALE_SHA_OR_UNPROCESSABLE');
});
