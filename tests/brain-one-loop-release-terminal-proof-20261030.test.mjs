import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertOneLoopProductionReleaseProof} from '../platform/api/portal-authenticated-production-proof-core.mjs';

const valid=()=>({
  contract:'PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1',status:'PROVEN',
  commit_ref:'9fc929fcb057e6d78686ba287778c293a46a322f',
  deploy_id:'6ae458c2f4d6723c8bf2ff5d',tenant_count_verified:2,
  synthetic_user_cleanup:'DELETED',
  one_loop_assurance_proof:'PROVEN',
  one_loop_assurance_admin_verified:true,
  one_loop_assurance_nonadmin_denied:true,
  one_loop_assurance_unauthenticated_denied:true,
  one_loop_assurance_failure_code:null,
  one_loop_assurance_counts:{total:15,green:8,amber:3,red:4,overallStatus:'RED'}
});

test('historic original 8/3/4 source is a verified route, never falsely all green',()=>{
  const result=assertOneLoopProductionReleaseProof(valid());
  assert.deepEqual(result,{
    contract:'one-brain-original-loop-assurance-readback-v1',status:'PROVEN',
    count:15,green:8,amber:3,red:4,overallStatus:'RED',
    nonadminDenied:true,unauthenticatedDenied:true,cleanup:'DELETED'
  });
  assert.equal(result.green+result.amber+result.red,15);
});

test('generic signed tenant authentication never substitutes original admin route proof',()=>{
  const v=valid();delete v.one_loop_assurance_proof;
  assert.throws(()=>assertOneLoopProductionReleaseProof(v),/ONE_LOOP_ADMIN_PROOF_NOT_PROVEN/);
  v.one_loop_assurance_proof='UNVERIFIED';
  assert.throws(()=>assertOneLoopProductionReleaseProof(v),/ONE_LOOP_ADMIN_PROOF_NOT_PROVEN/);
});

test('admin/nonadmin/anonymous boundaries and cleanup are each mandatory',()=>{
  for(const [key,code] of [
    ['one_loop_assurance_admin_verified','ONE_LOOP_ADMIN_READBACK_NOT_VERIFIED'],
    ['one_loop_assurance_nonadmin_denied','ONE_LOOP_NONADMIN_BOUNDARY_NOT_VERIFIED'],
    ['one_loop_assurance_unauthenticated_denied','ONE_LOOP_ANONYMOUS_BOUNDARY_NOT_VERIFIED']]){
    const v=valid();v[key]=false;
    assert.throws(()=>assertOneLoopProductionReleaseProof(v),new RegExp(code));
  }
  const cleanup=valid();cleanup.synthetic_user_cleanup='FAILED';
  assert.throws(()=>assertOneLoopProductionReleaseProof(cleanup),/ONE_LOOP_SYNTHETIC_CLEANUP_NOT_VERIFIED/);
  const err=valid();err.one_loop_assurance_failure_code='CANONICAL_ASSURANCE_PROVIDER_503';
  assert.throws(()=>assertOneLoopProductionReleaseProof(err),/ONE_LOOP_SOURCE_FAILURE_NOT_RESOLVED/);
});

test('15 exact real status counts and guard-concordant aggregate required, no invented rows',()=>{
  for(const bad of [
    {total:14,green:8,amber:3,red:3,overallStatus:'RED'},
    {total:15,green:8,amber:3,red:3,overallStatus:'RED'},
    {total:15,green:8,amber:3,red:4,overallStatus:'GREEN'},
    {total:15,green:-1,amber:3,red:13,overallStatus:'RED'},
    {total:15,green:8.5,amber:2.5,red:4,overallStatus:'RED'}
  ]){
    const v=valid();v.one_loop_assurance_counts=bad;
    assert.throws(()=>assertOneLoopProductionReleaseProof(v),/ONE_LOOP_CANONICAL_/);
  }
});

test('original production release validator gates the exact immutable provider receipt',()=>{
  const workflow=readFileSync('.github/workflows/production-release-readback.yml','utf8');
  const originalHook=readFileSync('netlify/functions/portal-authenticated-production-proof.mjs','utf8');
  const learning=JSON.parse(readFileSync('brain/learning/2026-10-30-one-loop-deploy-proof-release-guard-v1.json','utf8'));
  assert.match(workflow,/assertOneLoopProductionReleaseProof\(proof\)/);
  assert.match(workflow,/EXPECTED_COMMIT/);
  assert.match(workflow,/EXPECTED_DEPLOY_ID/);
  assert.match(workflow,/one_loop_assurance_proof:oneLoopProof.status/);
  assert.match(originalHook,/deploySucceeded/);
  assert.equal(learning.maturity,'OBSERVED');
  assert.equal(learning.evidence.actual_admin_http_status,200);
  assert.equal(learning.evidence.actual_nonadmin_http_status,403);
  assert.equal(learning.evidence.actual_anonymous_http_status,401);
  assert.equal(learning.evidence.nested_proof_payload_readback_proven,false);
});
