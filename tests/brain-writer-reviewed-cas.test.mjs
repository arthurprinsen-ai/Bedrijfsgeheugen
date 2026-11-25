import test from 'node:test';
import assert from 'node:assert/strict';
import {publishReviewedUnion,classifyPrewriteResolution,collectPrewriteReadback,prepareReviewedPrewrite} from '../tools/delivery/reviewed-cas.mjs';
const H='a'.repeat(40),M='b'.repeat(40),N='c'.repeat(40),T='d'.repeat(40),B='e'.repeat(40);
function fixture(){
 const manifest={prNumber:5940,expectedHead:H,expectedBase:B,branch:'fix/original',obligation:'original'};
 const preflight={headSha:H,executionMainSha:M,branch:manifest.branch,obligation:manifest.obligation,prBaseSha:B,manifestSha256:'f'.repeat(64),writeAuthorized:false};
 const prepared={head:H,main:M,commit:N,tree:T,manifestSha256:preflight.manifestSha256,state:'PREPARED_NOT_PUBLISHED',writeAuthorized:false};
 const holder='github-actions:12:1',calls=[],state={head:H,main:M,verified:true,revision:1,generation:1,slotReads:0,pushes:0,pending:false};
 const input={manifest,preflight,prepared,holder,
 authorizedPgQuery:async(sql,args)=>{calls.push(sql);if(sql.includes('.acquire('))return [{token:1}];if(sql.includes('.verify('))return [{verified:state.verified}];if(sql.includes('.prepare_prewrite(')){state.pending=true;state.prewriteArgs=args;return [{generation:state.generation,revision:state.revision+1,state:'prewrite_pending'}]};if(sql.includes('promotion_prewrite_intent')){if(!state.pending)return [];const [repository,holder,generation,revision,pr_number,head_sha,main_sha,manifest_digest,branch,obligation,commit_sha,tree_sha,intent_digest]=state.prewriteArgs;return [{repository,holder,generation,revision:revision+1,pr_number,head_sha,main_sha,manifest_digest,branch,obligation,commit_sha,tree_sha,intent_digest,evidence_digest:intent_digest,state:'prewrite_pending'}]};if(sql.includes('.release('))return [{released:true}];throw Error('UNEXPECTED_SQL')},
 github:{readReviewedPR:async()=>({open:true,number:5940,headSha:state.head,baseSha:B,branch:manifest.branch,obligation:manifest.obligation}),readHead:async b=>b==='main'?state.main:state.head},
 slot:{readReservation:async expected=>{state.slotReads++;return {...expected,state:'EXCLUSIVE_PREWRITE_RESERVED',providerEnforced:true,mutationAuthority:true,appId:5916428,generation:state.generation,revision:state.revision,activeGrantCount:0,nativeBypassDenied:true}},readPendingReservation:async expected=>({...expected,state:'EXCLUSIVE_PREWRITE_PENDING',providerEnforced:true,mutationAuthority:true,appId:5916428,activeGrantCount:0,nativeBypassDenied:true})},
 transport:{inspect:async()=>({tree:T,parents:[H,M]}),pushExact:async req=>{state.pushes++;assert.equal(state.pending,true);assert.equal(req.revision,state.revision+1);assert.equal(req.generation,state.generation);assert.equal(req.intentDigest,state.prewriteArgs[12]);assert.equal(req.expectedHead,H);assert.equal(req.newHead,N);assert.equal(req.branch,manifest.branch);if(state.head!==req.expectedHead)return {accepted:false};state.head=N;return {accepted:true}},readCommit:async()=>({sha:N,tree:T,parents:[H,M]})}
 };
 return {input,state,calls};
}
test('exact reserved candidate can publish only pending full BRAIN, releases original lease',async()=>{const f=fixture();const r=await publishReviewedUnion(f.input);assert.equal(r.newHead,N);assert.equal(r.productionVerified,false);assert.equal(f.state.pushes,1);assert.ok(f.calls.at(-1).includes('.release('))});
test('shadow or native bypass possible: no lease or ref mutation',async()=>{for(const patch of [{mutationAuthority:false},{providerEnforced:false},{nativeBypassDenied:false},{appId:15368},{appId:999},{appId:5916429},{appId:'5916428'},{appId:undefined},{activeGrantCount:1}]){const f=fixture();const read=f.input.slot.readReservation;f.input.slot.readReservation=async e=>({...await read(e),...patch});await assert.rejects(publishReviewedUnion(f.input),/MAIN_WIDE_PROVIDER_RESERVATION_UNPROVEN/);assert.equal(f.calls.length,0);assert.equal(f.state.pushes,0)}});
test('lost lease and changed reservation reject before push and release',async()=>{for(const kind of ['lease','revision']){const f=fixture();if(kind==='lease')f.state.verified=false;else{const read=f.input.slot.readReservation;f.input.slot.readReservation=async e=>{const r=await read(e);return {...r,revision:f.state.slotReads}}}await assert.rejects(publishReviewedUnion(f.input),/REVIEWED_LEASE_LOST|MAIN_WIDE_RESERVATION_CHANGED/);assert.equal(f.state.pushes,0);assert.ok(f.calls.at(-1).includes('.release('))}});
test('wrong native parents fail before lease',async()=>{const f=fixture();f.input.transport.inspect=async()=>({tree:T,parents:[M,H]});await assert.rejects(publishReviewedUnion(f.input),/UNION_OBJECT_MISMATCH/);assert.equal(f.calls.length,0)});
test('concurrent head movement rejected by exact transport; no retry',async()=>{const f=fixture();const push=f.input.transport.pushExact;f.input.transport.pushExact=async r=>{f.state.head=B;return push(r)};await assert.rejects(publishReviewedUnion(f.input),/NATIVE_EXPECTED_HEAD_CAS_UNPROVEN/);assert.equal(f.state.head,B);assert.equal(f.state.pushes,1)});
test('post-write main movement is reconcile-only, never green or retry',async()=>{const f=fixture();const push=f.input.transport.pushExact;f.input.transport.pushExact=async r=>{const v=await push(r);f.state.main=B;return v};await assert.rejects(publishReviewedUnion(f.input),/MAIN_MOVED_AFTER_CAS_RECONCILE_ONLY/);assert.equal(f.state.pushes,1);assert.equal(f.state.head,N)});

