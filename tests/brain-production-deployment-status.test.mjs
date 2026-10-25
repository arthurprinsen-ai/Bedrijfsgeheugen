import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyProductionDeployment } from '../tools/delivery/production-deployment-status.mjs';
import { readFileSync } from 'node:fs';
const policy=JSON.parse(readFileSync(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));
const mainSha='a'.repeat(40), deployedSha='b'.repeat(40);
const base={ mainSha,deployedSha,deployId:'deploy-1',context:'production',policy,comparisonStatus:'ahead' };
test('governance-only drift does not demand a deploy',()=>{
 const r=classifyProductionDeployment({...base,changedPaths:['AGENTS.md','.agents/skills/foo/SKILL.md','.github/workflows/powerhouse-repository-janitor.yml','platform/system-map/canonical-system-map.mjs']});
 assert.equal(r.state,'DEPLOY_NOT_REQUIRED');
 assert.deepEqual(r.runtimeChangedPaths,[]);
});
test('runtime changes require a deploy',()=>{
 assert.equal(classifyProductionDeployment({...base,changedPaths:['netlify/functions/brain-operating-loop.mjs']}).state,'DEPLOY_REQUIRED');
});
test('exact published SHA proves release identity',()=>{
 assert.equal(classifyProductionDeployment({...base,deployedSha:mainSha,changedPaths:[]}).state,'PRODUCTION_VERIFIED');
});
test('missing proof never green',()=>{
 assert.equal(classifyProductionDeployment({...base,deployId:null,changedPaths:[]}).state,'UNKNOWN');
 assert.equal(classifyProductionDeployment({...base,comparisonComplete:false,changedPaths:[]}).state,'UNKNOWN');
 assert.equal(classifyProductionDeployment({...base,comparisonStatus:'diverged',changedPaths:[]}).state,'UNKNOWN');
});
