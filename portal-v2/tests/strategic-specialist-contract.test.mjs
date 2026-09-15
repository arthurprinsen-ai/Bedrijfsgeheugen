import test from 'node:test';
import assert from 'node:assert/strict';
import { getCapabilityContract } from '../capability-contracts.js';

test('strategic model pages resolve to specialist semantic workspaces',()=>{
  for(const id of ['strategiemodellen','modellen']){
    const contract=getCapabilityContract(id);
    assert.ok(contract,`${id} must have a workspace contract`);
    assert.equal(contract.renderer,'strategic-models');
    assert.equal(contract.dataSlice,'portal.strategicModels');
    assert.equal(contract.browserContract.requiresPersistenceProof,true);
  }
});