test('prepared union must bind the immutable manifest digest',async()=>{const f=fixture();f.input.prepared.manifestSha256='0'.repeat(64);await assert.rejects(publishReviewedUnion(f.input),/UNION_IDENTITY_UNPROVEN/);assert.equal(f.calls.length,0)});

test('dedicated App identity must remain exact after lease acquisition',async()=>{const f=fixture();const read=f.input.slot.readReservation;f.input.slot.readReservation=async e=>{const r=await read(e);return f.state.slotReads===2?{...r,appId:5916429}:r};await assert.rejects(publishReviewedUnion(f.input),/MAIN_WIDE_PROVIDER_RESERVATION_UNPROVEN/);assert.equal(f.state.pushes,0);assert.ok(f.calls.at(-1).includes('.release('))});

const intent={repository:'arthurprinsen-ai/Bedrijfsgeheugen',state:'prewrite_pending',prNumber:6165,generation:1,revision:2,holder:'github-actions:123:1',branch:'fix/original',obligation:'original',head:'a'.repeat(40),main:'b'.repeat(40),commit:'c'.repeat(40),tree:'d'.repeat(40),manifestSha256:'e'.repeat(64)};
const observed={...intent,independentReadback:true,branchBefore:intent.commit,branchAfter:intent.commit,mainBefore:intent.main,mainAfter:intent.main,transportOutcome:'accepted',commitObject:{sha:intent.commit,tree:intent.tree,parents:[intent.head,intent.main]}};
const unchanged={branchBefore:intent.head,branchAfter:intent.head};
const resolutions=[
 ['exact accepted',{}, {},'EXACT_WRITE_OBSERVED_OWNER_REVIEW'],
 ['no intent',{state:'reserved'}, {},'INTENT_IDENTITY_UNPROVEN'],
 ['wrong repo',{repository:'other/repo'}, {},'INTENT_IDENTITY_UNPROVEN'],
 ['wrong revision',{}, {revision:3},'READBACK_IDENTITY_UNPROVEN'],
 ['wrong digest',{}, {manifestSha256:'f'.repeat(64)},'READBACK_IDENTITY_UNPROVEN'],
 ['no independent readback',{}, {independentReadback:false},'READBACK_IDENTITY_UNPROVEN'],
 ['branch movement',{}, {branchAfter:intent.head},'PROVIDER_MOVEMENT_RECONCILE_ONLY'],
 ['main movement',{}, {mainAfter:intent.head},'PROVIDER_MOVEMENT_RECONCILE_ONLY'],
 ['bad parents',{}, {commitObject:{...observed.commitObject,parents:[intent.main,intent.head]}},'COMMIT_OBJECT_UNPROVEN'],
 ['wrong tree',{}, {commitObject:{...observed.commitObject,tree:intent.main}},'COMMIT_OBJECT_UNPROVEN'],
 ['ambiguous but visible',{}, {transportOutcome:'ambiguous'},'EXPECTED_COMMIT_VISIBLE_CAUSALITY_UNPROVEN'],
 ['main drift',{}, {mainBefore:intent.head,mainAfter:intent.head},'MAIN_MOVED_RECONCILE_ONLY'],
 ['unchanged ambiguous',{}, {...unchanged,transportOutcome:'ambiguous'},'UNCHANGED_HEAD_UNRESOLVED'],
 ['unchanged accepted',{}, {...unchanged},'UNCHANGED_HEAD_UNRESOLVED'],
 ['rejected but no quiescence',{}, {...unchanged,transportOutcome:'rejected'},'UNCHANGED_HEAD_UNRESOLVED'],
 ['quiescent but possible in-flight',{}, {...unchanged,transportOutcome:'rejected',credentialQuiescenceVerified:true},'UNCHANGED_HEAD_UNRESOLVED'],
 ['exact rejection review',{}, {...unchanged,transportOutcome:'rejected',credentialQuiescenceVerified:true,inFlightTransportExcluded:true},'EXACT_REJECTION_OBSERVED_OWNER_REVIEW'],
 ['unexpected head',{}, {branchBefore:intent.main,branchAfter:intent.main},'UNEXPECTED_BRANCH_RECONCILE_ONLY']
];
for(const [name,di,doo,state] of resolutions)test('prewrite resolution: '+name,()=>{const x=classifyPrewriteResolution({intent:{...intent,...di},observation:{...observed,...doo}});assert.equal(x.state,state);for(const v of [x.mutationAuthority,x.releaseAuthorized,x.retryAuthorized,x.mergeAuthorized])assert.equal(v,false)});

