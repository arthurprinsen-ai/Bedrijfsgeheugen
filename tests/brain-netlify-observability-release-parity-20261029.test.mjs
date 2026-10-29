import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveNetlifyDeploymentApplicability,requiresBrainRuntimeAuthenticatedProof,NETLIFY_RUNTIME_EXACT } from '../tools/delivery/netlify-deployment-applicability.mjs';

const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
const sha='a'.repeat(40);
test('Netlify-imported Brain publication readback cannot be classified governance-only',()=>{
 const file='brain/observability/publication-evidence-readback.mjs';
 assert.equal(NETLIFY_RUNTIME_EXACT.has(file),true);
 const plan=deriveNetlifyDeploymentApplicability({changedPaths:[file],headSha:sha,policy});
 assert.equal(plan.netlifyRuntimeRequired,true);
 assert.equal(plan.deploymentRequired,true);
 assert.equal(requiresBrainRuntimeAuthenticatedProof([file]),true);
});
test('other Netlify-imported observability projections also demand real deploy',()=>{
 for(const file of ['brain/observability/failure-coverage-projection.mjs','brain/observability/cycle-evidence-coverage.mjs']){
  const plan=deriveNetlifyDeploymentApplicability({changedPaths:[file],headSha:sha,policy});
  assert.equal(plan.deploymentRequired,true,file);
 }
});
test('current canonical Netlify observability endpoint deploys authenticated versioned proof',()=>{
 const file='netlify/functions/powerhouse-observability.mjs';
 const text=fs.readFileSync(file,'utf8');
 assert.equal(deriveNetlifyDeploymentApplicability({changedPaths:[file],headSha:sha,policy}).deploymentRequired,true);
 assert.equal(requiresBrainRuntimeAuthenticatedProof([file]),true);
 assert.match(text,/PUBLICATION_EVIDENCE_CONTRACT='social-publication-proof-v2'/);
 assert.match(text,/publicationEvidence:\{\.\.\.publicationEvidence,contract:PUBLICATION_EVIDENCE_CONTRACT\}/);
 assert.match(text,/if\(!isPowerhouseAdmin\(user/);
 assert.match(text,/if\(!tenantId\)/);
});
test('governance-only docs remain a no-deploy change, no forced deployment',()=>{
 const plan=deriveNetlifyDeploymentApplicability({changedPaths:['docs/changes/example.md','brain/learning/example.json'],headSha:sha,policy});
 assert.equal(plan.deploymentRequired,false);
 assert.equal(plan.netlifyRuntimeRequired,false);
});
