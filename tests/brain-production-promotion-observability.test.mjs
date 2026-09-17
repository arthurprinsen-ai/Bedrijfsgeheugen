import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateProductionReadback } from '../tools/site-shell/verify-production-release.mjs';

const SHA='9353ecfc8d5a463a89963ae9b671318d3db02d54';
const DEPLOY_ID='6aab84b50000000000000000';

test('deployment-required production truth rejects missing concrete deploy identity',()=>{
  assert.throws(
    ()=>evaluateProductionReadback({mergeSha:SHA,deployedSha:SHA,deployStatus:'ready',routesOk:true,deploymentRequired:true}),
    /deployId is required/,
  );
});

test('deployment-required production truth accepts exact SHA only with concrete deploy identity',()=>{
  assert.deepEqual(
    evaluateProductionReadback({mergeSha:SHA,deployedSha:SHA,deployStatus:'ready',deployId:DEPLOY_ID,routesOk:true,deploymentRequired:true}),
    {status:'LIVE_VERIFIED',reason:'exact_deploy_identity_sha_and_routes_verified'},
  );
});

test('production workflow persists promotion-required state and reads deploy identity from canonical Netlify release artifact',async()=>{
  const workflow=await readFile('.github/workflows/production-release-readback.yml','utf8');
  assert.match(workflow,/promotion_required/);
  assert.match(workflow,/production-promotion-state\.json/);
  assert.match(workflow,/\/release\.json/);
  assert.match(workflow,/commit_ref/);
  assert.match(workflow,/deploy_id/);
  assert.match(workflow,/netlify_deploy_id/);
  assert.match(workflow,/--deploy-id/);
});

test('Netlify build already emits deploy identity in release.json',async()=>{
  const builder=await readFile('tools/bouw-release-evidence.mjs','utf8');
  assert.match(builder,/process\.env\.DEPLOY_ID/);
  assert.match(builder,/deploy_id/);
  assert.match(builder,/commit_ref/);
});
