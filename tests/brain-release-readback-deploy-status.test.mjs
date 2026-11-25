import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyNetlifyDeploymentEvidence } from '../tools/delivery/netlify-deployment-applicability.mjs';

test('canonical production readback wires deploy applicability without false live status',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/production-release-readback.yml',import.meta.url),'utf8');
  assert.match(workflow,/classifyNetlifyDeploymentEvidence/);
  assert.match(workflow,/deployment_status=\$\{deployEvidence.status\}/);
  assert.equal(classifyNetlifyDeploymentEvidence({applicability:{deploymentRequired:false,reason:'non-netlify-impact'}}).status,'NOT_REQUIRED');
  assert.equal(classifyNetlifyDeploymentEvidence({applicability:{deploymentRequired:true,reason:'netlify-impact'}}).status,'UNKNOWN');
});
