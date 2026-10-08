import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {deriveNetlifyDeploymentApplicability,NETLIFY_RUNTIME_EXACT}
 from '../tools/delivery/netlify-deployment-applicability.mjs';

const policy=JSON.parse(await readFile(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));
const headSha='f'.repeat(40);
const evaluate=path=>deriveNetlifyDeploymentApplicability({changedPaths:[path],policy,headSha});

test('every hosted tenant AI policy / runtime dependency requires exact Netlify production readback',()=>{
 for(const path of [
  'platform/runtime/attested-cloud-ai.mjs',
  'platform/runtime/attested-vertex-adapter.mjs',
  'platform/brain/verified-ai-runtime.mjs',
  'platform/brain/production-ai.mjs',
  'platform/policy/customer-ai-deployment.mjs'
 ]){
  assert.ok(NETLIFY_RUNTIME_EXACT.has(path),path);
  const scope=evaluate(path);
  assert.equal(scope.netlifyRuntimeRequired,true,path);
  assert.equal(scope.deploymentRequired,true,path);
 }
});
test('local offline-only appliance code must not falsely require hosted Netlify deploy',()=>{
 const scope=evaluate('platform/runtime/attested-local-ai.mjs');
 assert.equal(scope.netlifyRuntimeRequired,false);
 assert.equal(scope.deploymentRequired,false);
});
test('server handler modification must trigger real Netlify release verification',()=>{
 const scope=evaluate('netlify/functions/tenant-ai-inference.mjs');
 assert.equal(scope.deploymentRequired,true);
 const source=await readFile(new URL('../netlify/functions/tenant-ai-inference.mjs',import.meta.url),'utf8');
 assert.match(source,/raw.length>131072/);
 assert.match(source,/hasOwnProperty\.call\(data\|\|\{\},'__proto__'\)/);
 assert.match(source,/return handleTenantAiInference/);
});
