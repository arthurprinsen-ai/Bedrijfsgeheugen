import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolveReviewedEpoch} from '../tools/delivery/reviewed-epoch.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),d='d'.repeat(40),p='platform/agents/agent-team.mjs';
function fixture(){
 const manifest={contract:'brain-writer-patch-handoff-v2',prNumber:5940,expectedHead:a,expectedBase:b,reviewedMainSha:c,branch:'fix/original',obligation:'original',files:[{path:p,expectedMainSha256:hash('current main'),expectedOldSha256:hash('old branch'),content:'resolved',contentSha256:hash('resolved')}]};
 return {manifest,manifestBytes:JSON.stringify(manifest),policy:{contract:'brain-writer-approved-paths-v1',paths:[p]},invocationSha:d,checkoutSha:d,readMain:async()=>d,readPR:async()=>({open:true,headSha:a,baseSha:b,branch:'fix/original',obligation:'original'}),readFile:async(_,sha)=>sha===a?'old branch':'current main',verifyAncestor:async()=>true};
}
function changed(f,fn){fn(f.manifest);f.manifestBytes=JSON.stringify(f.manifest);return f;}
test('review commit advances main; old PR base remains separate; no write authorization',async()=>{const r=await resolveReviewedEpoch(fixture());assert.equal(r.executionMainSha,d);assert.equal(r.prBaseSha,b);assert.equal(r.writeAuthorized,false);});
test('checkout drift',async()=>await assert.rejects(resolveReviewedEpoch({...fixture(),checkoutSha:c}),/UNTRUSTED_EXECUTION_REVISION/));
test('manifest mismatch',async()=>await assert.rejects(resolveReviewedEpoch({...fixture(),manifestBytes:'{}'}),/MANIFEST_BYTES_MISMATCH/));
test('no approved paths',async()=>await assert.rejects(resolveReviewedEpoch({...fixture(),policy:{contract:'brain-writer-approved-paths-v1',paths:[]}}),/INVALID_SCOPE/));
test('unproven reviewed ancestry',async()=>await assert.rejects(resolveReviewedEpoch({...fixture(),verifyAncestor:async()=>false}),/REVIEWED_MAIN_NOT_ANCESTOR/));
test('wrong branch source',async()=>await assert.rejects(resolveReviewedEpoch({...fixture(),readFile:async()=> 'current main'}),/CANDIDATE_SOURCE_DRIFT/));
test('main path changed after review',async()=>await assert.rejects(resolveReviewedEpoch({...fixture(),readFile:async(_,sha)=>sha===a?'old branch':sha===c?'current main':'new main'}),/APPROVED_MAIN_SOURCE_DRIFT/));
test('main moves during verification',async()=>{let calls=0;await assert.rejects(resolveReviewedEpoch({...fixture(),readMain:async()=>++calls===1?d:c}),/MAIN_EPOCH_DRIFT/);});
test('candidate head moves during verification',async()=>{let calls=0;await assert.rejects(resolveReviewedEpoch({...fixture(),readPR:async()=>({open:true,headSha:++calls===1?a:d,baseSha:b,branch:'fix/original',obligation:'original'})}),/CANDIDATE_IDENTITY_DRIFT/);});
test('wrong obligation',async()=>await assert.rejects(resolveReviewedEpoch(changed(fixture(),m=>m.obligation='other')),/CANDIDATE_IDENTITY_DRIFT/));
test('tampered replacement',async()=>await assert.rejects(resolveReviewedEpoch(changed(fixture(),m=>m.files[0].content='other')),/INVALID_PATCH_DIGEST/));
test('unapproved path',async()=>await assert.rejects(resolveReviewedEpoch(changed(fixture(),m=>m.files[0].path='x')),/PATH_NOT_APPROVED/));
test('protected workflow remains denied even with allowlist',async()=>{const f=changed(fixture(),m=>m.files[0].path='.github/workflows/x.yml');f.policy.paths.push('.github/workflows/x.yml');await assert.rejects(resolveReviewedEpoch(f),/PATH_NOT_APPROVED/);});
test('permission policy files cannot be changed by the handoff',async()=>{const f=changed(fixture(),m=>m.files[0].path='config/brain-writer-approved-paths.json');f.policy.paths.push('config/brain-writer-approved-paths.json');await assert.rejects(resolveReviewedEpoch(f),/PATH_NOT_APPROVED/);});