const readIntent={repository:'arthurprinsen-ai/Bedrijfsgeheugen',state:'prewrite_pending',prNumber:6165,generation:1,revision:2,holder:'github-actions:123:1',branch:'fix/original',obligation:'original',head:'a'.repeat(40),main:'b'.repeat(40),commit:'c'.repeat(40),tree:'d'.repeat(40),manifestSha256:'e'.repeat(64)};
function readFixture(){const i={...readIntent},s={branch:i.head,main:i.main,reads:0,prReads:0,commitReads:0};
 const github={readReviewedPR:async()=>{s.prReads++;return {open:true,number:i.prNumber,branch:i.branch,obligation:i.obligation,headSha:s.branch,baseSha:i.main}},readHead:async b=>{s.reads++;return b==='main'?s.main:s.branch},readCommit:async()=>{s.commitReads++;return {sha:i.commit,tree:i.tree,parents:[i.head,i.main]}}};return {intent:i,github,s};}
const readCases=[
 ['unchanged head no receipt',f=>{},'UNCHANGED_HEAD_UNRESOLVED'],
 ['visible expected commit no causality',f=>{f.s.branch=f.intent.commit},'EXPECTED_COMMIT_VISIBLE_CAUSALITY_UNPROVEN'],
 ['wrong commit tree',f=>{f.s.branch=f.intent.commit;f.github.readCommit=async()=>({sha:f.intent.commit,tree:f.intent.main,parents:[f.intent.head,f.intent.main]})},'COMMIT_OBJECT_UNPROVEN'],
 ['wrong obligation',f=>{f.github.readReviewedPR=async()=>({open:true,number:f.intent.prNumber,branch:f.intent.branch,obligation:'other',headSha:f.intent.head})},'NATIVE_PR_IDENTITY_UNPROVEN'],
 ['main drifts',f=>{f.s.main=f.intent.head},'MAIN_MOVED_RECONCILE_ONLY'],
 ['read fails',f=>{f.github.readHead=async()=>{throw Error('transport')}},'NATIVE_READBACK_UNAVAILABLE'],
 ['PR/ref mismatch',f=>{f.github.readHead=async b=>b==='main'?f.intent.main:f.intent.commit},'NATIVE_PR_REF_DRIFT'],
 ['missing adapter',f=>{delete f.github.readCommit},'PROVIDER_READ_ADAPTER_REQUIRED'],
 ['invalid intent',f=>{f.intent.state='reserved'},'INTENT_IDENTITY_UNPROVEN'],
 ['changed branch during readback',f=>{let n=0;f.github.readHead=async b=>b==='main'?f.intent.main:(++n===1?f.intent.head:(f.s.branch=f.intent.commit))},'PROVIDER_MOVEMENT_RECONCILE_ONLY']
];

