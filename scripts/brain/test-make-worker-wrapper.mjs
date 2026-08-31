import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const contract='brain/contracts/make-worker-wrapper-v1.json';
test('Make worker is thin, deterministic and result-unknown safe',()=>{
  assert.equal(fs.existsSync(contract),true,'Make worker wrapper contract must exist');
  const c=JSON.parse(fs.readFileSync(contract,'utf8'));
  assert.equal(c.version,'MAKE-WORKER-WRAPPER-v1');
  assert.equal(c.providerIoOutsideDbTransaction,true);
  assert.equal(c.nestedRetriesForbidden,true);
  assert.equal(c.resultUnknownRequiresReconciliation,true);
  assert.equal(c.directBrainTableMutationForbidden,true);
  assert.ok(c.requiredFlow.includes('claim_command_or_outbox'));
  assert.ok(c.requiredFlow.includes('record_cost'));
  assert.ok(c.requiredFlow.includes('ack_or_reconcile'));
});
