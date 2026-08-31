import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const path='brain/contracts/production-evidence-v1.json';
const required=['legacyParity','rumPerformance','integrationObservability','recoveryCoverage','productionIdentity'];

test('production evidence distinguishes built from proven',()=>{
  assert.equal(fs.existsSync(path),true,'production evidence contract must exist');
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  assert.equal(c.version,'PRODUCTION-EVIDENCE-v1');
  for(const key of required) assert.ok(c.evidenceClasses?.[key],`missing ${key}`);
  assert.equal(c.states.BUILT_NOT_PROVEN.requiresRuntimeEvidence,false);
  assert.equal(c.states.PROVEN.requiresRuntimeEvidence,true);
  assert.equal(c.states.PROVEN.requiresIndependentReadback,true);
});

test('RUM and integration evidence carry freshness and exact identity',()=>{
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  assert.equal(c.evidenceClasses.rumPerformance.targets.cachedMs,1000);
  assert.equal(c.evidenceClasses.rumPerformance.targets.interactiveMs,2000);
  for(const x of ['window','percentile','observedAt','sourceRevision','sampleCount']) assert.equal(c.evidenceClasses.rumPerformance.required.includes(x),true,`RUM missing ${x}`);
  for(const x of ['health','freshness','lastError','owner','cost','revision']) assert.equal(c.evidenceClasses.integrationObservability.required.includes(x),true,`integration missing ${x}`);
});
