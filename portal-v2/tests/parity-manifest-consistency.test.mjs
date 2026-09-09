import test from 'node:test';
import assert from 'node:assert/strict';

import { LEGACY_PARITY_ITEMS, listOpenFunctionalParityItems } from '../parity-manifest.js';
import { FUNCTIONAL_PARITY_MANIFEST, openObligations } from '../parity-manifest-functional.js';

test('canonical parity manifest agrees with functional proof manifest',()=>{
  assert.equal(openObligations().length,0,'functional proof manifest must have no open obligations');
  assert.equal(listOpenFunctionalParityItems().length,0,'canonical parity manifest must not report proven capabilities as open');
  const proven=new Set(FUNCTIONAL_PARITY_MANIFEST.filter(item=>item.status==='proven').map(item=>item.legacyCapability));
  for(const item of LEGACY_PARITY_ITEMS){
    assert.equal(item.functionalParityStatus,proven.has(item.legacyId)?'proven':'open',`${item.legacyId} functional status drifted`);
  }
});
