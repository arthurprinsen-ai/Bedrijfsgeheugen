import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyBackendOnlyPublishedPortalOverride}
 from '../tools/ci/portal-backend-only-production-sha-override.mjs';

const evidence=['.github/workflows/portal-v2-production-dom-readback.yml',
 'tests/brain-portal-canonical-browser-release-fence-20261029.test.mjs',
 'tools/ci/portal-canonical-browser-release-fence.mjs',
 'brain/learning/2026-10-29-immutable-alias-browser-transient-403-v1.json'];
const backend=[
 'supabase/functions/_shared/composer-quality-provenance.mjs',
 'supabase/functions/powerhouse-commercial-message-composer/index.ts',
 'supabase/migrations/20261029125607_powerhouse_cycle_writer_provenance_20261029.sql'
];

test('true protected main backend-only diff is eligible without pretending a Netlify release occurred',()=>{
 const result=verifyBackendOnlyPublishedPortalOverride([...evidence,...backend]);
 assert.equal(result.status,'PROVEN_NON_NETLIFY_SOURCE_DIFF');
 assert.equal(result.allowedBackendFiles,3);
 assert.equal(result.requiresIndependentExactImmutableAndPublicManifest,true);
});
test('governance-only changes keep historic narrow allowed source scope',()=>{
 const result=verifyBackendOnlyPublishedPortalOverride(evidence);
 assert.equal(result.allowedBackendFiles,0);
});
test('changes to Portal, Netlify, source policy, unclassified or dangerous file names remain blocked',()=>{
 for(const path of [
  'portal-v2/modules/powerhouse-observability.js','netlify/functions/brain-operating-loop.mjs',
  'platform/api/brain-operating-loop-handler.mjs','config/brain-delivery-system.json',
  'tools/delivery/netlify-deployment-applicability.mjs','supabase/migrations/../bad.sql',
  'static/site.js','supabase/functions/../../evil.ts'
 ]) assert.throws(()=>verifyBackendOnlyPublishedPortalOverride([...evidence,...backend,path]));
});
test('explicit backend classification cannot override real website, portal, browser or Netlify runtime impact',()=>{
 for(const override of [
  {deploymentRequired:true,websiteRequired:false,portalRequired:false,browserRequired:false,netlifyRuntimeRequired:false,deliveryLanes:['backend']},
  {deploymentRequired:false,websiteRequired:false,portalRequired:true,browserRequired:false,netlifyRuntimeRequired:false,deliveryLanes:['backend']},
  {deploymentRequired:false,websiteRequired:false,portalRequired:false,browserRequired:true,netlifyRuntimeRequired:false,deliveryLanes:['backend']},
  {deploymentRequired:false,websiteRequired:false,portalRequired:false,browserRequired:false,netlifyRuntimeRequired:true,deliveryLanes:['backend']},
  {deploymentRequired:false,websiteRequired:false,portalRequired:false,browserRequired:false,netlifyRuntimeRequired:false,deliveryLanes:['portal']}
 ]) assert.throws(()=>verifyBackendOnlyPublishedPortalOverride(backend,{classify:()=>override}),
    /PORTAL_PUBLISHED_BACKEND_NETLIFY_IMPACT_UNVERIFIED/);
});
test('malformed, duplicate or traversal paths never pass the exact source scope',()=>{
 for(const paths of [null,[],['\0'],['../foo'],[...evidence,evidence[0]]]){
  if(Array.isArray(paths)&&paths.length===0)continue;
  assert.throws(()=>verifyBackendOnlyPublishedPortalOverride(paths));
 }
});
test('the official main workflow still requires main-only dispatch, merged ancestor and unchanged double-SHA browser guard',()=>{
 const s=fs.readFileSync('.github/workflows/portal-v2-production-dom-readback.yml','utf8');
 assert.match(s,/if \[ "\$EVENT_NAME" != "workflow_dispatch" \]/);
 assert.match(s,/git merge-base --is-ancestor "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(s,/node tools\/ci\/portal-backend-only-production-sha-override\.mjs --verify/);
 assert.match(s,/node tools\/ci\/portal-canonical-browser-release-fence\.mjs --verify/g);
 assert.match(s,/PRODUCTION_URL: \$\{\{ env\.PORTAL_BROWSER_READBACK_URL \}\}/);
 assert.match(s,/Visual regression against approved PR baseline/);
 assert.doesNotMatch(s,/continue-on-error:\s*true/);
});
