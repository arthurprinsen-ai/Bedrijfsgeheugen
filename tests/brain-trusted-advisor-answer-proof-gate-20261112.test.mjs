import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAnswerAssurance} from '../portal-v2/trusted-advisor-assurance.js';

test('original portal AI answer must not show verified without an independent receipt',()=>{
  const noReceipt=normalizeAnswerAssurance({status:'verified',source:'Tenant',claimVerification:'independently_verified'});
  assert.equal(noReceipt.status,'unverified');
  assert.ok(noReceipt.limitations.some(x=>x.includes('bewijsreferentie')));
});

test('contradictory metadata never creates a verified claim',()=>{
  const answer=normalizeAnswerAssurance({status:'verified',source:'Tenant',claimVerification:'not_independently_verified',evidenceRef:'provider:x'});
  assert.equal(answer.status,'unverified');
});

test('sourced verified presentation requires all three explicit fields',()=>{
  const answer=normalizeAnswerAssurance({status:'verified',source:'Tenant',claimVerification:'independently_verified',evidenceRef:'provider:x'});
  assert.equal(answer.status,'verified');
  assert.equal(answer.evidenceRef,'provider:x');
});

test('unknown source downgrades grounded and otherwise-verified presentation',()=>{
  assert.equal(normalizeAnswerAssurance({status:'grounded'}).status,'unverified');
  assert.equal(normalizeAnswerAssurance({status:'verified',claimVerification:'independently_verified',evidenceRef:'provider:x'}).status,'unverified');
});
