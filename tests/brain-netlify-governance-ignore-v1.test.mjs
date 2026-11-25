import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveNetlifyDeploymentApplicability, NETLIFY_GOVERNANCE_EXACT } from '../tools/delivery/netlify-deployment-applicability.mjs';

const SHA='9353ecfc8d5a463a89963ae9b671318d3db02d54';

async function policy(){
  return JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
}

test('Netlify governance applicability keeps CI policy out of production builds', async () => {
  const p=await policy();
  assert.equal(NETLIFY_GOVERNANCE_EXACT.has('site/website-release-risk.json'),true);
  const result=deriveNetlifyDeploymentApplicability({changedPaths:['site/website-release-risk.json','tools/ci/netlify-ignore-build.mjs'],headSha:SHA,policy:p});
  assert.equal(result.deploymentRequired,false);
  assert.deepEqual(result.runtimeChangedPaths,[]);
});

test('Supabase-only changes do not require Netlify while Netlify runtime still does', async () => {
  const p=await policy();
  const supabase=deriveNetlifyDeploymentApplicability({changedPaths:['supabase/config.toml','supabase/functions/social-recovery-runner/index.ts'],headSha:SHA,policy:p});
  assert.equal(supabase.deploymentRequired,false);
  const netlify=deriveNetlifyDeploymentApplicability({changedPaths:['netlify/functions/connector-readiness.mjs'],headSha:SHA,policy:p});
  assert.equal(netlify.deploymentRequired,true);
  assert.equal(netlify.netlifyRuntimeRequired,true);
  assert.equal(netlify.browserRequired,false);
});

test('website and portal changes retain exact Netlify deployment and browser proof', async () => {
  const p=await policy();
  for(const changedPaths of [['index.html'],['portal-v2/app.js']]){
    const result=deriveNetlifyDeploymentApplicability({changedPaths,headSha:SHA,policy:p});
    assert.equal(result.deploymentRequired,true);
    assert.equal(result.browserRequired,true);
  }
});

test('all Netlify decision consumers use the canonical applicability authority', async () => {
  const [ignore,required,snapshot,readback]=await Promise.all([
    readFile('tools/ci/netlify-ignore-build.mjs','utf8'),
    readFile('.github/workflows/required-test.yml','utf8'),
    readFile('.github/workflows/production-source-snapshot.yml','utf8'),
    readFile('.github/workflows/production-release-readback.yml','utf8'),
  ]);
  for(const source of [ignore,required,snapshot,readback]) assert.match(source,/deriveNetlifyDeploymentApplicability/);
  assert.doesNotMatch(required,/netlifyGovernanceExact/);
  assert.doesNotMatch(required,/netlifyBuildPrefixes/);
});
