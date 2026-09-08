import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_PARITY_ITEMS, GLOBAL_PARITY_CAPABILITIES, listOpenParityItems } from '../portal-v2/parity-manifest.js';

const globalBackings = Object.freeze({
  auth:'/api/portal-state',
  logout:'netlify-identity',
  export:'browser-download',
  import:'/api/portal-state',
  print:'identity-permission',
  feedback:'/api/portal-feedback',
  'customer-branding':'/api/portal-state',
  'mobile-navigation':'router'
});

test('every protected legacy workspace is parity-proven by production DOM readback', () => {
  assert.equal(LEGACY_PARITY_ITEMS.length, 24);
  for (const item of LEGACY_PARITY_ITEMS) {
    assert.equal(item.status, 'proven', item.legacyId);
    assert.equal(item.verification, 'production-dom-readback', item.legacyId);
    assert.ok(item.v2Pages.length > 0, item.legacyId);
    assert.ok(item.requiredBehaviors.length > 0, item.legacyId);
  }
});

test('every global capability names its real V2 backing and parity proof', () => {
  assert.equal(GLOBAL_PARITY_CAPABILITIES.length, 8);
  for (const item of GLOBAL_PARITY_CAPABILITIES) {
    assert.equal(item.status, 'proven', item.id);
    assert.equal(item.verification, 'production-dom-readback', item.id);
    assert.equal(item.backing, globalBackings[item.id], item.id);
  }
});

test('parity manifest has no unresolved obligations', () => {
  assert.deepEqual(listOpenParityItems(), []);
});