for(const [name,mut,state] of readCases)test('native readback: '+name,async()=>{const f=readFixture();mut(f);const r=await collectPrewriteReadback(f);assert.equal(r.state,state);assert.equal(r.mutationAuthority,false);assert.equal(r.releaseAuthorized,false);assert.equal(r.retryAuthorized,false);});

const obligationCases=[['missing intent',{obligation:undefined},{},'INTENT_IDENTITY_UNPROVEN'],['blank intent',{obligation:' '},{},'INTENT_IDENTITY_UNPROVEN'],['wrong receipt',{}, {obligation:'other'},'READBACK_IDENTITY_UNPROVEN'],['missing receipt',{}, {obligation:undefined},'READBACK_IDENTITY_UNPROVEN'],['exact binding',{}, {},'EXACT_WRITE_OBSERVED_OWNER_REVIEW']];
for(const [name,di,doo,state] of obligationCases)test('obligation binding: '+name,()=>{const r=classifyPrewriteResolution({intent:{...intent,...di},observation:{...observed,...doo}});assert.equal(r.state,state);assert.equal(r.mutationAuthority,false);assert.equal(r.releaseAuthorized,false);});


test('durable prewrite is persisted and independently read back before the one transport; global slot is not resolved',async()=>{const f=fixture();const r=await publishReviewedUnion(f.input);assert.equal(r.globalReservationResolved,false);assert.equal(r.slotRevision,2);assert.equal(r.slotGeneration,1);assert.equal(f.state.pushes,1);assert.equal(f.state.prewriteArgs.length,13);assert.deepEqual(f.state.prewriteArgs.slice(0,12),['arthurprinsen-ai/Bedrijfsgeheugen',f.input.holder,1,1,5940,H,M,'f'.repeat(64),'fix/original','original',N,T]);assert.equal(f.calls.filter(x=>x.includes('.prepare_prewrite(')).length,1);assert.equal(f.calls.filter(x=>x.includes('promotion_prewrite_intent')).length,1)});
for(const mode of ['missing pending adapter','missing generation','prepare rejects','ambiguous prepare','wrong prepare revision','readback false','pending fence false','pending generation drift','pending digest drift','pending object drift','head drift after pending'])test('prewrite boundary denies: '+mode,async()=>{const f=fixture();const original=f.input.authorizedPgQuery;if(mode==='missing pending adapter')delete f.input.slot.readPendingReservation;if(mode==='missing generation'){const r=f.input.slot.readReservation;f.input.slot.readReservation=async e=>({...await r(e),generation:undefined})}if(['prepare rejects','ambiguous prepare','wrong prepare revision','readback false'].includes(mode))f.input.authorizedPgQuery=async(sql,args)=>{if(sql.includes('.prepare_prewrite(')){if(mode==='prepare rejects')throw Error('database rejected');const r=await original(sql,args);if(mode==='ambiguous prepare')throw Error('response lost');if(mode==='wrong prepare revision')return [{...r[0],revision:99}];return r}if(sql.includes('promotion_prewrite_intent')&&mode==='readback false')return [{verified:false}];return original(sql,args)};if(mode.startsWith('pending ')||mode==='head drift after pending'){const r=f.input.slot.readPendingReservation;f.input.slot.readPendingReservation=async e=>{const v=await r(e);if(mode==='head drift after pending'){f.state.head=B;return v}return {...v,...(mode==='pending fence false'?{nativeBypassDenied:false}:mode==='pending generation drift'?{generation:2}:mode==='pending digest drift'?{intentDigest:'0'.repeat(64)}:{commit:B})}}}await assert.rejects(publishReviewedUnion(f.input));assert.equal(f.state.pushes,0);assert.ok(f.calls.filter(x=>x.includes('.prepare_prewrite(')).length<=1)});

