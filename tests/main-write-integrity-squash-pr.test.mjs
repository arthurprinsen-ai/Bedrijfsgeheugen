import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMainWrite } from '../tools/main-write-integrity.mjs';

const materialPaths=['tools/seo-order-engine/validate.mjs','config/seo-growth-loop.json'];

test('single-parent squash merge associated with a merged PR is governed',()=>{
  const result=classifyMainWrite({
    branch:'main',
    parentCount:1,
    changedPaths:materialPaths,
    headSha:'abc123',
    associatedPullRequests:[{number:997,merged:true,baseRef:'main',mergeCommitSha:'abc123'}]
  });
  assert.equal(result.status,'GOVERNED_SQUASH_MERGE');
  assert.equal(result.productionGreenAllowed,true);
  assert.equal(result.recoveryRequired,false);
});

test('single-parent material write without merged PR association still fails closed',()=>{
  const result=classifyMainWrite({branch:'main',parentCount:1,changedPaths:materialPaths,headSha:'abc123',associatedPullRequests:[]});
  assert.equal(result.status,'DIRECT_MAIN_WRITE_INCIDENT');
  assert.equal(result.productionGreenAllowed,false);
  assert.equal(result.recoveryRequired,true);
});

test('unverifiable PR association on a material single-parent main write fails closed',()=>{
  const result=classifyMainWrite({branch:'main',parentCount:1,changedPaths:materialPaths,headSha:'abc123'});
  assert.equal(result.status,'UNKNOWN_MAIN_WRITE');
  assert.equal(result.productionGreenAllowed,false);
  assert.equal(result.recoveryRequired,true);
});
