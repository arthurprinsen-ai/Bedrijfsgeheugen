import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LEGACY_FUNCTIONAL_INVENTORY } from '../legacy-functional-inventory.js';
import { getCapabilityContract, listFunctionalContracts } from '../capability-contracts.js';
import { workspaceModel } from '../workspace-shell.js';

const allowedModes=new Set(['workspace','canvas','form','cockpit','report','builder']);

test('every protected legacy capability has a non-generic V2 functional contract',()=>{
  const contracts=listFunctionalContracts();
  assert.equal(contracts.length,24);
  for(const [legacyCapability,item] of Object.entries(LEGACY_FUNCTIONAL_INVENTORY)){
    const contract=getCapabilityContract(item.v2Page);
    assert.ok(contract,`${legacyCapability} missing contract for ${item.v2Page}`);
    assert.equal(contract.legacyCapability,legacyCapability);
    assert.ok(allowedModes.has(contract.mode),`${legacyCapability} has invalid mode`);
    assert.notEqual(contract.renderer,'generic');
    assert.ok(contract.schemaVersion>=1);
    assert.ok(contract.dataSlice);
    assert.ok(Array.isArray(contract.validators));
    assert.ok(Array.isArray(contract.calculators));
    assert.ok(Array.isArray(contract.dependencies));
    assert.ok(Array.isArray(contract.completionRules));
    assert.ok(contract.browserContract?.editAndReopen===true);
  }
});

test('workspace model exposes SaaS work tabs and save state without changing domain state',()=>{
  const contract=getCapabilityContract('profiel');
  const source={profile:{name:'Acme'}};
  const model=workspaceModel(contract,{title:'Profiel',description:'Werk je bedrijfsprofiel bij',saveStatus:'dirty',state:source});
  assert.deepEqual(model.tabs.map(tab=>tab.id),['invullen','analyse','acties','bewijs']);
  assert.equal(model.saveStatus,'dirty');
  assert.equal(model.mode,'form');
  assert.equal(model.title,'Profiel');
  assert.deepEqual(source,{profile:{name:'Acme'}});
});

test('builder and proven specialist pages keep specialist renderer identities',()=>{
  assert.equal(getCapabilityContract('koppelingen')?.renderer,'connector-builder');
  assert.equal(getCapabilityContract('strategy-dna')?.renderer,'strategy-dna');
});

test('page shell dispatches protected parity pages through the functional workspace shell',()=>{
  const source=fs.readFileSync(new URL('../page-shell.js',import.meta.url),'utf8');
  assert.match(source,/getCapabilityContract/);
  assert.match(source,/mountWorkspace/);
  assert.match(source,/const contract=getCapabilityContract\(pageId\)/);
  assert.match(source,/contract\?\.legacyCapability/);
  assert.match(source,/mountWorkspace\(native,contract/);
});
