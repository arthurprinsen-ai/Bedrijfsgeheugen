import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const evidence=JSON.parse(await readFile('brain/contracts/production-evidence-v1.json','utf8'));

test('production evidence distinguishes time traffic and adapter proof boundaries',()=>{
  assert.ok(evidence.evidenceClasses.outcomeHorizons);
  assert.ok(evidence.evidenceClasses.rumIngestSlo);
  assert.ok(evidence.evidenceClasses.adapterConformance);
  assert.equal(evidence.evidenceClasses.outcomeHorizons.earlyProofForbidden,true);
  assert.equal(evidence.evidenceClasses.rumIngestSlo.syntheticSamplesForbidden,true);
  assert.equal(evidence.evidenceClasses.adapterConformance.registrationAloneInsufficient,true);
});

test('none of the three generic capabilities may be marked PROVEN from implementation alone',()=>{
  for(const key of ['outcomeHorizons','rumIngestSlo','adapterConformance']){
    const item=evidence.evidenceClasses[key];
    assert.notEqual(item.currentStatus,'PROVEN');
    assert.equal(item.requiresIndependentReadback,true);
  }
  assert.equal(evidence.evidenceRules.documentationClaimIsEvidence,false);
  assert.equal(evidence.evidenceRules.ciSuccessAloneIsProductionProof,false);
});
