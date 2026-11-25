import test from 'node:test';
import assert from 'node:assert/strict';
import { readPortalComplianceInput } from '../portal-next/compliance-input-adapter.js';

function memoryStorage(entries) {
  const data = new Map(Object.entries(entries));
  return {
    length: data.size,
    key: index => [...data.keys()][index] ?? null,
    getItem: key => data.get(key) ?? null
  };
}

test('compliance legacy adapter does not infer customer identity from a solitary cached record', () => {
  const localStorage = memoryStorage({
    'bg_portaal_alice@example.test': JSON.stringify({beleid: {avg: 3, toegang: 3}})
  });
  assert.deepEqual(readPortalComplianceInput({localStorage}), {});
  assert.deepEqual(readPortalComplianceInput({localStorage,BG_COMPLIANCE_CONTEXT:{customerSlug:'alice'}}), {});
  assert.deepEqual(readPortalComplianceInput({localStorage,BG_COMPLIANCE_CONTEXT:{authenticatedUser:{email:'bob@example.test'}}}), {});
});

test('compliance legacy adapter reads only the exact normalized current-user key when explicitly supplied', () => {
  const localStorage = memoryStorage({
    'bg_portaal_alice@example.test': JSON.stringify({beleid: {avg: 3, toegang: 3}}),
    'bg_portaal_alice-other@example.test': JSON.stringify({beleid: {avg: 1, toegang: 1}}),
    'bg_portaal_bob@example.test': JSON.stringify({beleid: {avg: 1, toegang: 1}})
  });
  const alice = readPortalComplianceInput({
    localStorage,
    BG_COMPLIANCE_CONTEXT:{authenticatedUser:{email:' ALICE@EXAMPLE.TEST '}}
  });
  assert.equal(alice.processingRegister, true);
  assert.equal(alice.accessControls, true);
  assert.equal(alice.legacyPortalPolicy.avg,3);
  const bob = readPortalComplianceInput({
    localStorage,
    BG_COMPLIANCE_CONTEXT:{authenticatedUser:{email:'bob@example.test'}}
  });
  assert.equal(bob.processingRegister, false);
  assert.equal(bob.accessControls, false);
  assert.equal(bob.legacyPortalPolicy.avg,1);
});

test('direct customer compliance projection remains first and does not scan unrelated legacy keys', () => {
  const localStorage = memoryStorage({
    'bg_portaal_other@example.test': JSON.stringify({beleid: {avg: 3}})
  });
  const direct={usesAI:true,aiInventoryPresent:false};
  assert.equal(readPortalComplianceInput({
    BG_COMPLIANCE_INPUT:direct,
    BG_COMPLIANCE_CONTEXT:{authenticatedUser:{email:'alice@example.test'}},
    localStorage
  }),direct);
});

test('malformed and reserved legacy keys never become tenant-scoped compliance evidence', () => {
  const localStorage = memoryStorage({
    'bg_portaal_open': JSON.stringify({beleid: {avg: 3}}),
    'bg_portaal_alice@example.test': '{bad json'
  });
  assert.deepEqual(readPortalComplianceInput({
    localStorage,
    BG_COMPLIANCE_CONTEXT:{authenticatedUser:{email:'alice@example.test'}}
  }),{});
});
