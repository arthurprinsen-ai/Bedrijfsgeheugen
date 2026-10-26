import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {requiresBrainRuntimeAuthenticatedProof} from '../tools/delivery/netlify-deployment-applicability.mjs';

test('real tenant Brain runtime imports require authenticated production proof',()=>{
  for(const path of [
    'brain/operating-loop/living-memory.mjs',
    'brain/operating-loop/store.mjs',
    'netlify/functions/brain-operating-loop.mjs',
    'platform/api/brain-operating-loop-handler.mjs'
  ]) assert.equal(requiresBrainRuntimeAuthenticatedProof([path]),true,path);
});
test('unrelated governance and hosted functions do not create duplicate portal probes',()=>{
  for(const path of [
    'brain/learning/2026-10-22-netlify-brain-operating-loop-deployment-truth-v1.json',
    'docs/changes/example.md',
    '.agents/skills/powerhouse-green-assurance/SKILL.md',
    'netlify/functions/instagram-video-frames.mjs',
    'platform/system-map/canonical-system-map.mjs'
  ]) assert.equal(requiresBrainRuntimeAuthenticatedProof([path]),false,path);
});
test('mixed batch cannot skip proof when a Brain module changes',()=>{
  assert.equal(requiresBrainRuntimeAuthenticatedProof([
    'docs/changes/example.md',
    'brain/operating-loop/living-memory.mjs'
  ]),true);
});
test('existing production readback demands actual authenticated tenant proof for Brain runtime',async()=>{
  const workflow=await readFile(new URL('../.github/workflows/production-release-readback.yml',import.meta.url),'utf8');
  assert.match(workflow,/import \{ deriveNetlifyDeploymentApplicability, requiresBrainRuntimeAuthenticatedProof \}/);
  assert.match(workflow,/const brainRuntimeAuthProofRequired=requiresBrainRuntimeAuthenticatedProof\(changedPaths\)/);
  assert.match(workflow,/brain_runtime_auth_proof_required=\$\{brainRuntimeAuthProofRequired\}/);
  const step=workflow.match(/- name: Verify authenticated Portal production API proof\n\s*if: ([^\n]+)/);
  assert.ok(step,'canonical authenticated proof step missing');
  assert.match(step[1],/steps\.scope\.outputs\.portal_required == 'true'/);
  assert.match(step[1],/steps\.scope\.outputs\.brain_runtime_auth_proof_required == 'true'/);
  assert.match(step[1],/steps\.deploy\.outcome == 'success'/);
  assert.match(workflow,/proof\?\.status!=='PROVEN'/);
  assert.match(workflow,/proof\?\.tenant_scope_verified!==true/);
  assert.match(workflow,/proof\?\.synthetic_user_cleanup!=='DELETED'/);
});
