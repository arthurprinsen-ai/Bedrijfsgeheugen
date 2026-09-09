import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_FUNCTIONAL_INVENTORY } from '../legacy-functional-inventory.js';
import { FUNCTIONAL_PARITY_MANIFEST, openObligations, functionalDefinition } from '../parity-manifest-functional.js';

const protectedPages=Object.values(LEGACY_FUNCTIONAL_INVENTORY).map(item=>item.v2Page);

test('every protected legacy capability has an explicit functional implementation contract',()=>{
  assert.equal(FUNCTIONAL_PARITY_MANIFEST.length,24);
  for(const pageId of protectedPages){
    const definition=functionalDefinition(pageId);
    assert.ok(definition,`missing ${pageId}`);
    assert.equal(definition.pageId,pageId);
    assert.ok(definition.dataSlice.startsWith('portal.'));
    assert.ok(definition.implementation);
    assert.ok(definition.browserProof);
    assert.ok(definition.stateProof);
  }
});

test('full functional parity has zero open obligations',()=>{
  assert.deepEqual(openObligations(),[]);
});