test('uncertain transport outcome never automatically releases original writer lease',async()=>{
 for(const [label,mutate] of [
  ['transport exception after mutation',f=>{f.input.transport.pushExact=async()=>{f.state.pushes++;f.state.head=N;throw Error('RESPONSE_LOST')}}],
  ['transport false',f=>{f.input.transport.pushExact=async()=>{f.state.pushes++;return {accepted:false}}}],
  ['branch readback mismatch',f=>{f.input.transport.pushExact=async()=>{f.state.pushes++;return {accepted:true}}}],
  ['commit readback unavailable',f=>{f.input.transport.readCommit=async()=>{throw Error('READBACK_LOST')}}],
  ['wrong commit object',f=>{f.input.transport.readCommit=async()=>({sha:N,tree:H,parents:[H,M]})}],
  ['main changed after push',f=>{const old=f.input.transport.pushExact;f.input.transport.pushExact=async r=>{const v=await old(r);f.state.main=B;return v}}]
 ]){
  const f=fixture();mutate(f);
  await assert.rejects(publishReviewedUnion(f.input),/RESPONSE_LOST|NATIVE_EXPECTED_HEAD_CAS_UNPROVEN|CAS_BRANCH_READBACK_MISMATCH|READBACK_LOST|CAS_COMMIT_READBACK_MISMATCH|MAIN_MOVED_AFTER_CAS_RECONCILE_ONLY/,label);
  assert.equal(f.state.pushes,1,label);
  assert.equal(f.calls.filter(sql=>sql.includes('.release(')).length,0,label);
 }
});

