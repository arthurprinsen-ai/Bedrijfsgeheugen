import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveNetlifyDeploymentApplicability} from '../tools/delivery/netlify-deployment-applicability.mjs';

const policy=JSON.parse(readFileSync(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));
const sha='a'.repeat(40);
const classify=changedPaths=>deriveNetlifyDeploymentApplicability({changedPaths,headSha:sha,policy});

test('P0 5241: executable production build entry is mandatory Netlify parity/runtime',()=>{
  const result=classify(['tools/ci/netlify-build-entry.mjs']);
  assert.equal(result.deploymentRequired,true,'a build-entry change must never bypass production parity');
  assert.equal(result.netlifyRuntimeRequired,true);
  assert.deepEqual([...result.runtimeChangedPaths],['tools/ci/netlify-build-entry.mjs']);
});

test('P0 5241: documentation, learning and other governance-only paths stay non-runtime',()=>{
  const result=classify(['docs/changes/incident.md','.agents/skills/example/SKILL.md','tests/smoke.test.mjs','tools/ci/safe-unrelated-ci-helper.mjs']);
  assert.equal(result.deploymentRequired,false);
  assert.deepEqual([...result.runtimeChangedPaths],[]);
});

test('P0 5241: build engine keeps exact ordered transforms and writes sanitized failing phase evidence',()=>{
  const source=readFileSync(new URL('../tools/ci/netlify-build-entry.mjs',import.meta.url),'utf8');
  assert.match(source,/NETLIFY_BUILD_PHASE_FAILURE_V1/);
  assert.match(source,/NETLIFY_BUILD_PHASE_FAILURE/);
  assert.match(source,/await recordPhaseFailure\(\{name,script,status:result\.status,error:result\.error\}\)/);
  assert.match(source,/NETLIFY_BUILD_PROFILE_PATH/);
  assert.match(source,/if\(result\.error\) throw result\.error;/);
  assert.match(source,/NETLIFY_BUILD_PHASE_FAILED/);
  assert.doesNotMatch(source,/JSON\.stringify\(process\.env\)/);
});
