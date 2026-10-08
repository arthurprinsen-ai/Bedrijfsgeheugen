import test from 'node:test';
import assert from 'node:assert/strict';
import {AUTH_RUNTIME_PATHS,evaluatePortalAuthEvidence} from '../tools/ci/portal-auth-evidence-freshness.mjs';

const evidence={status:'ACTIVE',production_claim:'LIVE_PROVEN',production_readback:{
  protected_runtime_sha:'a'.repeat(40),contract:'PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1',
  proof_status:'PROVEN',http_status:200,tenant_scope_verified:true,payload_shape_verified:true,
  synthetic_user_cleanup:'DELETED',netlify_deploy_id:'deploy-1',
}};
test('unchanged authenticated runtime retains verified production evidence',()=>{
  assert.equal(evaluatePortalAuthEvidence({record:evidence,changedPaths:[],headSha:'b'.repeat(40)}).state,'FRESH_RUNTIME_PROOF');
});
test('runtime changes invalidate previous LIVE_PROVEN evidence',()=>{
  for(const path of AUTH_RUNTIME_PATHS){
    const result=evaluatePortalAuthEvidence({record:evidence,changedPaths:[path],headSha:'b'.repeat(40)});
    assert.equal(result.ok,false,path);
    assert.equal(result.state,'STALE_RUNTIME_PROOF');
  }
});
test('docs and regression tests do not invalidate unchanged runtime evidence',()=>{
  assert.equal(evaluatePortalAuthEvidence({record:evidence,changedPaths:['docs/a.md','tests/test.mjs'],headSha:'b'.repeat(40)}).ok,true);
});
test('downgraded pending evidence permits the next protected production promotion',()=>{
  const record={...evidence,status:'CANDIDATE_PROTECTED_DELIVERY',production_claim:'PENDING_PRODUCTION_PROOF'};
  assert.equal(evaluatePortalAuthEvidence({record,changedPaths:[AUTH_RUNTIME_PATHS[0]],headSha:'b'.repeat(40)}).ok,true);
});
test('missing or incomplete production evidence always fails closed',()=>{
  for(const mutation of [{http_status:503},{synthetic_user_cleanup:'FAILED'},{tenant_scope_verified:false},{netlify_deploy_id:''}]){
    const record={...evidence,production_readback:{...evidence.production_readback,...mutation}};
    assert.equal(evaluatePortalAuthEvidence({record,changedPaths:[],headSha:'b'.repeat(40)}).ok,false);
  }
});
