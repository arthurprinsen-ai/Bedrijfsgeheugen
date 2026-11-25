import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyError,reconcile} from '../tools/delivery/branch-reconciler.mjs';
const repo='owner/repo';
const mk=(sha, labels=[{name:'autonomous-sync'}])=>({number:5,state:'open',draft:false,head:{sha,repo:{full_name:repo}},base:{sha:'base'},labels});
test('classifies provider errors',()=>{
  assert.equal(classifyError({status:409}),'MERGE_CONFLICT_OR_CONCURRENT_UPDATE');
  assert.equal(classifyError({status:422}),'STALE_SHA_OR_UNPROCESSABLE');
  assert.equal(classifyError({status:403}),'PERMISSION_OR_RULESET');
});
test('skips branches without enrollment',async()=>{
  const github={paginate:async()=>[mk('old',[])],rest:{pulls:{list(){}}}};
  assert.deepEqual((await reconcile({github,owner:'owner',repo:'repo'})).skipped,[5]);
});
test('requires independent post-update zero-behind readback',async()=>{
  let read=0, calls=0;
  const github={paginate:async()=>[mk('old')],rest:{pulls:{list(){},get:async()=>({data:mk(read++?'new':'old')})},repos:{compareCommits:async()=>({data:{ahead_by:calls++===0?2:0}})}},request:async()=>({status:202})};
  const r=await reconcile({github,owner:'owner',repo:'repo',wait:async()=>{}});
  assert.equal(r.updated.length,1);
  assert.equal(r.updated[0].newHead,'new');
});
test('does not falsely mark accepted-but-unverified request green',async()=>{
  const github={paginate:async()=>[mk('old')],rest:{pulls:{list(){},get:async()=>({data:mk('old')})},repos:{compareCommits:async()=>({data:{ahead_by:2}})}},request:async()=>({status:202})};
  const r=await reconcile({github,owner:'owner',repo:'repo',wait:async()=>{},maxPolls:2});
  assert.equal(r.updated.length,0); assert.equal(r.pending.length,1);
});
