import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Historical/shadow/canary evaluation executes the ORIGINAL two-tenant deploy
// proof suite (including real signed-role test shape, positive original
// 15-loop readback and negative 401/403 readback); no second runner/provider.
import './portal-authenticated-production-proof.test.mjs';
import './brain-one-loop-assurance-readback-20261030.test.mjs';

test('ONE BRAIN learning invokes the original deploy proof and never relabels business guards',()=>{
  const learning=JSON.parse(readFileSync('brain/learning/2026-10-30-one-loop-admin-auth-production-proof-v1.json','utf8'));
  const core=readFileSync('platform/api/portal-authenticated-production-proof-core.mjs','utf8');
  const route=readFileSync('netlify/functions/powerhouse-one-loop-assurance.mjs','utf8');
  assert.equal(learning.maturity,'OBSERVED');
  assert.equal(learning.old_state.runtime_error_flags,2);
  for(const mode of ['historical_replay','shadow','canary'])
    assert.deepEqual(learning.evaluation[mode],['tests/brain-one-loop-admin-production-proof-20261030.test.mjs']);
  assert.match(core,/one_loop_assurance_proof/);
  assert.match(core,/assurance\.admin&&\s*assurance\.nonadmin&&assurance\.anonymous/);
  assert.match(core,/synthetic_user_cleanup/);
  assert.match(route,/isPowerhouseAdmin\(user/);
  assert.match(route,/UNAUTHENTICATED/);
  assert.match(route,/POWERHOUSE_ADMIN_REQUIRED/);
  assert.doesNotMatch(core,/user_metadata\.roles|userMetadata\.roles/);
  assert.doesNotMatch(core,/\.upsert\(|\.insert\(.*forecast|\.insert\(.*publication/);
});