function durableFixture(){
 const i={...readIntent},calls=[];
 const canonical={repository:i.repository,state:i.state,prNumber:i.prNumber,head:i.head,main:i.main,branch:i.branch,obligation:i.obligation,holder:i.holder,manifestSha256:i.manifestSha256,generation:i.generation,revision:i.revision,commit:i.commit,tree:i.tree};
 i.intentDigest=recoveryHash('sha256').update(JSON.stringify(canonical)).digest('hex');
 const row={repository:i.repository,generation:String(i.generation),revision:String(i.revision),holder:i.holder,pr_number:String(i.prNumber),
 head_sha:i.head,main_sha:i.main,branch:i.branch,obligation:i.obligation,commit_sha:i.commit,tree_sha:i.tree,
 manifest_digest:i.manifestSha256,intent_digest:i.intentDigest,evidence_digest:i.intentDigest,state:'prewrite_pending'};
 const state={prepare:[{generation:String(i.generation),revision:String(i.revision),state:'prewrite_pending'}],rows:[row],failure:0};
 const query=async(sql,args)=>{calls.push({sql,args});
 if(calls.length===state.failure)throw Error('LOST_RESPONSE');
 if(sql.includes('.prepare_prewrite('))return state.prepare;
 if(sql.includes('promotion_prewrite_intent'))return state.rows;
 throw Error('UNEXPECTED_SQL');};
 return {i,row,state,calls,query};
}
for(const [name,change,expected,count] of [
 ['exact',()=>{},'PREWRITE_DURABLE_INTENT_OBSERVED_OWNER_REVIEW',2],
 ['missing digest',f=>{delete f.i.intentDigest},'PREWRITE_INPUT_UNPROVEN',0],
 ['valid-shaped wrong digest',f=>{f.i.intentDigest='9'.repeat(64)},'PREWRITE_INTENT_DIGEST_MISMATCH',0],
 ['intent changed after digest',f=>{f.i.obligation='other'},'PREWRITE_INTENT_DIGEST_MISMATCH',0],
 ['invalid revision',f=>{f.i.revision=1},'PREWRITE_INPUT_UNPROVEN',0],
 ['prepare timeout',f=>{f.state.failure=1},'PREWRITE_PREPARE_UNCONFIRMED',1],
 ['wrong prepare revision',f=>{f.state.prepare[0].revision=3},'PREWRITE_PREPARE_UNCONFIRMED',1],
 ['prepare duplicate rows',f=>{f.state.prepare.push(f.state.prepare[0])},'PREWRITE_PREPARE_UNCONFIRMED',1],
 ['readback timeout',f=>{f.state.failure=2},'PREWRITE_DURABLE_READBACK_UNAVAILABLE',2],
 ['missing durable row',f=>{f.state.rows=[]},'PREWRITE_DURABLE_READBACK_UNPROVEN',2],
 ['duplicate durable rows',f=>{f.state.rows.push(f.row)},'PREWRITE_DURABLE_READBACK_UNPROVEN',2],
 ['different event digest',f=>{f.row.evidence_digest='8'.repeat(64)},'PREWRITE_DURABLE_READBACK_UNPROVEN',2],
 ['wrong commit',f=>{f.row.commit_sha=f.i.head},'PREWRITE_DURABLE_READBACK_UNPROVEN',2],
 ['wrong obligation',f=>{f.row.obligation='other'},'PREWRITE_DURABLE_READBACK_UNPROVEN',2],
 ['wrong holder',f=>{f.row.holder='github-actions:9:1'},'PREWRITE_DURABLE_READBACK_UNPROVEN',2],
 ['wrong generation',f=>{f.row.generation='9'},'PREWRITE_DURABLE_READBACK_UNPROVEN',2],
 ['wrong state',f=>{f.row.state='reserved'},'PREWRITE_DURABLE_READBACK_UNPROVEN',2]
])test('durable prewrite: '+name,async()=>{
 const f=durableFixture();change(f);
 const r=await prepareReviewedPrewrite({intent:f.i,authorizedPgQuery:f.query});
 assert.equal(r.state,expected);assert.equal(f.calls.length,count);
 for(const v of [r.mutationAuthority,r.releaseAuthorized,r.retryAuthorized,r.mergeAuthorized])assert.equal(v,false);
 if(count){assert.equal(f.calls[0].args[3],f.i.revision-1);assert.equal(f.calls[0].args[10],f.i.commit);assert.equal(f.calls[0].args[12],f.i.intentDigest)}
});

