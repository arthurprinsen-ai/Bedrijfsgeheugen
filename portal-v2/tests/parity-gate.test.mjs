import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_FUNCTIONAL_INVENTORY } from '../legacy-functional-inventory.js';
import { evaluatePortalParity, capabilityImplementationCoverage } from '../parity-gate.js';

const completeEvidence=Object.fromEntries(Object.keys(LEGACY_FUNCTIONAL_INVENTORY).map(key=>[key,{production:'verified'}]));

test('parity gate covers exactly all protected legacy capabilities',()=>{
  const coverage=capabilityImplementationCoverage();
  assert.deepEqual(Object.keys(coverage).sort(),Object.keys(LEGACY_FUNCTIONAL_INVENTORY).sort());
});

test('every protected capability owns fields models calculations actions dependencies persistence and browser evidence',()=>{
  const report=evaluatePortalParity({productionEvidence:completeEvidence});
  for(const item of report.capabilities){
    assert.deepEqual(item.missing,[],`${item.legacyKey}: ${item.missing.join(', ')}`);
  }
});

test('overall parity fails closed when production evidence is missing',()=>{
  const report=evaluatePortalParity({productionEvidence:{}});
  assert.equal(report.ok,false);
  assert.equal(report.verifiedCount,0);
  assert.equal(report.capabilities.length,25);
  assert.ok(report.capabilities.every(item=>item.missing.includes('production-evidence')));
});

test('overall parity requires all 25 capabilities verified',()=>{
  const report=evaluatePortalParity({productionEvidence:completeEvidence});
  assert.equal(report.ok,true);
  assert.equal(report.verifiedCount,25);
  assert.equal(report.total,25);
});
