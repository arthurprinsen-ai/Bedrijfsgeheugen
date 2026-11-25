import test from 'node:test';
import assert from 'node:assert/strict';
import {publishReviewedUnion} from '../tools/delivery/reviewed-cas.mjs';
const H='a'.repeat(40),M='b'.repeat(40),N='c'.repeat(40),T='d'.repeat(40),B='e'.repeat(40);
function fixture(){
 const manifest={prNumber:5940,expectedHead:H,expectedBase:B,branch:'fix/original',obligation:'original'};
 const preflight={headSha:H,executionMainSha:M,branch:manifest.branch,obligation:manifest.obligation,prBaseSha:B,manifestSha256:'f'.repeat(64),writeAuthorized:false};
 const prepared={head:H,main:M,commit:N,tree:T,manifestSha256:preflight.manifestSha256,state:'PREPARED_NOT_PUBLISHED',writeAuthorized:false};
 const holder='github-actions:12:1',calls=[],state={head:H,main:M,verified:true,revision:1,slotReads:0,pushes:0};
 const input={manifest,preflight,prepared,holder,
 authorizedPgQuery:async(sql,args)=>{calls.push(sql);if(sql.includes('.acquire('))return [{token:1}];if(sql.includes('.verify('))return [{verified:state.verified}];if(sql.includes('.release('))return [{released:true}];throw Error('UNEXPECTED_SQL')},
 github:{readReviewedPR:async()=>({open:true,number:5940,headSha:state.head,baseSha:B,branch:manifest.branch,obligation:manifest.obligation}),readHead:async b=>b==='main'?state.main:state.head},
 slot:{readReservation:async expected=>{state.slotReads++;return {...expected,state:'EXCLUSIVE_PREWRITE_RESERVED',providerEnforced:true,mutationAuthority:true,appId:999,revision:state.revision,activeGrantCount:0,nativeBypassDenied:true}}},
 transport:{inspect:async()=>({tree:T,parents:[H,M]}),pushExact:async req=>{state.pushes++;assert.equal(req.expectedHead,H);assert.equal(req.newHead,N);assert.equal(req.branch,manifest.branch);if(state.head!==req.expectedHead)return {accepted:false};state.head=N;return {accepted:true}},readCommit:async()=>({sha:N,tree:T,parents:[H,M]})}
 };
 return {input,state,calls};
}
test('exact reserved candidate can publish only pending full BRAIN, releases original lease',async()=>{const f=fixture();const r=await publishReviewedUnion(f.input);assert.equal(r.newHead,N);assert.equal(r.productionVerified,false);assert.equal(f.state.pushes,1);assert.ok(f.calls.at(-1).includes('.release('))});
test('shadow or native bypass possible: no lease or ref mutation',async()=>{for(const patch of [{mutationAuthority:false},{providerEnforced:false},{nativeBypassDenied:false},{appId:15368},{activeGrantCount:1}]){const f=fixture();const read=f.input.slot.readReservation;f.input.slot.readReservation=async e=>({...await read(e),...patch});await assert.rejects(publishReviewedUnion(f.input),/MAIN_WIDE_PROVIDER_RESERVATION_UNPROVEN/);assert.equal(f.calls.length,0);assert.equal(f.state.pushes,0)}});
test('lost lease and changed reservation reject before push and release',async()=>{for(const kind of ['lease','revision']){const f=fixture();if(kind==='lease')f.state.verified=false;else{const read=f.input.slot.readReservation;f.input.slot.readReservation=async e=>{const r=await read(e);return {...r,revision:f.state.slotReads}}}await assert.rejects(publishReviewedUnion(f.input),/REVIEWED_LEASE_LOST|MAIN_WIDE_RESERVATION_CHANGED/);assert.equal(f.state.pushes,0);assert.ok(f.calls.at(-1).includes('.release('))}});
test('wrong native parents fail before lease',async()=>{const f=fixture();f.input.transport.inspect=async()=>({tree:T,parents:[M,H]});await assert.rejects(publishReviewedUnion(f.input),/UNION_OBJECT_MISMATCH/);assert.equal(f.calls.length,0)});
test('concurrent head movement rejected by exact transport; no retry',async()=>{const f=fixture();const push=f.input.transport.pushExact;f.input.transport.pushExact=async r=>{f.state.head=B;return push(r)};await assert.rejects(publishReviewedUnion(f.input),/NATIVE_EXPECTED_HEAD_CAS_UNPROVEN/);assert.equal(f.state.head,B);assert.equal(f.state.pushes,1)});
test('post-write main movement is reconcile-only, never green or retry',async()=>{const f=fixture();const push=f.input.transport.pushExact;f.input.transport.pushExact=async r=>{const v=await push(r);f.state.main=B;return v};await assert.rejects(publishReviewedUnion(f.input),/MAIN_MOVED_AFTER_CAS_RECONCILE_ONLY/);assert.equal(f.state.pushes,1);assert.equal(f.state.head,N)});

test('prepared union must bind the immutable manifest digest',async()=>{const f=fixture();f.input.prepared.manifestSha256='0'.repeat(64);await assert.rejects(publishReviewedUnion(f.input),/UNION_IDENTITY_UNPROVEN/);assert.equal(f.calls.length,0)});
