import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {deriveNetlifyDeploymentApplicability,NETLIFY_RUNTIME_EXACT} from
 '../tools/delivery/netlify-deployment-applicability.mjs';

const policy=JSON.parse(await readFile(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));
const headSha='a'.repeat(40);
test('one original authenticated Portal guard source change requires an actual Netlify deployment',async()=>{
 const path='brain/observability/one-loop-guard-diagnostics.mjs';
 assert.ok(NETLIFY_RUNTIME_EXACT.has(path));
 const scope=deriveNetlifyDeploymentApplicability({changedPaths:[path],policy,headSha});
 assert.equal(scope.netlifyRuntimeRequired,true);
 assert.equal(scope.deploymentRequired,true);
 assert.equal(scope.reason,'netlify-impact');
 for(const pathname of ['netlify/functions/powerhouse-one-loop-assurance.mjs',
  'netlify/functions/powerhouse-cro-other-data.mjs']){
  const src=await readFile(new URL('../'+pathname,import.meta.url),'utf8');
  assert.match(src,/loadOneLoopAssuranceWithDiagnostics/);
  assert.match(src,/one-loop-guard-diagnostics\.mjs/);
 }
});
test('mere Brain documentation never triggers an unnecessary Netlify deployment',()=>{
 for(const path of ['brain/learning/2026-10-31-mira-unique-source-winner-v1.json',
  'docs/changes/2026-10-31-daily-publication-no-silent-gap-v1.md']){
  const scope=deriveNetlifyDeploymentApplicability({changedPaths:[path],policy,headSha});
  assert.equal(scope.deploymentRequired,false,path);
 }
});