for(const mode of ['prepare reply lost','durable readback lost','provider fence lost'])test('uncertain '+mode+' retains writer lease',async()=>{const f=fixture(),q=f.input.authorizedPgQuery;if(mode==='provider fence lost')f.input.slot.readPendingReservation=async()=>{throw Error('FENCE_LOST')};else f.input.authorizedPgQuery=async(sql,args)=>{const r=await q(sql,args);if((mode==='prepare reply lost'&&sql.includes('.prepare_prewrite('))||(mode==='durable readback lost'&&sql.includes('promotion_prewrite_intent')))throw Error('REPLY_LOST');return r};await assert.rejects(publishReviewedUnion(f.input));assert.equal(f.state.pending,true);assert.equal(f.state.pushes,0);assert.equal(f.calls.filter(x=>x.includes('.release(')).length,0)});

import {createHash as recoveryHash} from 'node:crypto';
import {recoverReviewedPrewrite} from '../tools/delivery/reviewed-cas.mjs';
function recoveryFixture(){
 const f=durableFixture(),g=readFixture(),i=f.i;
 const canonical={repository:i.repository,state:i.state,prNumber:i.prNumber,head:i.head,main:i.main,branch:i.branch,obligation:i.obligation,holder:i.holder,manifestSha256:i.manifestSha256,generation:i.generation,revision:i.revision,commit:i.commit,tree:i.tree};
 i.intentDigest=recoveryHash('sha256').update(JSON.stringify(canonical)).digest('hex');
 f.row.intent_digest=f.row.evidence_digest=i.intentDigest;
 return {...f,g,input:{intent:i,authorizedPgQuery:f.query,github:g.github}};
}
for(const [name,change,state,providerState,count] of [
 ['unchanged head',()=>{},'RECOVERY_READBACK_OWNER_REVIEW','UNCHANGED_HEAD_UNRESOLVED',2],
 ['visible commit without receipt',f=>{f.g.s.branch=f.i.commit},'RECOVERY_READBACK_OWNER_REVIEW','EXPECTED_COMMIT_VISIBLE_CAUSALITY_UNPROVEN',2],
 ['invalid digest',f=>{f.i.intentDigest='0'.repeat(64)},'RECOVERY_INTENT_DIGEST_MISMATCH',undefined,0],
 ['missing row',f=>{f.state.rows=[]},'RECOVERY_DURABLE_INTENT_UNPROVEN',undefined,1],
 ['wrong audit digest',f=>{f.row.evidence_digest='0'.repeat(64)},'RECOVERY_DURABLE_INTENT_UNPROVEN',undefined,1],
 ['expired lease remains visible',f=>{f.row.valid_until='2020-01-01T00:00:00Z'},'RECOVERY_READBACK_OWNER_REVIEW','UNCHANGED_HEAD_UNRESOLVED',2],
 ['reservation drifts',f=>{const q=f.input.authorizedPgQuery;f.input.authorizedPgQuery=async(...a)=>{const r=await q(...a);return f.calls.length===2?[]:r}},'RECOVERY_RESERVATION_CHANGED',undefined,2],
 ['read failure',f=>{f.state.failure=1},'RECOVERY_DURABLE_READBACK_UNAVAILABLE',undefined,1]
])test('read-only pending recovery: '+name,async()=>{
 const f=recoveryFixture();change(f);
 const r=await recoverReviewedPrewrite(f.input);
 assert.equal(r.state,state);assert.equal(r.providerState,providerState);assert.equal(f.calls.length,count);
 assert.ok(f.calls.every(c=>/^select i\.repository/.test(c.sql)&&!c.sql.includes('clock_timestamp')&&!c.sql.includes('.prepare_prewrite(')));
 for(const v of [r.mutationAuthority,r.releaseAuthorized,r.retryAuthorized,r.mergeAuthorized])assert.equal(v,false);
});

test('canonical prewrite digest is independent of caller property order',async()=>{
 const f=durableFixture();
 const reordered=Object.fromEntries(Object.entries(f.i).reverse());
 const r=await prepareReviewedPrewrite({intent:reordered,authorizedPgQuery:f.query});
 assert.equal(r.state,'PREWRITE_DURABLE_INTENT_OBSERVED_OWNER_REVIEW');
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[0].args[12],f.i.intentDigest);
});
