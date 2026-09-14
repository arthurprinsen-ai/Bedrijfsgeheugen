import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('automatic commercial outcome signal contract stays fail closed and canonical',async()=>{
  const contract=JSON.parse(await readFile('brain/learning/commercial-outcome-signal-contract.json','utf8'));
  assert.equal(contract.delegates_to,'RECORD_OUTCOME');
  assert.equal(contract.owns_persistence,false);
  assert.equal(contract.auto_settle.verified,true);
  assert.equal(contract.auto_settle.minimum_confidence,0.9);
  assert.equal(contract.auto_settle.requires_exact_open_prediction,true);
  assert.equal(contract.auto_settle.requires_evidence,true);
});
