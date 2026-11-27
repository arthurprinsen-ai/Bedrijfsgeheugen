import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyError,reconcile,genericSyncBlocker} from '../tools/delivery/branch-reconciler.mjs';
const repo='owner/repo';
const mk=(sha, labels=[{name:'autonomous-sync'}])=>({number:5,state:'open',draft:false,head:{sha,repo:{full_name:repo}},base:{sha:'base'},body:null,labels});
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
  const github={paginate:async()=>[mk('old')],rest:{pulls:{list(){},get:async()=>({data:mk(read++>=2?'new':'old')})},repos:{compareCommits:async()=>({data:{ahead_by:calls++===0?2:0}})}},request:async()=>({status:202})};
  const r=await reconcile({github,owner:'owner',repo:'repo',wait:async()=>{}});
  assert.equal(r.updated.length,1);
  assert.equal(r.updated[0].newHead,'new');
});
test('does not falsely mark accepted-but-unverified request green',async()=>{
  const github={paginate:async()=>[mk('old')],rest:{pulls:{list(){},get:async()=>({data:mk('old')})},repos:{compareCommits:async()=>({data:{ahead_by:2}})}},request:async()=>({status:202})};
  const r=await reconcile({github,owner:'owner',repo:'repo',wait:async()=>{},maxPolls:2});
  assert.equal(r.updated.length,0); assert.equal(r.pending.length,1);
});

test('historical #5934 terminal lease is refused even when enrolled',async()=>{
  const p={...mk('c35a7045c66da43ecf5b5ea21f68b3b096012540'),body:'Writer-Lease-State: TERMINAL_DELIVERY\nWriter-Lease-Head: 50fb0bffe7c59bbcf043ccdf61b81efc5d3f33ff\nWriter-Lease-NonOwner-Action: READ_ONLY'};
  let writes=0;
  const github={paginate:async()=>[p],rest:{pulls:{list(){},get:async()=>({data:p})}},request:async()=>{writes++;}};
  const r=await reconcile({github,owner:'owner',repo:'repo'});
  assert.equal(writes,0);assert.equal(r.blocked[0].reason,'OWNER_LEASE_SUPERVISOR_REQUIRED');
});
test('all lease states, partial metadata and retirement are delegated',()=>{
  for(const body of ['Writer-Lease-State: MAIN_SYNC','Writer-Lease-State: SOURCE_CANDIDATE','writer-lease-owner: original','  Writer-Lease-NonOwner-Action: READ_ONLY','Retirement-State: RETIRED_DO_NOT_MERGE','Writer-Lease-State:','Writer-Lease-State: NONE']) assert.equal(genericSyncBlocker({...mk('old'),body}),'OWNER_LEASE_SUPERVISOR_REQUIRED');
  assert.equal(genericSyncBlocker({...mk('old'),body:undefined}),'PR_BODY_UNPROVEN');
  assert.equal(genericSyncBlocker({...mk('old'),body:'Ordinary opt-in'}),null);
});
test('lease acquired after comparison prevents CAS',async()=>{
  let reads=0,writes=0;
  const github={paginate:async()=>[mk('old')],rest:{pulls:{list(){},get:async()=>({data:{...mk('old'),body:reads++?'Writer-Lease-State: TERMINAL_DELIVERY':null}})},repos:{compareCommits:async()=>({data:{ahead_by:1}})}},request:async()=>{writes++;}};
  const r=await reconcile({github,owner:'owner',repo:'repo'});
  assert.equal(writes,0);assert.equal(r.blocked[0].reason,'OWNER_LEASE_SUPERVISOR_REQUIRED');
});
test('base or head moved after compare prevents stale write',async()=>{
  for(const change of ['base','head']) {
    let reads=0,writes=0;
    const github={paginate:async()=>[mk('old')],rest:{pulls:{list(){},get:async()=>({data:reads++?{...mk(change==='head'?'other':'old'),base:{sha:change==='base'?'newbase':'base'}}:mk('old')})},repos:{compareCommits:async()=>({data:{ahead_by:1}})}},request:async()=>{writes++;}};
    const r=await reconcile({github,owner:'owner',repo:'repo'});
    assert.equal(writes,0);assert.equal(r.blocked[0].reason,'PREWRITE_IDENTITY_CHANGED');
  }
});
