import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveNetlifyDeploymentApplicability } from '../tools/delivery/netlify-deployment-applicability.mjs';
import { projectLivingMemory } from '../brain/operating-loop/living-memory.mjs';
import policy from '../config/brain-delivery-system.json' with { type: 'json' };
const sha='a'.repeat(40);
const classify=changedPaths=>deriveNetlifyDeploymentApplicability({changedPaths,headSha:sha,policy});
test('Netlify-imported Brain operating-loop must deploy and cannot be declared not applicable',()=>{
  for(const p of ['brain/operating-loop/living-memory.mjs','brain/operating-loop/store.mjs','brain/operating-loop/model.mjs']){
    const r=classify([p]);
    assert.equal(r.netlifyRuntimeRequired,true,p);
    assert.equal(r.deploymentRequired,true,p);
    assert.equal(r.reason,'netlify-impact',p);
  }
});
test('pure learning/docs do not trigger Netlify',()=>{
  for(const p of ['brain/learning/incident.json','docs/changes/example.md','.agents/skills/powerhouse-green-assurance/SKILL.md']){
    const r=classify([p]);
    assert.equal(r.deploymentRequired,false,p);
  }
});
test('mixed governance/backend runtime changes trigger a real deploy',()=>{
  const r=classify(['docs/changes/example.md','brain/operating-loop/living-memory.mjs','tools/delivery/netlify-deployment-applicability.mjs']);
  assert.equal(r.deploymentRequired,true);
  assert.ok(r.runtimeChangedPaths.includes('brain/operating-loop/living-memory.mjs'));
});
test('unmodified nonmemory evidence records retain original field shape',()=>{
  const r=projectLivingMemory([{id:'e-1',kind:'evidence',tenantId:'t-1',verified:true,observedAt:'2026-10-22T17:00:00Z'}],{now:'2026-10-22T17:00:00Z'}).records[0];
  assert.equal(Object.hasOwn(r,'proof'),false);
  assert.equal(Object.hasOwn(r,'status'),false);
});
