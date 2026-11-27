import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveNetlifyDeploymentApplicability} from '../tools/delivery/netlify-deployment-applicability.mjs';
import {classifyTerminalReleaseScope} from '../tools/delivery/terminal-release-scope.mjs';
const path='data/regulatory-source-state.json';
const policy=JSON.parse(readFileSync('config/brain-delivery-system.json','utf8'));
const headSha='a'.repeat(40);
test('regulatory projection is a real hosted runtime dependency while retaining automation ownership',()=>{
  assert.ok(readFileSync('portal-v2/regulatory-baseline.js','utf8').includes('../'+path));
  const scope=deriveNetlifyDeploymentApplicability({changedPaths:[path,'docs/changes/example.md'],policy,headSha});
  assert.equal(scope.deploymentRequired,true);
  assert.equal(scope.netlifyRuntimeRequired,true);
  assert.ok(scope.deliveryLanes.includes('automation'));
  assert.deepEqual(classifyTerminalReleaseScope([path]),{website:true,edge:false,other:false,non_runtime:false});
});
test('governance and unrelated data are not blanket-hosted dependencies',()=>{
  const scope=deriveNetlifyDeploymentApplicability({changedPaths:['docs/changes/example.md','brain/learning/example.json'],policy,headSha});
  assert.equal(scope.deploymentRequired,false);
  assert.equal(classifyTerminalReleaseScope(['data/unclassified-example.json']).website,false);
  assert.equal(classifyTerminalReleaseScope(['data/unclassified-example.json']).other,true);
});
