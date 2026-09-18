import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_CAPABILITY_CATALOG, AI_CAPABILITY_IDS, AI_CAPABILITY_COUNT } from '../ai-capability-catalog.js';

test('Portal V2 preserves all nine legacy AI capability layers and all 86 capabilities',()=>{
  assert.equal(AI_CAPABILITY_CATALOG.lagen.length,9);
  assert.equal(AI_CAPABILITY_COUNT,86);
  assert.equal(new Set(AI_CAPABILITY_IDS).size,86);
  assert.deepEqual(AI_CAPABILITY_CATALOG.lagen.map(x=>x.caps.length),[5,10,14,14,8,11,7,10,7]);
});

test('every migrated capability keeps the exact decision metadata needed by the native workspace',()=>{
  for(const layer of AI_CAPABILITY_CATALOG.lagen){
    assert.ok(layer.k);
    assert.equal(layer.opties.length,5);
    for(const cap of layer.caps){
      assert.match(cap.id,/^[a-z]+(?:[a-z]+)?-\d{2}$/);
      assert.ok(cap.n);
      assert.ok(cap.d);
      assert.ok(cap.v);
      assert.ok(['nu','groei','later'].includes(cap.rel));
    }
  }
});
